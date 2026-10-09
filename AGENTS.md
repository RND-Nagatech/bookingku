# AGENTS.md — BookingKu Templates v3

## Product rules

1. Bahasa UI Indonesia.
2. Frontend folder `web`, backend folder `api`.
3. ENV harus terpisah:
   - `api/.env` untuk PORT, MongoDB, JWT, CORS/backend config.
   - `web/.env` untuk `VITE_API_URL`.
4. Jangan gunakan Vite proxy sebagai koneksi utama API.
5. MongoDB memakai prefix:
   - `tm_` master
   - `tt_` transaksi
   - `tp_` pengaturan
6. Multi-tenant: semua master/transaksi owner wajib terikat `business_id`.
7. Jangan membuat seed/default business data saat registrasi.
8. Jangan menampilkan fitur/menu yang belum punya flow dan backend nyata.
9. Customer public booking tidak perlu login.
10. Format uang Rupiah sejak input/display yang relevan.

## Template behavior

### Salon / Barbershop
- Master: Layanan, Staff/Stylist.
- Public flow: Layanan → Stylist opsional → Tanggal/Jam → Customer → Booking.

### Lapangan Olahraga
- Master: Jenis Olahraga, Lapangan.
- Public flow: Olahraga → Lapangan → Durasi → Tanggal/Jam → Customer → Booking.

### Studio Foto
- Master: Paket Foto, Studio/Room, Add-on.
- Business display: Cover + Galeri Studio terpisah.
- Public flow visual seperti microsite: Hero → Gallery → Paket → Add-on → Room → Jadwal → Ringkasan → Customer.
- Foto paket tidak boleh dianggap sebagai galeri bisnis.

## Empty-state rule

Akun baru harus terlihat kosong dan eksplisit. Gunakan setup checklist untuk mengarahkan owner. Jangan menambahkan paket, harga, layanan, staff, lapangan, studio, add-on, atau gambar contoh ke database.
