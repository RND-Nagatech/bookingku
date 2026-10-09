# BookingKu — Dokumentasi Project

BookingKu adalah SaaS booking berbasis template bisnis. Owner membuat workspace bisnis, mengatur layanan atau resource, lalu mendapatkan halaman booking publik yang dapat dibagikan ke customer.

Versi MVP ini mendukung:

- Salon / Barbershop
- Lapangan Olahraga
- Studio Foto
- Booking publik tanpa akun customer
- Pembayaran paket owner melalui SingaPay Sandbox
- Pembayaran booking melalui QRIS merchant dan tombol Test Bayar
- Email konfirmasi dan PDF bukti booking

## 1. Struktur project

```text
bookingku-templates/
├── api/                         # Backend Express + MongoDB
│   ├── src/server.js            # Server dan seluruh endpoint API
│   ├── src/singapay.js          # Integrasi SingaPay
│   ├── src/qris.js              # Validasi dan konversi QRIS
│   ├── src/bookingReceipt.js    # PDF dan email konfirmasi
│   └── scripts/                 # Script administrasi
├── web/                         # Frontend React + Vite
│   ├── src/main.tsx             # Routing dan komponen utama
│   ├── src/styles.css           # Design system dan responsive UI
│   └── public/assets/           # Asset statis
├── docs/                        # Dokumentasi dan catatan product
└── AGENTS.md                    # Aturan kerja dan product rules
```

## 2. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | CSS custom, Lucide React |
| Backend | Node.js, Express |
| Database | MongoDB |
| Auth | JWT + bcryptjs |
| QRIS | QRIS TLV, CRC16 |
| Pembayaran | SingaPay Payment Link |
| Email | Nodemailer + SMTP |
| PDF | PDFKit |

## 3. Prasyarat

- Node.js 18 atau lebih baru
- npm
- MongoDB lokal atau MongoDB server
- Credential SingaPay jika ingin menguji pembayaran paket
- SMTP jika ingin mengirim email konfirmasi booking

## 4. Instalasi

Dari root project:

```bash
npm install
npm run install:all
```

Perintah tersebut memasang dependency root, backend, dan frontend.

## 5. Environment variable

### Backend: `api/.env`

Salin `api/.env.example` menjadi `api/.env`.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=bookingku_templates
JWT_SECRET=ganti-dengan-secret-random-yang-panjang
FRONTEND_URL=http://localhost:5173

PLATFORM_ADMIN_NAME=Platform Admin
PLATFORM_ADMIN_EMAIL=
PLATFORM_ADMIN_PASSWORD=

PAYMENT_PROVIDER=singapay
PAYMENT_MODE=disabled
SINGAPAY_BASE_URL=https://sandbox-payment-b2b.singapay.id
SINGAPAY_CLIENT_ID=
SINGAPAY_CLIENT_SECRET=
SINGAPAY_API_KEY=
SINGAPAY_SECRET_KEY=
SINGAPAY_ACCOUNT_ID=
SINGAPAY_WEBHOOK_SECRET=
SINGAPAY_HMAC_VALIDATION_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=BookingKu <email@gmail.com>
```

Catatan:

- Credential rahasia hanya boleh berada di `api/.env`.
- `SINGAPAY_CLIENT_SECRET` menggunakan `SINGAPAY_SECRET_KEY` sebagai fallback.
- `SINGAPAY_HMAC_VALIDATION_KEY` menggunakan `SINGAPAY_WEBHOOK_SECRET` sebagai fallback.
- `PAYMENT_MODE` dapat berupa `disabled`, `sandbox`, atau `live`.
- Untuk pengembangan biasa, gunakan `PAYMENT_MODE=disabled`.
- Jangan commit file `.env` ke repository.

### Frontend: `web/.env`

```env
VITE_API_URL=http://localhost:3000
```

Frontend memanggil backend secara langsung melalui `VITE_API_URL`. Vite proxy bukan koneksi API utama.

## 6. Menjalankan project

Jalankan frontend dan backend bersama-sama dari root:

```bash
npm run dev
```

Atau jalankan terpisah:

```bash
# Terminal 1
npm run dev --prefix api

