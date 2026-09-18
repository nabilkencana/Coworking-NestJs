# Design Document: Smart Space Booking Backend (NestJS + Prisma + Neon PostgreSQL)

- **Date**: 2026-09-18
- **Project**: UKK RPL 2026/2027 — Paket B — Smart Space Booking (Coworking Space Reservation API)
- **Framework**: NestJS (TypeScript)
- **ORM & Database**: Prisma ORM with Neon Cloud PostgreSQL (`ep-soft-hat-b3v3g561`)
- **Status**: Approved for Implementation

---

## 1. System Goals & Architecture Overview

The Smart Space Booking API provides a robust, production-grade RESTful API for online workstation and coworking space reservations. It cleanly separates concerns between two primary application roles:
- **`member`**: Customers who browse spaces, check availability, create reservations with promo discounts, inspect booking history, view digital e-tickets, and cancel eligible bookings.
- **`admin_space`**: Space managers who configure their coworking profile, manage customer records, maintain spaces/desks/meeting rooms, issue promo codes, confirm reservations, handle check-in / check-out operations, and inspect monthly financial reports.

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Web / Postman)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       NestJS HTTP Core                      │
│  ├── TransformInterceptor (Uniform Success JSON Response)   │
│  ├── HttpExceptionFilter   (Uniform Error JSON Response)    │
│  ├── ValidationPipe        (class-validator / DTOs)         │
│  └── JwtAuthGuard & RolesGuard (@Roles('member'|'admin_space')│
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌───────────────┐       ┌───────────────┐
│  AuthModule  │       │ SpacesModule  │       │ReservasiModule│
└──────────────┘       └───────────────┘       └───────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌───────────────┐       ┌───────────────┐
│ DiskonModule │       │  AdminModule  │       │ UploadModule  │
└──────────────┘       └───────────────┘       └───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Prisma ORM (Database Access Layer)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ SSL Pooler Connection
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Neon PostgreSQL (Cloud DB)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Prisma ORM)

Consolidating `reservasi` and `detail_reservasi` into a single, high-performance table as established in the project specification:

### Models

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  member
  admin_space
}

enum SpaceType {
  desk
  meeting_room
  private_office
}

enum ReservationStatus {
  belum_dikonfirm
  disetujui
  aktif
  selesai
  dibatalkan
}

model User {
  id         Int         @id @default(autoincrement())
  username   String      @unique
  password   String
  role       Role
  member     Member?
  spaceOwner SpaceOwner?
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  @@map("users")
}

model Member {
  id          Int         @id @default(autoincrement())
  userId      Int         @unique @map("user_id")
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  namaMember  String      @map("nama_member")
  instansi    String
  alamat      String      @db.Text
  telp        String
  foto        String?
  reservasis  Reservasi[]
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@map("members")
}

model SpaceOwner {
  id           Int         @id @default(autoincrement())
  userId       Int         @unique @map("user_id")
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  namaCoworking String     @map("nama_coworking")
  namaPemilik  String      @map("nama_pemilik")
  telp         String
  alamat       String?     @db.Text
  deskripsi    String?     @db.Text
  spaces       Space[]
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  @@map("space_owners")
}

model Space {
  id          Int         @id @default(autoincrement())
  ownerId     Int         @map("owner_id")
  owner       SpaceOwner  @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  namaSpace   String      @map("nama_space")
  hargaPerJam Int         @map("harga_per_jam")
  tipe        SpaceType
  kapasitas   Int
  deskripsi   String      @db.Text
  foto        String?
  reservasis  Reservasi[]
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  @@index([ownerId])
  @@map("spaces")
}

model Diskon {
  id               Int         @id @default(autoincrement())
  namaDiskon       String      @unique @map("nama_diskon")
  persentaseDiskon Int         @map("persentase_diskon")
  tanggalAwal      DateTime    @map("tanggal_awal")
  tanggalAkhir     DateTime    @map("tanggal_akhir")
  reservasis       Reservasi[]
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  @@map("diskons")
}

