import crypto from 'node:crypto';

const baseUrl = String(process.env.SINGAPAY_BASE_URL || '').replace(/\/$/, '');
const clientId = process.env.SINGAPAY_CLIENT_ID || '';
const clientSecret = process.env.SINGAPAY_CLIENT_SECRET || process.env.SINGAPAY_SECRET_KEY || '';
const apiKey = process.env.SINGAPAY_API_KEY || '';
const webhookSecret = process.env.SINGAPAY_HMAC_VALIDATION_KEY || process.env.SINGAPAY_WEBHOOK_SECRET || clientSecret;
const configuredAccountId = process.env.SINGAPAY_ACCOUNT_ID || '';

let accessToken = '';
let accessTokenExpiresAt = 0;
let accountId = configuredAccountId;

function jakartaDateStamp() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function signatureForAccessToken() {
  return crypto.createHmac('sha512', clientSecret).update(`${clientId}_${clientSecret}_${jakartaDateStamp()}`).digest('hex');
}

function configStatus() {
  const missing = [];
  if (!baseUrl) missing.push('SINGAPAY_BASE_URL');
  if (!apiKey) missing.push('SINGAPAY_API_KEY');
  if (!clientId) missing.push('SINGAPAY_CLIENT_ID');
  if (!clientSecret) missing.push('SINGAPAY_CLIENT_SECRET');
  return { configured: missing.length === 0, missing, account_configured: Boolean(accountId), base_url: baseUrl };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || `SingaPay mengembalikan HTTP ${response.status}.`;
    const error = new Error(String(message));
    error.status = response.status;
    error.provider = data;
    throw error;
  }
  return data;
}

async function getAccessToken() {
  const status = configStatus();
  if (!status.configured) throw new Error(`Credential SingaPay belum lengkap: ${status.missing.join(', ')}.`);
  if (accessToken && accessTokenExpiresAt > Date.now() + 30000) return accessToken;
  const response = await fetch(`${baseUrl}/api/v1.1/access-token/b2b`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-PARTNER-ID': apiKey, 'X-CLIENT-ID': clientId, 'X-Signature': signatureForAccessToken() },
    body: JSON.stringify({ grant_type: 'client_credentials' })
  });
  const data = await parseResponse(response);
  const token = data?.data?.access_token || data?.access_token || data?.data?.token || data?.token;
  if (!token) throw new Error('Respons token SingaPay tidak berisi access token.');
  const expiresIn = Number(data?.data?.expires_in || data?.expires_in || 3600);
  accessToken = String(token);
  accessTokenExpiresAt = Date.now() + Math.max(60, expiresIn) * 1000;
  return accessToken;
}

async function singapayRequest(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'X-PARTNER-ID': apiKey, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return parseResponse(response);
}

async function getAccountId() {
  if (accountId) return accountId;
  const response = await singapayRequest('/api/v1.0/accounts');
  const accounts = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  const active = accounts.find((item) => item?.status === 'active') || accounts[0];
  if (!active?.id) throw new Error('Akun SingaPay aktif belum ditemukan. Isi SINGAPAY_ACCOUNT_ID atau buat akun Sandbox terlebih dahulu.');
  accountId = String(active.id);
  return accountId;
}

export async function createPaymentLink({ reference, description, amount, successRedirectUrl, expiredRedirectUrl, customerName, customerEmail, metadata }) {
  const id = await getAccountId();
  const response = await singapayRequest(`/api/v2.0/payment-link/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify({
      reff_no: reference,
      description,
      payment_link_type: 'total',
      max_usage: 1,
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      total_amount: Number(amount),
      success_redirect_url: successRedirectUrl,
      expired_redirect_url: expiredRedirectUrl,
      optional_metadata: metadata || undefined,
      customer_name: customerName || undefined,
      customer_email: customerEmail || undefined
    })
  });
  const data = response?.data || response;
  const paymentUrl = data?.payment_url || data?.payment_link?.payment_url || data?.url;
  if (!paymentUrl) throw new Error('SingaPay tidak mengembalikan URL pembayaran.');
  return { ...data, payment_url: paymentUrl, account_id: id };
}

export async function getPaymentLinkStatus({ paymentLinkId, reference }) {
  if (paymentLinkId) {
    const response = await singapayRequest(`/api/v2.0/payment-link/${encodeURIComponent(paymentLinkId)}`);
    const data = response?.data || response;
    const currentUsage = Number(data?.current_usage || 0);
    const maxUsage = Number(data?.max_usage || 0);
    const usageCompleted = currentUsage > 0 && (maxUsage === 0 || currentUsage >= maxUsage);
    return { status: usageCompleted ? 'paid' : (data?.status || data?.payment_status || data?.transaction?.status || null), data };
  }
  const id = await getAccountId();
  const query = reference ? `?reff_no=${encodeURIComponent(reference)}&per_page=25` : '?per_page=25';
  const response = await singapayRequest(`/api/v1.0/payment-link-histories/${encodeURIComponent(id)}${query}`);
  const rows = Array.isArray(response?.data) ? response.data : [];
  const row = rows.find((item) => item?.reff_no === reference || item?.transaction?.reff_no === reference) || rows[0];
  return { status: row?.status || row?.transaction?.status || null, data: row || null };
}

function sortRecursively(value) {
  if (Array.isArray(value)) return value.map(sortRecursively);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => { result[key] = sortRecursively(value[key]); return result; }, {});
}

export function verifyWebhookSignature({ rawBody, headers, endpoint }) {
  const received = String(headers['x-signature'] || headers['X-Signature'] || '');
  if (!received || !webhookSecret || !rawBody) return false;
  let parsed;
  try { parsed = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody)); } catch { return false; }
  const timestamp = String(headers['x-timestamp'] || headers['X-Timestamp'] || '');
  const authorization = String(headers.authorization || headers.Authorization || '').replace(/^Bearer\s+/i, '');
  const normalized = JSON.stringify(sortRecursively(parsed));
  const bodyHash = crypto.createHash('sha256').update(normalized).digest('hex');
  const stringToSign = `POST:${endpoint}:${authorization}:${bodyHash}:${timestamp}`;
  const calculated = crypto.createHmac('sha512', webhookSecret).update(stringToSign).digest('hex');
  return received.length === calculated.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(calculated));
}

export function getSingaPayStatus() { return { ...configStatus(), webhook_configured: Boolean(webhookSecret) }; }