# Terminal 2
npm run dev --prefix web
```

URL default:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

Build frontend:

```bash
npm run build
```

## 7. Registrasi dan workspace

Owner memilih:

1. Jenis bisnis
2. Paket Free Trial, Pro, atau Business
3. Nama, email, password, dan nama bisnis

Saat registrasi:

- User dibuat di `tm_user`.
- Business dibuat di `tm_business`.
- Slug bisnis dibuat otomatis dari nama bisnis dan dijamin unik.
- Trial aktif selama 30 hari.
- Semua master data tetap kosong.

Tidak ada layanan, paket, staff, lapangan, room, add-on, harga, atau foto contoh yang dibuat otomatis.

Link publik bisnis:

```text
http://localhost:5173/b/<slug-bisnis>
```

Slug sudah disimpan di data business. Dashboard menampilkan link tersebut dan menyediakan tombol Salin link.

## 8. Jenis bisnis dan alur booking

### Salon / Barbershop

Master data:

- Layanan
- Staff / Stylist

Alur customer:

```text
Layanan → Stylist opsional → Tanggal & jam → Data customer → Booking
```

### Lapangan Olahraga

Master data:

- Jenis olahraga
- Lapangan
- Harga per jam
- Durasi yang diizinkan

Alur customer:

```text
Jenis olahraga → Lapangan → Durasi → Tanggal & jam → Data customer → Booking
```

Durasi lapangan tidak dipatok hanya dua jam. Owner dapat mengisi pilihan durasi dalam menit, misalnya:

```text
60, 90, 120, 180, 240
```

Jika durasi dikosongkan, frontend menggunakan pilihan default 1–5 jam.

### Studio Foto

Master data:

- Paket Foto
- Studio / Room
- Add-on

Galeri bisnis dan gambar paket adalah dua hal berbeda. Galeri digunakan untuk menampilkan bisnis, sedangkan gambar paket/room menempel pada data master masing-masing.

Alur customer:

```text
Hero → Galeri → Paket → Add-on → Room → Jadwal → Ringkasan → Customer → Booking
```

## 9. Menu owner

### Dashboard

Menampilkan:

- Booking hari ini
- Booking bulan ini
- Pendapatan bulan ini
- Booking menunggu pembayaran
- Grafik booking 7 hari terakhir
- Booking mendatang atau booking terbaru
- Donut status booking
- Setup checklist
- Link halaman customer

### Booking

Menyediakan:

- Filter status
- Pencarian kode, nama, WhatsApp, atau layanan
- Filter tanggal
- Detail booking
- Konfirmasi pembayaran
- Tandai selesai
- Batalkan booking

Status booking:

| Status teknis | Label UI | Arti |
|---|---|---|
| `pending_payment` | Menunggu pembayaran | Booking menunggu pembayaran customer |
| `confirmed` | Terkonfirmasi | Booking sudah diterima atau dibayar |
| `completed` | Selesai | Layanan sudah diberikan |
| `cancelled` | Dibatalkan | Booking tidak lagi memakai slot |

Booking yang sudah dibatalkan tidak dapat diaktifkan kembali. Booking yang sudah selesai tidak dapat diubah ke status lain.

### Master Data

Semua data dapat:

- Ditambah melalui modal/bottom sheet
- Diedit
- Mengganti gambar
- Dihapus melalui dialog internal aplikasi

Input harga menggunakan format Rupiah saat mengetik, misalnya `Rp 150.000`.

### Tampilan & Pengaturan

Mengatur:

- Cover / Hero
- Galeri Studio Foto
- Profil publik
- Nama bisnis
- Deskripsi
- Telepon / WhatsApp
- Alamat
- Jam operasional
- Deposit
- QRIS merchant string

Jam operasional menggunakan toggle buka/tutup dan input waktu. Data bisnis baru dimulai dengan semua hari tutup.

### Paket & Langganan

Menampilkan:

- Paket aktif
- Masa berlaku
- Free Trial
- Pro
- Business
- Status pembayaran paket

Paket disimpan pada collection `tp_plan` dan dapat dikelola oleh Admin Pusat.

## 10. Customer publik

Customer tidak perlu membuat akun atau login. Customer cukup membuka link bisnis, memilih layanan/resource, memilih jadwal, mengisi:

- Nama
- WhatsApp
- Email

Setelah booking berhasil, customer mendapatkan:

- Halaman hasil booking
- Kode booking
- Informasi status pembayaran
- Tombol download PDF
- Email konfirmasi jika SMTP tersedia

## 11. QRIS booking

Owner menempel QRIS static merchant pada `Tampilan & Pengaturan`.

Backend akan:

1. Menghapus whitespace yang tidak diperlukan.
2. Memvalidasi format TLV.
3. Memvalidasi CRC16.
4. Memastikan QRIS adalah static merchant (`01=11`).
5. Membaca identitas merchant, kota, issuer, dan metode.
6. Mengubah QRIS static menjadi QRIS dynamic dengan nominal booking.

Jika QRIS tidak valid, data tidak akan disimpan atau checkout akan ditolak.

Saat ini pembayaran QRIS booking masih memiliki tombol:

```text
Test Bayar (Simulasi Berhasil)
```

Tombol tersebut mengubah booking dari `pending_payment` menjadi:

```text
status: confirmed
payment_status: paid
payment_method: QRIS_TEST
```

Ini hanya simulasi internal dan bukan settlement pembayaran sungguhan.

## 12. Pembayaran paket dengan SingaPay

Pembayaran paket Pro/Business memakai SingaPay Payment Link.

Aktifkan sandbox:

```env
PAYMENT_PROVIDER=singapay
PAYMENT_MODE=sandbox
SINGAPAY_BASE_URL=https://sandbox-payment-b2b.singapay.id
SINGAPAY_CLIENT_ID=...
SINGAPAY_CLIENT_SECRET=...
SINGAPAY_API_KEY=...
SINGAPAY_ACCOUNT_ID=...
SINGAPAY_WEBHOOK_SECRET=...
```

Flow:

```text
Pilih paket → Register/Login → Backend membuat Payment Link →
Redirect ke SingaPay → Webhook/status check → Subscription aktif
```

Endpoint webhook:

```text
POST /api/billing/webhook/singapay
```

SingaPay memakai credential dari backend. Credential tidak pernah dikirim ke frontend.

Jika webhook tidak segera diterima, halaman Paket & Langganan melakukan pengecekan status transaksi sebagai fallback.

## 13. Email dan PDF booking

Email dikirim saat:

- Booking langsung terkonfirmasi tanpa pembayaran, atau
- Test Bayar selesai, atau
- Pembayaran booking selesai menurut flow yang tersedia.

Email berisi ringkasan booking dan PDF terlampir.

Contoh konfigurasi Gmail:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@gmail.com
SMTP_PASSWORD=app-password
SMTP_FROM=BookingKu <email@gmail.com>
```