model Reservasi {
  id               Int               @id @default(autoincrement())
  kodeBooking      String            @unique @map("kode_booking")
  memberId         Int               @map("member_id")
  member           Member            @relation(fields: [memberId], references: [id], onDelete: Cascade)
  spaceId          Int               @map("space_id")
  space            Space             @relation(fields: [spaceId], references: [id], onDelete: Restrict)
  diskonId         Int?              @map("diskon_id")
  diskon           Diskon?           @relation(fields: [diskonId], references: [id], onDelete: SetNull)
  tanggalReservasi String            @map("tanggal_reservasi") // YYYY-MM-DD
  jamMulai         String            @map("jam_mulai")         // HH:mm
  jamSelesai       String            @map("jam_selesai")       // HH:mm
  durasiJam        Int               @map("durasi_jam")
  hargaPerJam      Int               @map("harga_per_jam")     // Snapshot at transaction time
  totalHargaAwal   Int               @map("total_harga_awal")
  potonganDiskon   Int               @map("potongan_diskon")
  totalBayar       Int               @map("total_bayar")
  status           ReservationStatus @default(belum_dikonfirm)
  checkInAt        DateTime?         @map("check_in_at")
  checkOutAt       DateTime?         @map("check_out_at")
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  @@index([spaceId, tanggalReservasi])
  @@index([memberId])
  @@index([status])
  @@map("reservasis")
}
```

---

## 3. Uniform Response Contract & Interceptors

All API endpoints strictly output standard JSON formats:

### Success Format (200 / 201):
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Berhasil memproses permintaan",
  "data": { ... },
  "timestamp": "2026-09-18T13:40:00.000Z"
}
```

### Error Format (400 / 401 / 403 / 404 / 500):
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Deskripsi pesan error",
  "error": "Bad Request",
  "timestamp": "2026-09-18T13:40:00.000Z"
}
```

Implemented globally via:
1. `TransformInterceptor`: intercepts all successful responses and formats the payload.
2. `HttpExceptionFilter`: catches all `HttpException` and unhandled exceptions, formatting the output consistently without leaking internal stack traces.

---

## 4. API Endpoints Specification

### 4.1 Root & Health Check
- `GET /`: API overview, status `online`, version, and Swagger documentation links (`/docs`).
- `GET /health`: Returns `{ status: "ok" }`.

### 4.2 Authentication (`/api/auth`)
- `POST /api/auth/register/member`: Register member account with personal profile (`nama_member`, `instansi`, `alamat`, `telp`, optional `foto`).
- `POST /api/auth/register/admin-space`: Register admin with coworking facility profile (`nama_coworking`, `nama_pemilik`, `telp`, `alamat`, `deskripsi`).
- `POST /api/auth/login`: Authenticate with username and password, returns JWT token + loaded member / space_owner profile.
- `GET /api/auth/profile`: Protected endpoint returning authenticated user profile according to active role.
- `POST /api/auth/logout`: Invalidates session / clears token context.

### 4.3 Spaces Catalog & Availability (`/api/spaces`)
- `GET /api/spaces/types`: Static list of space types (`desk`, `meeting_room`, `private_office`) with display labels and descriptions.
- `GET /api/spaces/availability`: Query parameters `id_space`, `tanggal`, `jam_mulai`, `durasi_jam`. Checks whether the requested slot is open or overlaps with an existing reservation.
- `GET /api/spaces`: Catalog of spaces with optional filters `?tipe` and `?search` (by name or facilities description), including owner info and `foto_url`.
- `GET /api/spaces/:id`: Detailed view of a single space.

### 4.4 Diskon & Promo (`/api/diskon`)
- `GET /api/diskon/active`: List discounts where `tanggal_awal <= now <= tanggal_akhir`.
- `POST /api/diskon/check`: Body `{ nama_diskon }`. Validates whether promo code exists and is currently active.
- `GET /api/diskon/:id`: Detail view of a discount.

### 4.5 Reservasi Member (`/api/reservasi`)
- `POST /api/reservasi`: Create reservation with conflict check and server-side pricing.
- `GET /api/reservasi/my`: List reservations for the logged-in member.
- `GET /api/reservasi/my/history`: Monthly history with filters `?month` and `?year`, aggregated `total_reservasi`, `total_pengeluaran`, and `items[]`.
- `GET /api/reservasi/:id/e-ticket`: Digital e-ticket with `e_ticket_number`, `kode_booking`, space details, payment breakdown, and `qr_code_payload` (`VERIFY-RESERVASI-<id>-<kode_booking>`).
- `GET /api/reservasi/:id`: Reservation detail.
- `PATCH /api/reservasi/:id/cancel`: Member cancellation (only permissible when status is `belum_dikonfirm` or `disetujui`).

### 4.6 Admin Panel (`/api/admin`)
- Profile: `GET /api/admin/profile`, `PUT /api/admin/profile`.
- Members: `GET /api/admin/members`, `POST /api/admin/members`, `GET /api/admin/members/:id`, `PUT /api/admin/members/:id`, `DELETE /api/admin/members/:id`.
- Spaces: `GET /api/admin/spaces`, `POST /api/admin/spaces`, `GET /api/admin/spaces/:id`, `PUT /api/admin/spaces/:id`, `DELETE /api/admin/spaces/:id` (strictly scoped to `ownerId`).
- Diskon: `GET /api/admin/diskon`, `POST /api/admin/diskon`, `GET /api/admin/diskon/:id`, `PUT /api/admin/diskon/:id`, `DELETE /api/admin/diskon/:id`.
- Reservasi:
  - `GET /api/admin/reservasi`: Filter by `?month`, `?year`, `?status`, `?id_space`, `?tanggal`.
  - `PATCH /api/admin/reservasi/:id/status`: Update status (`disetujui`, `dibatalkan`).
  - `POST /api/admin/reservasi/:id/check-in`: Transition from `disetujui` to `aktif` + sets `checkInAt`.
  - `POST /api/admin/reservasi/:id/check-out`: Transition from `aktif` to `selesai` + sets `checkOutAt`.
- Reports:
  - `GET /api/admin/reports/monthly`: Calculates `total_transaksi`, `total_jam_terpakai`, `estimasi_pendapatan_kotor`, `total_potongan_diskon`, `realisasi_pendapatan_bersih` (status `selesai`), and `rincian_per_tipe_space[]`.
  - `GET /api/admin/reports/income`: Compact monthly income summary.

### 4.7 Uploads (`/api/upload`)
- `POST /api/upload/image`: General image upload to `uploads/general/`.
- `POST /api/upload/spaces`: Space photo upload to `uploads/spaces/`.
- `POST /api/upload/members`: Member avatar upload to `uploads/members/`.
Files served statically at `http://localhost:3000/uploads/*`.

