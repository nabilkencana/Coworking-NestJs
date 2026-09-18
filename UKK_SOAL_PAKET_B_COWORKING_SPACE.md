# SOAL UJI KOMPETENSI KEAHLIAN (UKK) REKAYASA PERANGKAT LUNAK
## TAHUN PELAJARAN 2026/2027 — SMK TELKOM MALANG
### PAKET B — APLIKASI RESERVASI COWORKING SPACE & WORKSTATION (SMART SPACE BOOKING)

---

## PETUNJUK UMUM & KETENTUAN KATEGORI

- **Bentuk Soal**: Penugasan Perorangan (Praktik)
- **Judul Tugas**: Aplikasi Reservasi Coworking Space & Workstation (Smart Space Booking)
- **Paket**: Paket B
- **Kategori Pengerjaan Backend (Lampiran B, Hal. 39)**:
  - **Output**: RESTful API sesuai Kontrak API (Bagian III).
  - **Tools**: Node.js/Express, NestJS, atau Laravel.
  - **Basis Data**: Dibuat dan dikelola sendiri (MySQL / PostgreSQL via Prisma/Sequelize).
  - **Akses API Panitia**: Tidak perlu (Peserta Backend yang menyediakan server API).
  - **Dokumentasi Wajib**: Postman Collection (+ Newman), Swagger UI di `/docs`, dan README.md.

---

## BAGIAN II. GAMBAR KERJA & KEBUTUHAN FITUR (Hal. 3)

Sistem terdiri dari dua entitas pengguna utama:

### 1. Member / Pengunjung
1. Register akun pelanggan/pengunjung (`nama_member`, `instansi`, `telp`, `alamat`, `username`, `password`, `foto`).
2. Login ke aplikasi pemesanan.
3. Melihat katalog ketersediaan space (*Personal Desk*, *Private Office*, *Meeting Room*) lengkap dengan foto, kapasitas, fasilitas pendukung, dan harga per jam.
4. Memesan / reservasi space dengan memilih tanggal, jam mulai, durasi sewa (jam), serta memasukkan kode potongan harga / promo diskon.
5. Melihat status pemesanan (*belum_dikonfirm*, *disetujui*, *aktif*, *selesai*, *dibatalkan*).
6. Melihat histori pemesanan berdasarkan filter bulan dan tahun.
7. Mencetak e-ticket / bukti nota reservasi (disertai kode reservasi dan QR Code untuk check-in di lokasi).
8. Membatalkan reservasi (hanya jika status masih *belum_dikonfirm* atau *disetujui*).

### 2. Admin Pengelola Space (`admin_space`)
1. Register lokasi coworking space, profil pengelola, dan akun admin.
2. Login ke halaman pengelolaan space.
3. Update data profil lokasi coworking space (`nama_coworking`, `nama_pemilik`, `telp`).
4. CRUD data member/pelanggan (termasuk upload foto & reset kata sandi).
5. CRUD data ruangan/meja (*space*): tipe space (*desk*, *meeting_room*, *private_office*), kapasitas, tarif per jam, deskripsi fasilitas, dan foto.
6. CRUD data kode promo/diskon event (`nama_diskon`, `persentase_diskon`, `tanggal_awal`, `tanggal_akhir`).
7. Konfirmasi pemesanan, ubah status pesanan, serta manajemen operasional:
   - **Check-In**: Mengubah status dari *disetujui* menjadi *aktif* + mencatat `check_in_time`.
   - **Check-Out**: Mengubah status dari *aktif* menjadi *selesai* + mencatat `check_out_time`.
8. Melihat seluruh data reservasi dengan filter status, filter bulan, filter space, dan filter tanggal.
9. Rekapitulasi estimasi pendapatan per bulan dan distribusi pendapatan per jenis space.

---

## DESAIN BASIS DATA (ERD) & MULTI-TENANCY (Hal. 4)

### Tabel-tabel Utama:
1. **`app_maker`** (Multi-Tenancy Siswa / Panel Penguji):
   - `id` (INT, PK)
   - `name` (VARCHAR)
   - `username` (VARCHAR, Unique)
   - `email` (VARCHAR, Unique)
   - `password` (VARCHAR, Hashed)
   - `app_key` (VARCHAR, Unique, format: `mk_<32_hex>`)
   - `created_at`, `updated_at` (DATETIME)

