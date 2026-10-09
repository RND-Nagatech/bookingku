# BookingKu Templates v3

Dokumentasi teknis lengkap tersedia di [docs/BOOKINGKU.md](docs/BOOKINGKU.md).

BookingKu adalah SaaS booking berbasis template bisnis. Versi ini hanya mendukung:

1. Salon / Barbershop
2. Lapangan Olahraga
3. Studio Foto

## Prinsip penting versi v3

- Akun baru **tidak diberi data contoh**. Tidak ada paket, layanan, staff, lapangan, harga, room, add-on, atau galeri yang dibuat otomatis.
- Data yang tampil di dashboard/public booking hanya berasal dari registrasi atau data yang dibuat owner.
- Studio Foto memiliki **Galeri Studio terpisah dari foto Paket dan foto Studio/Room**.
- Galeri mendukung multi-file drag & drop, hapus, dan drag untuk mengubah urutan.
- Jam operasional diatur Senin–Minggu menggunakan toggle buka/tutup + jam mulai/jam selesai.
- Halaman customer berbeda untuk tiap template bisnis.

## Halaman customer Studio Foto

Halaman Studio Foto dibuat seperti microsite booking, bukan form admin. Struktur utamanya:

- Hero/Cover bisnis
- Galeri visual studio
- Benefit strip
- Paket & harga weekday/weekend
- Add-on dengan quantity stepper
- Pilih Studio/Room
- Pilih tanggal dan slot jam
- Ringkasan sesi dan total estimasi
- Data customer
- Informasi lokasi dan jam operasional

Inspirasi UX berasal dari pola halaman studio foto modern seperti nalastudio.id, tetapi UI dan implementasi BookingKu dibuat sendiri.

## ENV

Backend: `api/.env`

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=bookingku_templates
JWT_SECRET=ganti-secret-ini
PLATFORM_ADMIN_NAME=Platform Admin
PLATFORM_ADMIN_EMAIL=admin@contoh.com
PLATFORM_ADMIN_PASSWORD=ganti-password-admin
FRONTEND_URL=http://localhost:5173
PAYMENT_PROVIDER=singapay
# disabled | sandbox | live
PAYMENT_MODE=disabled
SINGAPAY_BASE_URL=
SINGAPAY_CLIENT_ID=
SINGAPAY_CLIENT_SECRET=
SINGAPAY_API_KEY=
SINGAPAY_SECRET_KEY=
SINGAPAY_ACCOUNT_ID=
SINGAPAY_HMAC_VALIDATION_KEY=
SINGAPAY_WEBHOOK_SECRET=
```

Frontend: `web/.env`

```env
VITE_API_URL=http://localhost:3000
```

Frontend tidak bergantung pada Vite proxy untuk API.

## Admin Pusat dan pengaturan paket

Admin Pusat mengatur nama paket, harga, siklus tagihan, batas booking,
durasi, fitur, dan ketersediaan paket dari halaman khusus Admin Pusat. Data
paket disimpan di collection `tp_plan`, sehingga perubahan tidak memerlukan
perubahan script atau deploy ulang frontend.

Isi credential Admin Pusat di `api/.env`, lalu jalankan dari root project:

```bash
npm run seed
```

Script tersebut membuat atau memperbarui user dengan role `platform_admin`.
Logout dari akun bisnis, lalu login menggunakan email dan password tersebut.
Akun bisnis biasa tidak akan melihat halaman Admin Pusat.

## Pembayaran paket dengan SingaPay

Integrasi pembayaran paket memakai SingaPay Payment Link. Untuk sandbox, isi credential di `api/.env`, lalu gunakan:

```env
PAYMENT_PROVIDER=singapay
PAYMENT_MODE=sandbox
```

Backend membuat token B2B dan payment link secara server-side. Jangan menaruh credential SingaPay di `web/.env`. Setelah pembayaran, BookingKu menerima webhook pada `POST /api/billing/webhook/singapay` dan juga menyediakan pengecekan status dari halaman `Paket & Langganan` sebagai fallback. Arahkan webhook Sandbox SingaPay ke URL API tersebut.

## QRIS booking customer

Owner dapat menempel QRIS string static merchant pada menu `Tampilan & Pengaturan`. Booking dengan nominal di atas nol akan dibuat sebagai `pending_payment`, QRIS dynamic dengan nominal booking ditampilkan ke customer, dan tombol `Test Bayar (Simulasi Berhasil)` dapat dipakai sementara untuk mengubahnya menjadi booking confirmed. QRIS divalidasi menggunakan CRC dan QRIS static diubah ke dynamic sebelum ditampilkan.

## Menjalankan

Dari root project:

```bash
npm install
npm run install:all
npm run dev
```

Frontend default: `http://localhost:5173`
Backend default: `http://localhost:3000`

## Catatan foto

Untuk prototype, foto disimpan sebagai Data URL di MongoDB agar mudah dijalankan lokal tanpa object storage. Produksi sebaiknya menggunakan S3-compatible storage/Cloudinary/CDN dan hanya menyimpan URL di MongoDB.