`SMTP_PASSWORD` harus berupa Google App Password, bukan password login Gmail biasa. Jika Google menampilkan App Password dengan spasi sebagai pengelompokan, gunakan nilainya tanpa spasi di `.env`.

PDF dibuat server-side dalam format A4 dan berisi:

- Nama bisnis
- Kode booking
- Status booking
- Layanan/paket
- Tanggal dan jam
- Data customer
- Status pembayaran
- Total harga
- Alamat dan kontak bisnis

Endpoint download:

```text
GET /api/public/:slug/book/:id/receipt
```

## 14. Struktur collection MongoDB

Prefix collection mengikuti aturan project:

| Collection | Jenis | Isi |
|---|---|---|
| `tm_user` | Master | Owner dan Admin Pusat |
| `tm_business` | Master | Identitas bisnis, slug, profil, jam, QRIS, subscription |
| `tm_catalog` | Master | Layanan, staff, olahraga, lapangan, paket, room, add-on |
| `tt_booking` | Transaksi | Data booking customer dan status booking |
| `tt_payment` | Transaksi | Pembayaran paket owner dan status provider |
| `tp_plan` | Pengaturan | Katalog paket Trial, Pro, Business |

Semua catalog dan transaksi owner harus memiliki `business_id`. Query owner selalu dibatasi berdasarkan `business_id` dari JWT.

## 15. Endpoint API

### Umum

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/health` | Cek API dan status konfigurasi pembayaran |
| `GET` | `/api/plans` | Katalog paket publik dan status pembayaran |

### Auth

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/auth/register` | Membuat owner dan business kosong |
| `POST` | `/api/auth/login` | Login owner atau Admin Pusat |

Endpoint terproteksi menggunakan header:

```http
Authorization: Bearer <JWT>
```

### Owner

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/me` | Data user/business saat ini |
| `PATCH` | `/api/business` | Update profil, cover, galeri, jam, deposit, QRIS |
| `GET` | `/api/catalog` | Daftar master data milik business |
| `POST` | `/api/catalog` | Tambah master data |
| `PATCH` | `/api/catalog/:id` | Edit master data milik business |
| `DELETE` | `/api/catalog/:id` | Hapus master data milik business |
| `GET` | `/api/bookings` | Daftar booking milik business |
| `PATCH` | `/api/bookings/:id/status` | Ubah status booking |

### Billing owner

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/billing` | Subscription, pending payment, dan status SingaPay |
| `POST` | `/api/billing/checkout` | Membuat checkout paket Pro/Business |
| `GET` | `/api/billing/status/:reference` | Cek status payment link |
| `POST` | `/api/billing/webhook/singapay` | Menerima webhook SingaPay |

