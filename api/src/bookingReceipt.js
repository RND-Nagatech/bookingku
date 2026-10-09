import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

const purple = '#6745EF';
const ink = '#1B1C25';
const muted = '#737582';
const line = '#E9E8F0';

function money(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function dateValue(value) {
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function dateLabel(value) {
  const date = dateValue(value);
  return date ? date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';
}

function timeLabel(value) {
  const date = dateValue(value);
  return date ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
}

function safe(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function escapeHtml(value, fallback = '-') {
  return safe(value, fallback).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function textWidth(doc, value, width, size = 10) {
  doc.fontSize(size);
  return doc.heightOfString(safe(value), { width, lineGap: 2 });
}

export function createBookingPdf(booking, business) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: { Title: `Bukti booking ${safe(booking.code)}`, Author: 'BookingKu' } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const bookingStatus = booking.status === 'cancelled' ? 'Dibatalkan' : booking.status === 'completed' ? 'Selesai' : 'Terkonfirmasi';
    const paymentLabel = booking.payment_method === 'QRIS_TEST' ? 'QRIS simulasi' : booking.payment_status === 'paid' ? 'QRIS / online' : 'Belum dibayar';

    doc.rect(0, 0, pageWidth, pageHeight).fill('#FAF9FD');
    doc.roundedRect(margin, 38, contentWidth, 118, 18).fill(purple);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('BookingKu', margin + 25, 60);
    doc.font('Helvetica').fontSize(10).fillColor('#DDD6FF').text('BUKTI BOOKING CUSTOMER', margin + 25, 90);
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#FFFFFF').text(safe(business.name, 'Bisnis'), margin + 25, 115, { width: 330, ellipsis: true });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF').text(safe(booking.code), pageWidth - margin - 160, 66, { width: 135, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor('#DDD6FF').text('Kode booking', pageWidth - margin - 160, 86, { width: 135, align: 'right' });
    doc.roundedRect(pageWidth - margin - 120, 112, 120, 25, 12).fill('#FFFFFF');
    doc.font('Helvetica-Bold').fontSize(9).fillColor(purple).text(bookingStatus.toUpperCase(), pageWidth - margin - 120, 120, { width: 120, align: 'center' });

    let y = 185;
    const sectionTitle = (title) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(purple).text(title.toUpperCase(), margin, y);
      y += 20;
    };
    const infoRow = (label, value, options = {}) => {
      const valueX = options.valueX || margin + 132;
      const valueWidth = options.valueWidth || contentWidth - 132;
      const height = Math.max(20, textWidth(doc, value, valueWidth, 10));
      doc.font('Helvetica').fontSize(9).fillColor(muted).text(label, margin, y);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(safe(value), valueX, y, { width: valueWidth, lineGap: 2 });
      y += height + 8;
    };

    sectionTitle('Detail booking');
    infoRow('Layanan / paket', booking.selection_name);
    infoRow('Tanggal', dateLabel(booking.start_at));
    infoRow('Jam', `${timeLabel(booking.start_at)} - ${timeLabel(booking.end_at)}`);
    infoRow('Customer', booking.customer_name);
    infoRow('WhatsApp', booking.customer_phone);
    infoRow('Email', booking.customer_email);

    y += 8;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(line).lineWidth(1).stroke();
    y += 25;
    sectionTitle('Pembayaran');
    doc.roundedRect(margin, y, contentWidth, 82, 13).fill('#F0EDFF');
    doc.font('Helvetica').fontSize(9).fillColor(muted).text('Status pembayaran', margin + 18, y + 18);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(paymentLabel, margin + 18, y + 36);
    doc.font('Helvetica').fontSize(9).fillColor(muted).text('Total', pageWidth - margin - 160, y + 18, { width: 142, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(17).fillColor(purple).text(money(booking.total_price), pageWidth - margin - 160, y + 35, { width: 142, align: 'right' });
    y += 115;

    doc.roundedRect(margin, y, contentWidth, 72, 13).fill('#FFFFFF').strokeColor(line).lineWidth(1).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text('Informasi bisnis', margin + 18, y + 15);
    doc.font('Helvetica').fontSize(9).fillColor(muted).text(safe(business.address, 'Alamat belum diatur'), margin + 18, y + 34, { width: contentWidth - 36, ellipsis: true });
    doc.text(safe(business.phone, 'Kontak belum diatur'), margin + 18, y + 49, { width: contentWidth - 36, ellipsis: true });

    doc.font('Helvetica').fontSize(8).fillColor('#9798A3').text('Dokumen ini dibuat otomatis oleh BookingKu. Simpan sebagai referensi booking.', margin, pageHeight - 54, { width: contentWidth, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#B0B0BA').text(`Dibuat ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 39, { width: contentWidth, align: 'center' });
    doc.end();
  });
}

function emailReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

export async function sendBookingConfirmation(booking, business, pdfBuffer) {
  if (!booking.customer_email) return { status: 'no_email' };
  if (!emailReady()) return { status: 'not_configured' };
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || '' } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  const customerName = escapeHtml(booking.customer_name);
  const businessName = escapeHtml(business.name, 'BookingKu');
  const bookingCode = escapeHtml(booking.code);
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: booking.customer_email,
    subject: `Booking ${safe(booking.code)} - ${safe(business.name, 'BookingKu')}`,
    text: `Booking kamu di ${safe(business.name)} sudah terkonfirmasi. Kode booking: ${safe(booking.code)}. Jadwal: ${dateLabel(booking.start_at)}, ${timeLabel(booking.start_at)} - ${timeLabel(booking.end_at)}. Bukti booking terlampir.`,
    html: `<div style="font-family:Arial,sans-serif;color:#1b1c25;line-height:1.6"><h2 style="color:#6745ef;margin-bottom:4px">Booking terkonfirmasi</h2><p>Halo ${customerName}, booking kamu di <b>${businessName}</b> sudah berhasil.</p><table cellpadding="6" style="border-collapse:collapse"><tr><td>Kode</td><td><b>${bookingCode}</b></td></tr><tr><td>Jadwal</td><td><b>${dateLabel(booking.start_at)}, ${timeLabel(booking.start_at)} - ${timeLabel(booking.end_at)}</b></td></tr><tr><td>Total</td><td><b>${money(booking.total_price)}</b></td></tr></table><p>Detail lengkap dan bukti booking tersedia pada PDF terlampir.</p></div>`,
    attachments: [{ filename: `${safe(booking.code, 'booking')}-bukti-booking.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
  return { status: 'sent' };
}
