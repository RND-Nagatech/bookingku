import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { z } from 'zod';
import { createPaymentLink, getPaymentLinkStatus, getSingaPayStatus, verifyWebhookSignature } from './singapay.js';
import { convertToDynamic, getMerchantInfo, normalizeQris, validateQris } from './qris.js';
import { createBookingPdf, sendBookingConfirmation } from './bookingReceipt.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'singapay';
const PAYMENT_MODE = String(process.env.PAYMENT_MODE || 'disabled').toLowerCase();
const mongo = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
await mongo.connect();
const db = mongo.db(process.env.MONGODB_DB || 'bookingku_templates');
const users = db.collection('tm_user');
const businesses = db.collection('tm_business');
const catalog = db.collection('tm_catalog');
const bookings = db.collection('tt_booking');
const payments = db.collection('tt_payment');
const planCatalog = db.collection('tp_plan');

await Promise.all([
  users.createIndex({ email: 1 }, { unique: true }),
  businesses.createIndex({ slug: 1 }, { unique: true }),
  catalog.createIndex({ business_id: 1, kind: 1 }),
  bookings.createIndex({ business_id: 1, start_at: 1 }),
  payments.createIndex({ payment_ref: 1 }, { unique: true }),
  payments.createIndex({ business_id: 1, status: 1, created_at: -1 }),
  planCatalog.createIndex({ id: 1 }, { unique: true })
]);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '20mb', verify:(req,_res,buffer)=>{req.rawBody=Buffer.from(buffer);} }));

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const emptyHours = Object.fromEntries(DAYS.map(day => [day, { open: false, start: '09:00', end: '17:00' }]));
const defaultPlans = [
  {
    id: 'trial', name: 'Free Trial', price: 0, booking_limit: null, duration_days: 30,
    billing_cycle: '30 hari', available: true, sort_order: 1,
    description: 'Mulai mengatur booking tanpa biaya.',
    features: ['Semua template bisnis', 'Halaman booking publik', 'Kalender & slot booking']
  },
  {
    id: 'pro', name: 'Pro', price: 49000, booking_limit: 200, duration_days: 30,
    billing_cycle: 'bulan', available: true, sort_order: 2,
    description: 'Untuk operasional rutin dengan volume booking menengah.',
    features: ['Maks. 200 booking / bulan', 'Custom link booking', 'Deposit setting']
  },
  {
    id: 'business', name: 'Business', price: 99000, booking_limit: null, duration_days: 30,
    billing_cycle: 'bulan', available: true, sort_order: 3,
    description: 'Untuk bisnis dengan volume booking tinggi.',
    features: ['Booking unlimited', 'Semua fitur Pro', 'Untuk volume tinggi']
  }
];

await Promise.all(defaultPlans.map((plan) => planCatalog.updateOne(
  { id: plan.id },
  { $setOnInsert: { ...plan, created_at: new Date(), updated_at: new Date() } },
  { upsert: true }
)));

function cleanPlan(plan) {
  if (!plan) return null;
  const { _id, ...publicPlan } = plan;
  return { ...publicPlan, features: Array.isArray(publicPlan.features) ? publicPlan.features : [] };
}
async function getPlans() {
  return (await planCatalog.find({}).sort({ sort_order: 1, id: 1 }).toArray()).map(cleanPlan);
}
async function getPlan(id) {
  return cleanPlan(await planCatalog.findOne({ id: String(id).toLowerCase() }));
}

function paymentIsAvailable(){ return PAYMENT_PROVIDER==='singapay' && ['sandbox','live'].includes(PAYMENT_MODE); }
function now(){ return new Date(); }
function subscriptionEndsAt(plan){ return new Date(Date.now()+Number(plan.duration_days||30)*86400000); }
function providerPaymentLinkId(provider){ return provider.id||provider.payment_link_id||provider.paymentLinkId||null; }

