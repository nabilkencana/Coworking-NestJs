# Smart Space Booking API

**UKK RPL 2026/2027 — Paket B — SMK Telkom Malang**

RESTful API untuk sistem reservasi *Coworking Space & Workstation* berbasis NestJS 11, Prisma ORM, dan Neon PostgreSQL.

---

## 📦 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma 6 |
| Database | Neon PostgreSQL (Cloud) |
| Auth | JWT (Passport-JWT) |
| Validasi | class-validator + class-transformer |
| Upload | Multer (disk storage) |
| Docs | Swagger UI (`/docs`) |
| Testing | Jest + Supertest |

---

## ⚙️ Persyaratan

- Node.js >= 20
- npm >= 10
- Koneksi internet (Neon Cloud DB)

---

## 🚀 Instalasi

```bash
# Clone repository
git clone <url-repo>
cd coworking-space

# Install dependencies
npm install
```

---

## 🔧 Konfigurasi Environment

Buat file `.env` di root proyek:

```env
DATABASE_URL="postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:<password>@<host>/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

---

## 🗃️ Migrasi Database

```bash
# Jalankan migrasi Prisma
npx prisma migrate deploy

# Atau buat migrasi baru (development)
npx prisma migrate dev --name init_schema
```

---

## 🌱 Seeder (Data Awal)

```bash
# Jalankan seeder untuk data dummy (admin, member, space, diskon)
npx prisma db seed
```

**Akun Seeder:**

| Role | Username | Password |
|---|---|---|
| Admin Coworking | `admin_space1` | `Admin123!` |
| Admin Coworking | `admin_space2` | `Admin123!` |
| Member | `johndoe` | `Secret123!` |
| Member | `janesmith` | `Secret123!` |

---

## ▶️ Menjalankan Server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server berjalan di: **http://localhost:3000**

---

## 📚 Dokumentasi API (Swagger)

Setelah server berjalan:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs-json
- **Root info**: http://localhost:3000/
- **Health check**: http://localhost:3000/health

---

## 🧪 Pengujian

```bash
# Jalankan seluruh unit & e2e test
npm test

# Jalankan secara berurutan (lebih stabil untuk e2e)
npx jest --runInBand

# Test coverage
npm run test:cov

# Test satu modul saja
npx jest tests/auth.spec.ts
npx jest tests/admin.spec.ts
```

**Hasil pengujian: 66 tests / 9 suites — 100% PASS**

---

## 📡 Katalog Endpoint

### 🔓 Publik (tanpa token)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/` | Metadata API & daftar endpoint |
| GET | `/health` | Health check server |
| POST | `/api/auth/register` | Registrasi member baru |
| POST | `/api/auth/login` | Login (member & admin), returns JWT |
| GET | `/api/spaces` | Katalog semua ruangan aktif |
| GET | `/api/spaces/types` | Daftar tipe space |
| GET | `/api/spaces/availability` | Cek ketersediaan ruangan |
| GET | `/api/spaces/:id` | Detail ruangan |
| GET | `/api/diskon` | Daftar promo aktif |
| GET | `/api/diskon/check?kode=XXX` | Cek promo by kode |
| GET | `/api/diskon/:id` | Detail promo |

### 🔐 Member (JWT required — role: `member`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/auth/profile` | Profil member |
| PUT | `/api/auth/profile` | Update profil member |
| POST | `/api/reservasi` | Buat reservasi baru |
| GET | `/api/reservasi` | Daftar reservasi milik member |
| GET | `/api/reservasi/:id` | Detail reservasi + QR payload |
| DELETE | `/api/reservasi/:id` | Batalkan reservasi |