2. **`users`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `username` (VARCHAR 50)
   - `password` (VARCHAR 255, Hashed)
   - `role` (ENUM: `admin_space`, `member`)
   - `created_at`, `updated_at` (DATETIME)

3. **`member`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `id_user` (INT, FK -> users.id, 1:1)
   - `nama_member` (VARCHAR 100)
   - `instansi` (VARCHAR 100)
   - `alamat` (TEXT)
   - `telp` (VARCHAR 20)
   - `foto` (VARCHAR 255, nullable)
   - `created_at`, `updated_at` (DATETIME)

4. **`space_owner`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `id_user` (INT, FK -> users.id, 1:1)
   - `nama_coworking` (VARCHAR 100)
   - `nama_pemilik` (VARCHAR 100)
   - `telp` (VARCHAR 20)
   - `created_at`, `updated_at` (DATETIME)

5. **`space`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `id_owner` (INT, FK -> space_owner.id)
   - `nama_space` (VARCHAR 100)
   - `harga_per_jam` (DOUBLE / INT)
   - `tipe` (ENUM: `desk`, `meeting_room`, `private_office`)
   - `kapasitas` (INT)
   - `deskripsi` (TEXT)
   - `foto` (VARCHAR 255, nullable)
   - `created_at`, `updated_at` (DATETIME)

6. **`diskon`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `nama_diskon` (VARCHAR 100)
   - `persentase_diskon` (DOUBLE)
   - `tanggal_awal` (DATETIME)
   - `tanggal_akhir` (DATETIME)
   - `created_at`, `updated_at` (DATETIME)

7. **`reservasi`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `id_owner` (INT, FK -> space_owner.id)
   - `id_member` (INT, FK -> member.id)
   - `kode_booking` (VARCHAR 50, Unique, format: `BOOK-YYYYMMDD-XXXX`)
   - `tanggal_reservasi` (DATE / VARCHAR)
   - `jam_mulai` (VARCHAR "HH:mm")
   - `jam_selesai` (VARCHAR "HH:mm", kalkulasi otomatis)
   - `durasi_jam` (INT)
   - `status` (ENUM: `belum_dikonfirm`, `disetujui`, `aktif`, `selesai`, `dibatalkan`)
   - `check_in_time` (DATETIME, nullable)
   - `check_out_time` (DATETIME, nullable)
   - `created_at`, `updated_at` (DATETIME)

8. **`detail_reservasi`**:
   - `id` (INT, PK)
   - `id_maker` (INT, FK -> app_maker.id)
   - `id_reservasi` (INT, FK -> reservasi.id, 1:1)
   - `id_space` (INT, FK -> space.id)
   - `id_diskon` (INT, FK -> diskon.id, nullable)
   - `harga_per_jam` (DOUBLE / INT, snapshot transaksi)
   - `total_harga_awal` (DOUBLE / INT)
   - `potongan_diskon` (DOUBLE / INT)
   - `total_bayar` (DOUBLE / INT)
   - `created_at`, `updated_at` (DATETIME)

---

## KETENTUAN GLOBAL & FORMAT RESPONSE (Hal. 7)

### 1. Struktur Baku Response JSON:
* **Response Sukses (200/201)**:
  ```json
  {
    "status": true,
    "statusCode": 200,
    "message": "Keterangan sukses",
    "data": { ... },
    "timestamp": "2026-08-27T08:34:46.977Z"
  }
  ```
* **Response Error (400/401/403/404/500)**:
  ```json
  {
    "status": false,
    "statusCode": 400,
    "message": "Keterangan error",
    "error": "Bad Request",
    "timestamp": "2026-08-27T08:34:46.977Z"
  }
  ```

### 2. Aturan Multi-Tenancy Header:
* Header `x-maker-key` (alias `x-app-key`) disertakan oleh client untuk mengisolasi data per siswa/tenant.
* Jika `x-maker-key` tidak disertakan, sistem dapat menyediakan **Default Maker Fallback** sehingga siswa yang langsung memanggil endpoint Auth (`/api/auth/*`) tetap dapat beroperasi tanpa hambatan.

### 3. Autentikasi JWT:
* Menggunakan header `Authorization: Bearer <token>`.
* Role: `member` (pelanggan pemesan) dan `admin_space` (pengelola coworking).

---

## LOGIKA BISNIS & KALKULASI RESERVASI (Hal. 11, 21–25)