function auth(req,res,next){
  const h=req.headers.authorization||'';
  const t=h.startsWith('Bearer ')?h.slice(7):'';
  if(!t) return res.status(401).json({message:'Unauthorized'});
  try{ req.auth=jwt.verify(t,JWT_SECRET); next(); }catch{ return res.status(401).json({message:'Token tidak valid'}); }
}
async function platformAdmin(req,res,next){
  try {
    if (!ObjectId.isValid(req.auth?.user_id)) return res.status(403).json({message:'Akses khusus Admin Pusat.'});
    const user = await users.findOne({ _id: new ObjectId(req.auth.user_id), role: 'platform_admin' });
    if (!user) return res.status(403).json({message:'Akses khusus Admin Pusat.'});
    req.platformAdminUser = user;
    next();
  } catch {
    res.status(403).json({message:'Akses khusus Admin Pusat.'});
  }
}
function toSlug(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)}
function publicBusiness(b){
  return {
    id:String(b._id), name:b.name, slug:b.slug, business_type:b.business_type,
    address:b.address||'', phone:b.phone||'', description:b.description||'',
    cover_image:b.cover_image||'', gallery:Array.isArray(b.gallery)?b.gallery:[],
    opening_hours:b.opening_hours||emptyHours,
    deposit_percent:Number(b.deposit_percent||0), qris_configured:Boolean(b.qris_string), subscription:b.subscription||null
  };
}
function businessQrisInfo(b){
  if(!b?.qris_string)return null;
  try{return getMerchantInfo(b.qris_string)}catch{return null}
}
function localDayKey(dateString){
  const d = new Date(`${dateString}T12:00:00`);
  return DAYS[(d.getDay()+6)%7];
}
async function notifyBookingCustomer(booking,business){
  try{
    const pdf=await createBookingPdf(booking,business);
    return await sendBookingConfirmation(booking,business,pdf);
  }catch(error){
    console.error('Booking confirmation email failed:',error.message||error);
    return {status:'failed',message:error.message||'Email tidak dapat dikirim'};
  }
}

app.get('/health',(req,res)=>res.json({ok:true,service:'bookingku-api',payment:{provider:PAYMENT_PROVIDER,mode:PAYMENT_MODE,configured:getSingaPayStatus().configured}}));
app.get('/api/plans',async(req,res)=>res.json({
  payment:{provider:PAYMENT_PROVIDER,mode:PAYMENT_MODE,enabled:paymentIsAvailable(),configured:getSingaPayStatus().configured,sandbox_ready:PAYMENT_MODE==='sandbox'&&getSingaPayStatus().configured,live_ready:PAYMENT_MODE==='live'&&getSingaPayStatus().configured},
  plans:(await getPlans()).map((plan)=>({...plan,sandbox_testable:PAYMENT_MODE==='sandbox'&&getSingaPayStatus().configured&&plan.id!=='trial'}))
}));

app.get('/api/platform/plans',auth,platformAdmin,async(req,res)=>res.json({plans:await getPlans()}));
app.put('/api/platform/plans/:id',auth,platformAdmin,async(req,res)=>{
  const id=String(req.params.id||'').toLowerCase();
  const current=await getPlan(id);
  if(!current)return res.status(404).json({message:'Paket tidak ditemukan.'});
  const body=req.body||{};
  const price=Math.max(0,Number(body.price ?? current.price) || 0);
  const bookingLimit=body.booking_limit === null || body.booking_limit === '' || body.booking_limit === undefined
    ? current.booking_limit
    : Math.max(0,Math.floor(Number(body.booking_limit) || 0));
  const durationDays=Math.max(1,Math.floor(Number(body.duration_days ?? current.duration_days) || 30));
  const features=Array.isArray(body.features) ? body.features.map((item)=>String(item).trim()).filter(Boolean) : current.features;
  const set={
    name:String(body.name ?? current.name).trim() || current.name,
    price, booking_limit:bookingLimit, duration_days:durationDays,
    billing_cycle:String(body.billing_cycle ?? current.billing_cycle).trim() || current.billing_cycle,
    available:body.available === undefined ? Boolean(current.available) : Boolean(body.available),
    description:String(body.description ?? current.description).trim(), features, updated_at:new Date()
  };
  await planCatalog.updateOne({id},{$set:set});
  res.json({plan:await getPlan(id)});
});