### Public booking

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/public/:slug` | Data bisnis dan catalog aktif |
| `GET` | `/api/public/:slug/availability` | Slot tersedia berdasarkan tanggal/durasi/resource/staff |
| `POST` | `/api/public/:slug/book` | Membuat booking customer |
| `POST` | `/api/public/:slug/book/:id/test-pay` | Menyelesaikan pembayaran simulasi |
| `GET` | `/api/public/:slug/book/:id/receipt` | Download PDF bukti booking |

## 16. Keamanan dan aturan data

- Password disimpan sebagai hash bcrypt.
- JWT berlaku 7 hari.
- Credential pembayaran dan SMTP hanya dibaca backend.
- Endpoint owner selalu menggunakan `business_id` dari JWT.
- Endpoint public hanya mengambil catalog aktif dari slug business yang diminta.
- Customer tidak dapat mengakses dashboard owner.
- Aksi hapus dan perubahan status menggunakan dialog internal aplikasi.
- Tidak ada browser `alert()` untuk alur utama.

## 17. Media dan penyimpanan foto

Prototype saat ini menyimpan cover, galeri, dan gambar master sebagai Data URL di MongoDB. Ini memudahkan pengembangan lokal, tetapi tidak ideal untuk production.

Untuk production, pindahkan file ke object storage seperti:

- S3-compatible storage
- Cloudinary
- CDN storage lain

MongoDB sebaiknya hanya menyimpan URL file.

## 18. Troubleshooting

### API tidak bisa diakses frontend

Periksa:

1. Backend berjalan di port yang sesuai.
2. `web/.env` memiliki `VITE_API_URL` yang benar.
3. `api/.env` memiliki `FRONTEND_URL` yang sama dengan alamat frontend.
4. Tidak ada port lain yang memakai `3000` atau `5173`.

### MongoDB gagal tersambung

Periksa `MONGODB_URI`, service MongoDB, dan nama database pada `MONGODB_DB`.

### Paket SingaPay tidak bisa dibayar

Periksa:

- `PAYMENT_MODE=sandbox`
- `PAYMENT_PROVIDER=singapay`
- `SINGAPAY_BASE_URL`
- Client ID
- Client secret
- API key
- Account ID, jika akun tidak dapat ditemukan otomatis

Cek cepat melalui:

```text
GET http://localhost:3000/health
```

### QRIS tidak valid

Pastikan yang ditempel adalah QRIS static merchant lengkap, bukan gambar QR atau QRIS dynamic. String harus masih memiliki bagian CRC di akhir.

### Email tidak terkirim

Periksa SMTP host, port, user, App Password, dan `SMTP_FROM`. Tanpa SMTP, booking tetap tersimpan dan PDF tetap dapat di-download, tetapi email akan berstatus tidak terkonfigurasi/gagal.

### Admin Pusat tidak bisa login

Isi credential berikut di `api/.env`:

```env
PLATFORM_ADMIN_NAME=Platform Admin
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=password-kuat
```

Lalu jalankan:

```bash
npm run seed
```

## 19. Batasan MVP saat ini

- Customer belum memiliki akun atau halaman history booking.
- Test Bayar QRIS masih simulasi.
- QRIS belum menerima callback settlement dari payment provider.
- Foto masih disimpan sebagai Data URL.
- Belum ada upload object storage production.
- Belum ada notifikasi WhatsApp.
- Billing paket masih fokus pada flow SingaPay Payment Link.

## 20. Checklist sebelum production

- Ganti `JWT_SECRET` dengan secret acak yang panjang.
- Gunakan MongoDB production dengan autentikasi.
- Gunakan `FRONTEND_URL` production yang benar.
- Pindahkan foto ke object storage.
- Aktifkan SMTP production dan uji email.
- Uji webhook SingaPay dari endpoint yang dapat diakses publik.
- Set `PAYMENT_MODE=live` hanya setelah sandbox berhasil.
- Nonaktifkan atau hapus tombol Test Bayar.
- Tambahkan rate limit dan logging terstruktur.
- Uji seluruh template bisnis di desktop, tablet, dan mobile.