1. **Kalkulasi Jam Selesai**: `jam_selesai = jam_mulai + durasi_jam`.
2. **Cek Bentrok Jadwal (Conflict Checking)**:
   - Ditolak (`400 Bad Request`) jika ada reservasi lain pada `id_space` yang sama, `tanggal_reservasi` yang sama, status BUKAN `dibatalkan`, dan rentang waktunya bertumpukan:
     $$\text{Overlap} \iff (\text{jam\_mulai} < \text{existing.jam\_selesai}) \land (\text{jam\_selesai} > \text{existing.jam\_mulai})$$
3. **Snapshot Harga**: `harga_per_jam` diambil dari `space` saat transaksi dan disimpan sebagai snapshot di `detail_reservasi`.
4. **Total Harga Awal**: `total_harga_awal = harga_per_jam * durasi_jam`.
5. **Resolusi Diskon Promo**:
   - Jika `id_diskon` dikirim, gunakan itu.
   - Jika `id_diskon` kosong tapi `kode_promo` dikirim, cari diskon aktif dengan `nama_diskon = kode_promo`.
   - Cek keaktifan: `tanggal_awal <= now <= tanggal_akhir`.
   - `potongan_diskon = total_harga_awal * (persentase_diskon / 100)`.
   - `total_bayar = total_harga_awal - potongan_diskon`.
6. **Kode Booking & E-Ticket**:
   - `kode_booking`: `BOOK-` + `YYYYMMDD` + `-` + 4 digit nomor id reservasi (contoh: `BOOK-20260830-0012`).
   - `qr_code_payload`: `VERIFY-RESERVASI-<id>-<app_key>`.
   - `e_ticket_number`: `TICKET-` + nama brand coworking (uppercase) + `-` + `YYYYMMDD-0012`.
7. **State Machine Status Pemesanan**:
   - Status awal: `belum_dikonfirm`
   - Dari `belum_dikonfirm` $\rightarrow$ `disetujui` atau `dibatalkan`
   - Dari `disetujui` $\rightarrow$ `aktif` (via check-in) atau `dibatalkan`
   - Dari `aktif` $\rightarrow$ `selesai` (via check-out)
   - Pembatalan oleh member (`PATCH /cancel`) hanya boleh dilakukan jika status masih `belum_dikonfirm` atau `disetujui`.

---

## DAFTAR 50 ENDPOINT API LENGKAP (Hal. 5–37)

### 01. Root & Health Check Service (Publik)
1. `GET /` — Status API & Petunjuk Penggunaan (Doc links: Swagger & Swagger JSON)
2. `GET /health` — Health Check Server

### 02. Multi-Tenancy Siswa (App Maker)
3. `POST /api/maker/register` — Registrasi Akun Siswa (Mendapatkan `app_key` unik)
4. `POST /api/maker/login` — Login Akun Siswa Pengembang Frontend
5. `GET /api/maker/me` — Lihat Profil & App Key Siswa Saat Ini (Bearer Maker)
6. `GET /api/maker/stats` — Statistik Keseluruhan Data Siswa (`x-maker-key`)
7. `GET /api/maker/list` — Daftar Semua Siswa / App Maker Terdaftar (Panel Guru/Penguji)

### 03. Autentikasi Pengguna (Member & Admin Space)
8. `POST /api/auth/register/member` — Registrasi Akun Member / Pelanggan Baru
9. `POST /api/auth/register/admin-space` — Registrasi Pengelola Lokasi / Admin Coworking Space
10. `POST /api/auth/login` — Login Akun Pengguna (Member / Admin Space)
11. `GET /api/auth/profile` — Cek Profil & Hak Akses Pengguna yang Sedang Login

### 04. Space Coworking (Katalog & Ketersediaan)
12. `GET /api/spaces/types` — Daftar Tipe Space (Personal Desk, Meeting Room, Private Office)
13. `GET /api/spaces/availability` — Cek Ketersediaan Space Berdasarkan Tanggal & Jam (`?id_space, ?tanggal, ?jam_mulai, ?durasi_jam`)
14. `GET /api/spaces` — Lihat Semua Space Coworking (Filter `?tipe`, `?search`)
15. `GET /api/spaces/{id}` — Lihat Detail Space Coworking Berdasarkan ID