app.post('/api/auth/register', async(req,res)=>{
  const schema=z.object({
    name:z.string().min(2), email:z.string().email(), password:z.string().min(6),
    business_name:z.string().min(2), business_type:z.enum(['salon','sports_court','photo_studio'])
  });
  const parsed=schema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({message:'Data tidak valid'});
  const {name,email,password,business_name,business_type}=parsed.data;
  if(await users.findOne({email})) return res.status(409).json({message:'Email sudah terdaftar'});
  let slug=toSlug(business_name)||'bisnis', n=1;
  while(await businesses.findOne({slug})) slug=`${toSlug(business_name)}-${++n}`;
  const u=await users.insertOne({name,email,password_hash:await bcrypt.hash(password,10),created_at:new Date()});
  const trialStart=new Date(); const trialEnd=new Date(trialStart.getTime()+30*86400000);
  const b=await businesses.insertOne({
    owner_id:u.insertedId,name:business_name,slug,business_type,
    address:'',phone:'',description:'',cover_image:'',gallery:[],
    opening_hours:emptyHours,deposit_percent:0,
    subscription:{plan:'trial',status:'active',started_at:trialStart,ends_at:trialEnd},
    created_at:new Date()
  });
  // Penting: tidak membuat layanan/paket/lapangan/staff contoh apa pun.
  // Catalog hanya berisi data yang benar-benar dibuat owner setelah registrasi.
  const token=jwt.sign({user_id:String(u.insertedId),business_id:String(b.insertedId)},JWT_SECRET,{expiresIn:'7d'});
  res.json({token,business:{id:String(b.insertedId),name:business_name,slug,business_type}});
});

app.post('/api/auth/login',async(req,res)=>{
  const {email,password}=req.body; const u=await users.findOne({email});
  if(!u || !(await bcrypt.compare(password||'',u.password_hash))) return res.status(401).json({message:'Email atau password salah'});
  if(u.role==='platform_admin'){
    const token=jwt.sign({user_id:String(u._id),role:'platform_admin'},JWT_SECRET,{expiresIn:'7d'});
    return res.json({token,platform_admin:true,user:{name:u.name,email:u.email,role:u.role},business:null});
  }
  const b=await businesses.findOne({owner_id:u._id});
  if(!b)return res.status(403).json({message:'Akun bisnis belum memiliki workspace.'});
  const token=jwt.sign({user_id:String(u._id),business_id:String(b._id)},JWT_SECRET,{expiresIn:'7d'});
  res.json({token,business:{id:String(b._id),name:b.name,slug:b.slug,business_type:b.business_type}});
});

async function activatePayment(payment, providerData=null){
  if(!payment?.business_id||!payment?.payment_ref)return null;
  const plan=await getPlan(payment.plan_id)||await getPlan('trial');
  await payments.updateOne({_id:payment._id},{$set:{status:'paid',paid_at:now(),provider_data:providerData||payment.provider_data,updated_at:now()}});
  await businesses.updateOne({_id:payment.business_id},{$set:{subscription:{plan:plan.id,status:'active',price:plan.price,billing_cycle:plan.billing_cycle,started_at:now(),ends_at:payment.ends_at||subscriptionEndsAt(plan),payment_ref:payment.payment_ref,provider:payment.provider}}});
  return payments.findOne({_id:payment._id});
}

async function syncPendingPayment(payment){
  if(!payment||payment.status!=='pending'||!paymentIsAvailable())return payment;
  try{
    const result=await getPaymentLinkStatus({paymentLinkId:payment.provider_payment_link_id,reference:payment.payment_ref});
    const status=String(result.status||'').toLowerCase();
    if(['paid','success','completed'].includes(status))return activatePayment(payment,result.data);
    if(['failed','expired','cancelled'].includes(status)){
      await payments.updateOne({_id:payment._id},{$set:{status,provider_data:result.data,updated_at:now()}});
      return payments.findOne({_id:payment._id});
    }
  }catch{
    // Webhook tetap menjadi sumber kebenaran jika endpoint status provider sedang tidak tersedia.
  }
  return payment;
}