### 👑 Admin (JWT required — role: `admin_space`)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/admin/profile` | Profil admin coworking |
| PUT | `/api/admin/profile` | Update profil admin |
| POST | `/api/admin/members` | Tambah member baru |
| GET | `/api/admin/members` | Daftar semua member |
| GET | `/api/admin/members/:id` | Detail member |
| PUT | `/api/admin/members/:id` | Update member |
| DELETE | `/api/admin/members/:id` | Hapus member |
| POST | `/api/admin/spaces` | Tambah space baru |
| GET | `/api/admin/spaces` | Daftar space milik admin |
| PUT | `/api/admin/spaces/:id` | Update space |
| DELETE | `/api/admin/spaces/:id` | Hapus space |
| POST | `/api/admin/diskon` | Tambah promo diskon |
| GET | `/api/admin/diskon` | Daftar semua promo |
| DELETE | `/api/admin/diskon/:id` | Hapus promo |
| GET | `/api/admin/reservasi` | Daftar semua reservasi |
| PATCH | `/api/admin/reservasi/:id/status` | Update status reservasi |
| POST | `/api/admin/reservasi/:id/check-in` | Check-in pelanggan |
| POST | `/api/admin/reservasi/:id/check-out` | Check-out pelanggan |
| GET | `/api/admin/reports/monthly` | Laporan keuangan bulanan |
| GET | `/api/admin/reports/income` | Alias laporan pendapatan |

### 📁 Upload (public, no auth required)

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/upload/image` | Upload gambar umum → `/uploads/general/` |
| POST | `/api/upload/spaces` | Upload foto space → `/uploads/spaces/` |
| POST | `/api/upload/members` | Upload foto member → `/uploads/members/` |

---

## 📐 Format Response

Semua response menggunakan format JSON seragam:

**Success:**
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Berhasil",
  "data": { ... },
  "timestamp": "2026-09-18T14:00:00.000Z"
}
```

**Error:**
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Validasi gagal",
  "error": { ... },
  "timestamp": "2026-09-18T14:00:00.000Z"
}
```

---

## 🗂️ Struktur Proyek

```
coworking-space/
├── prisma/
│   ├── schema.prisma          # Skema database Prisma
│   └── seed.ts                # Data seeder
├── src/
│   ├── app.module.ts          # Root module
│   ├── app.controller.ts      # GET / dan GET /health
│   ├── main.ts                # Bootstrap, Swagger, static assets
│   ├── common/
│   │   ├── database/          # PrismaService & PrismaModule
│   │   ├── decorators/        # @Roles, @CurrentUser, @Public
│   │   ├── filters/           # HttpExceptionFilter (format error seragam)
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # TransformInterceptor (format success seragam)
│   │   └── utils/             # dateUtils, bookingUtils, pricingUtils
│   └── modules/
│       ├── auth/              # AuthModule: register, login, profile
│       ├── spaces/            # SpacesModule: katalog, tipe, availability, detail
│       ├── diskon/            # DiskonModule: promo aktif, cek kode, detail
│       ├── reservasi/         # ReservasiModule: buat, list, detail, batal
│       ├── admin/             # AdminModule: CRUD spaces/members/diskon, laporan
│       └── upload/            # UploadModule: multer upload ke uploads/
├── tests/                     # E2E test suites (9 suite, 66 tests)
│   ├── auth.spec.ts
│   ├── spaces.spec.ts
│   ├── diskon.spec.ts
│   ├── reservasi.spec.ts
│   ├── admin.spec.ts
│   ├── upload.spec.ts
│   ├── root.spec.ts
│   └── utils.spec.ts
└── uploads/                   # Static files (general, spaces, members)
```

---

## 🗄️ Skema Database

Model utama:

- **`users`** — akun pengguna (member & admin_space)
- **`members`** — profil detail member (1:1 dengan users)
- **`admin_coworkings`** — profil detail admin (1:1 dengan users)
- **`spaces`** — data ruangan coworking
- **`diskons`** — data promo diskon
- **`reservasis`** — data reservasi (termasuk snapshot harga & status)

Enum Status Reservasi: `belum_dikonfirm | dikonfirm | check_in | check_out | dibatalkan`

---

## 📝 Lisensi

UNLICENSED — Proyek UKK RPL SMK Telkom Malang 2026/2027