### 05. Diskon & Promo (Katalog Diskon)
16. `GET /api/diskon/active` — Daftar Promo / Diskon yang Sedang Aktif
17. `POST /api/diskon/check` — Periksa Validitas & Hitung Potongan Kode Promo (`nama_diskon`)
18. `GET /api/diskon/{id}` — Lihat Detail Diskon Berdasarkan ID

### 06. Reservasi Member (Pemesanan & Histori)
19. `POST /api/reservasi` — Buat Pemesanan Space Baru (Bearer Member)
20. `GET /api/reservasi/my` — Lihat Status Semua Pemesanan Milik Sendiri (Bearer Member)
21. `GET /api/reservasi/my/history` — Lihat Histori Pemesanan Berdasarkan Bulan & Tahun (`?month, ?year`)
22. `GET /api/reservasi/{id}/e-ticket` — Cetak E-Ticket / Bukti Nota Digital Reservasi
23. `GET /api/reservasi/{id}` — Lihat Detail Reservasi Berdasarkan ID
24. `PATCH /api/reservasi/{id}/cancel` — Batalkan Pemesanan Space (Bearer Member)

### 07. Profil Lokasi Coworking Space (Panel Admin)
25. `GET /api/admin/profile` — Lihat Data Profil Lokasi Coworking Space (Bearer Admin)
26. `PUT /api/admin/profile` — Update Data Profil Lokasi Coworking Space (Bearer Admin)

### 08. Manajemen Member / Pelanggan (Panel Admin)
27. `GET /api/admin/members` — Daftar Semua Member / Pelanggan (`?search`)
28. `POST /api/admin/members` — Tambah Data Member Baru oleh Admin (Upload Foto & Auto Create User)
29. `GET /api/admin/members/{id}` — Detail Data Member Berdasarkan ID
30. `PUT /api/admin/members/{id}` — Update Data Member / Pelanggan
31. `DELETE /api/admin/members/{id}` — Hapus Data Member / Pelanggan

### 09. Manajemen Space Ruangan & Meja (Panel Admin)
32. `GET /api/admin/spaces` — Daftar Semua Ruangan & Meja Milik Admin Login
33. `POST /api/admin/spaces` — Tambah Ruangan / Meja Space Baru Beserta Fasilitas & Foto
34. `GET /api/admin/spaces/{id}` — Detail Data Space Berdasarkan ID
35. `PUT /api/admin/spaces/{id}` — Update Data Ruangan & Fasilitas Space
36. `DELETE /api/admin/spaces/{id}` — Hapus Data Ruangan / Meja Space

### 10. Manajemen Kode Promo & Diskon (Panel Admin)
37. `GET /api/admin/diskon` — Daftar Semua Kode Promo / Diskon Event
38. `POST /api/admin/diskon` — Tambah Kode Promo / Diskon Event Baru
39. `GET /api/admin/diskon/{id}` — Detail Data Diskon Berdasarkan ID
40. `PUT /api/admin/diskon/{id}` — Update Data Kode Promo & Periode Diskon
41. `DELETE /api/admin/diskon/{id}` — Hapus Kode Promo / Diskon

### 11. Transaksi Reservasi & Check-In/Check-Out (Panel Admin)
42. `GET /api/admin/reservasi` — Lihat Seluruh Data Reservasi Coworking Space (`?month, ?year, ?status, ?id_space, ?tanggal`)
43. `PATCH /api/admin/reservasi/{id}/status` — Konfirmasi & Ubah Status Pemesanan (`disetujui`, `dibatalkan`)
44. `POST /api/admin/reservasi/{id}/check-in` — Check-In Pelanggan (Status berubah ke `aktif` + `check_in_time`)
45. `POST /api/admin/reservasi/{id}/check-out` — Check-Out Pelanggan (Status berubah ke `selesai` + `check_out_time`)

### 12. Rekapitulasi Laporan Pendapatan Bulanan (Panel Admin)
46. `GET /api/admin/reports/monthly` — Rekapitulasi Estimasi & Realisasi Pendapatan Per Bulan (`?month, ?year`)
47. `GET /api/admin/reports/income` — Alias Rekapitulasi Pendapatan Bulanan

### 13. Upload Berkas & Gambar (Media)
48. `POST /api/upload/image` — Upload Berkas Gambar Umum (`multipart/form-data`)
49. `POST /api/upload/spaces` — Upload Foto Ruangan / Space Coworking
50. `POST /api/upload/members` — Upload Foto Profil Member / Pelanggan
