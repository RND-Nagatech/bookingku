# BookingKu Template-Based — Product Spec v3

## Tujuan

Menyediakan satu SaaS booking dengan tiga template vertikal, tanpa AI-generated setup. Owner memilih jenis bisnis saat registrasi, lalu UI admin dan halaman publik customer mengikuti template tersebut.

## Empty onboarding

Registrasi hanya menyimpan data yang benar-benar dimasukkan user: nama user, email, nama bisnis, jenis bisnis, dan status trial. Semua master operasional dimulai kosong.

Dashboard menampilkan setup checklist, bukan seed data.

## Media architecture

### Cover
Satu gambar hero bisnis.

### Gallery
Koleksi gambar profil bisnis. Untuk Studio Foto, gallery menjadi elemen visual utama halaman customer. Mendukung multi-drop, hapus, dan reorder.

### Catalog image
Gambar per item master, misalnya foto paket, foto room, foto layanan, foto stylist, atau foto lapangan. Ini tidak bercampur dengan gallery bisnis.

## Studio Foto customer page

Halaman harus berfungsi sebagai microsite:
1. Hero bisnis
2. Gallery
3. Keunggulan singkat
4. Paket + weekday/weekend pricing
5. Add-on
6. Studio/room
7. Tanggal + slot
8. Customer info
9. Sticky booking summary
10. Lokasi + jam operasional

## Availability

Slot dibuat berdasarkan opening hours owner dan durasi item. Konflik diperiksa terhadap resource/staff bila dipilih. Jika tidak ada resource/staff, bisnis dianggap memiliki satu kapasitas simultan agar tidak terjadi double booking.