---

## 5. Core Business Logic & Algorithms

### Overlap Detection:
Two time slots `[A_start, A_end)` and `[B_start, B_end)` conflict if:
$$A_{start} < B_{end} \quad\text{and}\quad B_{start} < A_{end}$$
Status `dibatalkan` is ignored during conflict evaluation.

### Pricing Calculation:
1. `jam_selesai = calculateEndTime(jam_mulai, durasi_jam)`
2. `total_harga_awal = harga_per_jam * durasi_jam`
3. If promo discount valid and active (`tanggal_awal <= now <= tanggal_akhir`):
   `potongan_diskon = Math.round(total_harga_awal * persentase_diskon / 100)`
4. `total_bayar = total_harga_awal - potongan_diskon`
5. `kode_booking = "BOOK-" + YYYYMMDD + "-" + pad4(id)`

---

## 6. Testing Strategy

1. **Jest + Supertest Integration Tests (`tests/`)**:
   - `tests/auth.spec.ts`: Register member/admin, duplicate username rejection, login, profile, logout.
   - `tests/spaces.spec.ts`: Static types, catalog query, availability conflict check, detail.
   - `tests/diskon.spec.ts`: Active discounts list, check promo validation, detail.
   - `tests/reservasi.spec.ts`: Create reservation pricing math, schedule collision rejection, my reservations, e-ticket, cancel rules.
   - `tests/admin.spec.ts`: Profile update, member CRUD, space CRUD with ownership isolation, check-in, check-out, monthly financial report aggregations.
   - `tests/upload.spec.ts`: File upload and static asset serving.
2. **Newman CLI Postman Execution**:
   - Runs `postman/Coworking-Space-API.postman_collection.json` against the active server.