app.get('/api/billing',auth,async(req,res)=>{
  const businessId=new ObjectId(req.auth.business_id);
  const pending=await payments.findOne({business_id:businessId,status:'pending'},{sort:{created_at:-1}});
  if(pending)await syncPendingPayment(pending);
  const business=await businesses.findOne({_id:businessId});
  const providerStatus=getSingaPayStatus();
  res.json({
    payment:{provider:PAYMENT_PROVIDER,mode:PAYMENT_MODE,enabled:paymentIsAvailable(),sandbox_ready:PAYMENT_MODE==='sandbox'&&providerStatus.configured,live_ready:PAYMENT_MODE==='live'&&providerStatus.configured,...providerStatus},
    subscription:business?.subscription||null,
    pending:await payments.findOne({business_id:businessId,status:'pending'},{sort:{created_at:-1}}),
    plans:await getPlans()
  });
});

app.post('/api/billing/checkout',auth,async(req,res)=>{
  try{
    if(!paymentIsAvailable())return res.status(503).json({message:'Pembayaran Sandbox belum diaktifkan. Atur PAYMENT_MODE=sandbox terlebih dahulu.'});
    const providerStatus=getSingaPayStatus();
    if(!providerStatus.configured)return res.status(503).json({message:`Credential SingaPay belum lengkap: ${providerStatus.missing.join(', ')}.`});
    const planId=String(req.body?.plan_id||'').toLowerCase();
    const plan=await getPlan(planId);
    if(!plan||!['pro','business'].includes(planId))return res.status(400).json({message:'Pilih paket Pro atau Business.'});
    if(plan.available===false)return res.status(400).json({message:'Paket ini sedang tidak tersedia.'});
    if(!Number(plan.price))return res.status(400).json({message:'Paket ini tidak memiliki harga pembayaran.'});

    const businessId=new ObjectId(req.auth.business_id);
    const user=await users.findOne({_id:new ObjectId(req.auth.user_id)});
    const reference=`BK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const successUrl=`${FRONTEND_URL}/?payment=success&ref=${encodeURIComponent(reference)}`;
    const expiredUrl=`${FRONTEND_URL}/?payment=expired&ref=${encodeURIComponent(reference)}`;
    const provider=await createPaymentLink({
      reference,
      description:`BookingKu ${plan.name} - ${plan.billing_cycle}`,
      amount:plan.price,
      successRedirectUrl:successUrl,
      expiredRedirectUrl:expiredUrl,
      customerName:user?.name,
      customerEmail:user?.email,
      metadata:{business_id:req.auth.business_id,plan_id:plan.id,source:'bookingku'}
    });
    const payment={
      business_id:businessId,owner_id:new ObjectId(req.auth.user_id),plan_id:plan.id,status:'pending',price:plan.price,billing_cycle:plan.billing_cycle,
      payment_ref:reference,provider:PAYMENT_PROVIDER,provider_payment_link_id:providerPaymentLinkId(provider),provider_account_id:provider.account_id,
      provider_data:provider,ends_at:subscriptionEndsAt(plan),created_at:now()
    };
    const result=await payments.insertOne(payment);
    payment._id=result.insertedId;
    res.json({checkout_url:provider.payment_url,reference,plan, payment});
  }catch(error){
    res.status(error.status&&error.status<500?error.status:502).json({message:error.message||'Checkout Sandbox SingaPay gagal dibuat.'});
  }
});

app.get('/api/billing/status/:reference',auth,async(req,res)=>{
  const payment=await payments.findOne({business_id:new ObjectId(req.auth.business_id),payment_ref:String(req.params.reference)});
  if(!payment)return res.status(404).json({message:'Transaksi pembayaran tidak ditemukan.'});
  const current=await syncPendingPayment(payment);
  res.json({status:current.status,payment:current,plan:await getPlan(current.plan_id)||await getPlan('trial')});
});

app.post('/api/billing/webhook/singapay',async(req,res)=>{
  const valid=verifyWebhookSignature({rawBody:req.rawBody,headers:req.headers,endpoint:req.originalUrl});
  if(!valid)return res.status(401).json({status:'error',message:'Signature webhook SingaPay tidak valid.'});
  const payload=req.body||{};
  const transaction=payload?.data?.transaction||{};
  const reference=String(transaction.reff_no||'');
  const status=String(transaction.status||'').toLowerCase();
  if(reference&&['paid','success','completed'].includes(status)){
    const payment=await payments.findOne({payment_ref:reference,status:'pending'});
    if(payment)await activatePayment(payment,payload);
  }
  if(reference&&['failed','expired','cancelled'].includes(status))await payments.updateOne({payment_ref:reference,status:'pending'},{$set:{status,provider_data:payload,updated_at:now()}});
  res.status(200).json({status:'success'});
});

app.get('/api/me',auth,async(req,res)=>{
  const currentUser=ObjectId.isValid(req.auth?.user_id)
    ? await users.findOne({_id:new ObjectId(req.auth.user_id)})
    : null;
  if(currentUser?.role==='platform_admin')return res.json({platform_admin:true,business:null,plans:await getPlans()});
  const b=await businesses.findOne({_id:new ObjectId(req.auth.business_id)});
  res.json({platform_admin:false,business:{...publicBusiness(b),qris_string:b.qris_string||'',qris_info:businessQrisInfo(b)},plans:await getPlans()});
});
app.patch('/api/business',auth,async(req,res)=>{
  const allowed=['name','address','phone','description','cover_image','gallery','opening_hours','deposit_percent','qris_string'];
  if('qris_string' in req.body){
    const qris=normalizeQris(req.body.qris_string);
    if(qris){try{validateQris(qris)}catch(error){return res.status(400).json({message:error.message||'QRIS tidak valid'})}}
    req.body.qris_string=qris;
  }
  const set={}; for(const k of allowed) if(k in req.body) set[k]=req.body[k];
  await businesses.updateOne({_id:new ObjectId(req.auth.business_id)},{$set:set});
  const b=await businesses.findOne({_id:new ObjectId(req.auth.business_id)});
  res.json({business:{...publicBusiness(b),qris_string:b.qris_string||'',qris_info:businessQrisInfo(b)}});
});

app.get('/api/catalog',auth,async(req,res)=>{
  const items=await catalog.find({business_id:new ObjectId(req.auth.business_id)}).sort({created_at:1}).toArray();
  res.json({items});
});
app.post('/api/catalog',auth,async(req,res)=>{
  const doc={...req.body,business_id:new ObjectId(req.auth.business_id),active:req.body.active!==false,created_at:new Date()};
  delete doc._id;
  const r=await catalog.insertOne(doc);res.json({item:{...doc,_id:r.insertedId}});
});
app.patch('/api/catalog/:id',auth,async(req,res)=>{
  const set={...req.body}; delete set._id; delete set.business_id;
  await catalog.updateOne({_id:new ObjectId(req.params.id),business_id:new ObjectId(req.auth.business_id)},{$set:set});res.json({ok:true});
});
app.delete('/api/catalog/:id',auth,async(req,res)=>{
  await catalog.deleteOne({_id:new ObjectId(req.params.id),business_id:new ObjectId(req.auth.business_id)});res.json({ok:true});
});

app.get('/api/bookings',auth,async(req,res)=>{
  const q={business_id:new ObjectId(req.auth.business_id)};
  if(req.query.date){const s=new Date(req.query.date+'T00:00:00');const e=new Date(req.query.date+'T23:59:59');q.start_at={$gte:s,$lte:e};}
  const rows=await bookings.find(q).sort({start_at:-1}).toArray();res.json({bookings:rows});
});
app.patch('/api/bookings/:id/status',auth,async(req,res)=>{
  const next=String(req.body?.status||'').toLowerCase();
  const allowed=['pending_payment','confirmed','completed','cancelled'];
  if(!allowed.includes(next))return res.status(400).json({message:'Status booking tidak valid.'});
  if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:'Booking tidak valid.'});
  const booking=await bookings.findOne({_id:new ObjectId(req.params.id),business_id:new ObjectId(req.auth.business_id)});
  if(!booking)return res.status(404).json({message:'Booking tidak ditemukan.'});
  if(booking.status==='cancelled'&&next!=='cancelled')return res.status(400).json({message:'Booking yang sudah dibatalkan tidak dapat diaktifkan kembali.'});
  if(booking.status==='completed'&&next!=='completed')return res.status(400).json({message:'Booking yang sudah selesai tidak dapat diubah lagi.'});
  if(next==='pending_payment'&&booking.status!=='pending_payment')return res.status(400).json({message:'Status menunggu pembayaran hanya dibuat oleh flow pembayaran customer.'});
  const set={status:next,updated_at:new Date()};
  if(next==='confirmed'&&booking.payment_status==='pending')Object.assign(set,{payment_status:'paid',payment_method:booking.payment_method||'MANUAL_CONFIRMATION',paid_at:booking.paid_at||new Date()});
  await bookings.updateOne({_id:booking._id},{$set:set});
  res.json({ok:true,booking:await bookings.findOne({_id:booking._id})});
});

app.get('/api/public/:slug',async(req,res)=>{
  const b=await businesses.findOne({slug:req.params.slug}); if(!b)return res.status(404).json({message:'Bisnis tidak ditemukan'});
  const items=await catalog.find({business_id:b._id,active:true}).sort({created_at:1}).toArray();
  res.json({business:publicBusiness(b),items});
});

app.get('/api/public/:slug/availability',async(req,res)=>{
  const b=await businesses.findOne({slug:req.params.slug}); if(!b)return res.status(404).json({message:'Bisnis tidak ditemukan'});
  const date=req.query.date; if(!date)return res.status(400).json({message:'date wajib'});
  const duration=Math.max(15,Number(req.query.duration||60));
  const resource_id=String(req.query.resource_id||''); const staff_id=String(req.query.staff_id||'');
  const resource=resource_id&&ObjectId.isValid(resource_id)?await catalog.findOne({_id:new ObjectId(resource_id),business_id:b._id,kind:'resource',active:true}):null;
  const allowedDurations=Array.isArray(resource?.duration_options)?resource.duration_options.map(Number).filter((n)=>Number.isFinite(n)&&n>=15):[];
  if(allowedDurations.length&&!allowedDurations.includes(duration))return res.status(400).json({message:'Durasi tidak tersedia untuk lapangan ini.'});
  const schedule=(b.opening_hours||emptyHours)[localDayKey(date)];
  if(!schedule?.open) return res.json({slots:[],closed:true});
  const [sh,sm]=schedule.start.split(':').map(Number); const [eh,em]=schedule.end.split(':').map(Number);
  const openMinutes=sh*60+sm, closeMinutes=eh*60+em;
  const dayStart=new Date(`${date}T00:00:00`), dayEnd=new Date(`${date}T23:59:59`);
  const existing=await bookings.find({business_id:b._id,start_at:{$gte:dayStart,$lte:dayEnd},status:{$nin:['cancelled']}}).toArray();
  const slots=[];
  for(let min=openMinutes; min+duration<=closeMinutes; min+=30){
    const hh=String(Math.floor(min/60)).padStart(2,'0'), mm=String(min%60).padStart(2,'0');
    const s=new Date(`${date}T${hh}:${mm}:00`), e=new Date(s.getTime()+duration*60000);
    const busy=existing.some(x=>{
      const overlap=s<x.end_at&&e>x.start_at;
      if(!overlap) return false;
      if(resource_id) return String(x.resource_id||'')===resource_id;
      if(staff_id) return String(x.staff_id||'')===staff_id;
      return true; // tanpa resource/staff dianggap satu kapasitas bisnis
    });
    if(!busy) slots.push({time:`${hh}:${mm}`,start_at:s,end_at:e});
  }
  res.json({slots,closed:false});
});

app.post('/api/public/:slug/book',async(req,res)=>{
  const b=await businesses.findOne({slug:req.params.slug}); if(!b)return res.status(404).json({message:'Bisnis tidak ditemukan'});
  const body=req.body;
  if(!body.start_at||!body.end_at||!body.customer_name||!body.customer_phone||!body.customer_email)return res.status(400).json({message:'Nama, WhatsApp, dan email wajib diisi untuk konfirmasi booking.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.customer_email)))return res.status(400).json({message:'Format email customer tidak valid.'});
  const start_at=new Date(body.start_at), end_at=new Date(body.end_at);
  const bookingDuration=Math.round((end_at.getTime()-start_at.getTime())/60000);
  if(body.resource_id&&ObjectId.isValid(String(body.resource_id))){const resource=await catalog.findOne({_id:new ObjectId(String(body.resource_id)),business_id:b._id,kind:'resource',active:true});const allowedDurations=Array.isArray(resource?.duration_options)?resource.duration_options.map(Number).filter((n)=>Number.isFinite(n)&&n>=15):[];if(allowedDurations.length&&!allowedDurations.includes(bookingDuration))return res.status(400).json({message:'Durasi booking tidak tersedia untuk lapangan ini.'});}
  const conflictQuery={business_id:b._id,status:{$nin:['cancelled']},start_at:{$lt:end_at},end_at:{$gt:start_at}};
  if(body.resource_id) conflictQuery.resource_id=body.resource_id;
  else if(body.staff_id) conflictQuery.staff_id=body.staff_id;
  const conflict=await bookings.findOne(conflictQuery);
  if(conflict)return res.status(409).json({message:'Slot baru saja terisi. Pilih waktu lain.'});
  const count=await bookings.countDocuments({business_id:b._id});
  const code=`BK-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`;
  const totalPrice=Math.max(0,Number(body.total_price||0));
  let payment=null; let paymentToken=''; let status='confirmed';
  if(totalPrice>0&&b.qris_string){
    let qrisData;
    try{qrisData=convertToDynamic(b.qris_string,totalPrice)}catch(error){return res.status(503).json({message:error.message||'QRIS bisnis belum valid'})}
    paymentToken=crypto.randomBytes(18).toString('hex');
    status='pending_payment';
    payment={method:'QRIS',status:'pending',amount:totalPrice,qris_data:qrisData,payment_token:paymentToken,test_mode:true};
  }
  const doc={business_id:b._id,code,business_type:b.business_type,...body,total_price:totalPrice,start_at,end_at,status,payment_status:payment?'pending':'not_required',created_at:new Date()};
  if(paymentToken)doc.payment_token=paymentToken;
  const r=await bookings.insertOne(doc);
  const booking={...doc,_id:r.insertedId};
  delete booking.payment_token;
  const email_status=status==='confirmed'?await notifyBookingCustomer(booking,b):'pending_payment';
  res.json({booking,payment,email_status});
});

app.post('/api/public/:slug/book/:id/test-pay',async(req,res)=>{
  const b=await businesses.findOne({slug:req.params.slug}); if(!b)return res.status(404).json({message:'Bisnis tidak ditemukan'});
  if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:'Booking tidak valid'});
  const booking=await bookings.findOne({_id:new ObjectId(req.params.id),business_id:b._id,payment_token:String(req.body?.payment_token||''),status:'pending_payment'});
  if(!booking)return res.status(404).json({message:'Pembayaran booking tidak ditemukan atau sudah diproses'});
  await bookings.updateOne({_id:booking._id},{$set:{status:'confirmed',payment_status:'paid',payment_method:'QRIS_TEST',paid_at:new Date(),updated_at:new Date()},$unset:{payment_token:''}});
  const paid=await bookings.findOne({_id:booking._id});
  const email_status=await notifyBookingCustomer(paid,b);
  res.json({booking:paid,email_status});
});

app.get('/api/public/:slug/book/:id/receipt',async(req,res)=>{
  const b=await businesses.findOne({slug:req.params.slug}); if(!b)return res.status(404).json({message:'Bisnis tidak ditemukan'});
  if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:'Booking tidak valid'});
  const booking=await bookings.findOne({_id:new ObjectId(req.params.id),business_id:b._id});
  if(!booking)return res.status(404).json({message:'Booking tidak ditemukan'});
  const pdf=await createBookingPdf(booking,b);
  res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${String(booking.code||'booking')}-bukti-booking.pdf"`});
  res.send(pdf);
});

app.listen(PORT,()=>console.log(`BookingKu API running on http://localhost:${PORT}`));
