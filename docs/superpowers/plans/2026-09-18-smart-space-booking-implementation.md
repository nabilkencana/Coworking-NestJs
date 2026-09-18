# Smart Space Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade, 100% contract-compliant RESTful API for the Coworking Space Reservation System (Smart Space Booking - UKK RPL Paket B) using NestJS, Prisma ORM, and Neon PostgreSQL.

**Architecture:** Feature-modular architecture in NestJS featuring clean domain modules (`AuthModule`, `SpacesModule`, `DiskonModule`, `ReservasiModule`, `AdminModule`, `UploadModule`), a global `CommonModule` for Prisma and utilities, uniform JSON response interceptors and filters, role-based JWT access control (`member` & `admin_space`), and static local upload serving.

**Tech Stack:** NestJS 11, TypeScript, Prisma ORM, Neon PostgreSQL, Passport JWT, BcryptJS, Class-Validator, Multer, Swagger UI, Jest + Supertest, Newman.

**Spec:** [`docs/superpowers/specs/2026-09-18-smart-space-booking-design.md`](file:///Users/nabilkencana/Documents/UKK%20Backend/coworking-space/docs/superpowers/specs/2026-09-18-smart-space-booking-design.md)

## Global Constraints

- Runtime: Node.js + NestJS + TypeScript.
- Database: Neon Cloud PostgreSQL via Prisma ORM using pooled connection for queries and unpooled direct connection for migrations.
- Password Security: Min 6 characters, hashed with bcrypt.
- Uniform Success JSON: `{ status: true, statusCode: number, message: string, data: any, timestamp: string }`.
- Uniform Error JSON: `{ status: false, statusCode: number, message: string, error: string, timestamp: string }`.
- Date Format: `YYYY-MM-DD`, Time: `HH:mm`, Timestamp: ISO 8601.
- Booking Code: `BOOK-YYYYMMDD-XXXX` (where XXXX is zero-padded ID).
- QR Code Payload: `VERIFY-RESERVASI-<id>-<kode_booking>`.

---

### Task 1: Dependencies, Prisma Setup & Schema Migration

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Environment: `.env`

**Interfaces:**
- Produces: Prisma Client (`@prisma/client`) with models `User`, `Member`, `SpaceOwner`, `Space`, `Diskon`, `Reservasi`.

- [ ] **Step 1: Install core backend dependencies**
  Install `@prisma/client`, `prisma`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `@types/bcryptjs`, `class-validator`, `class-transformer`, `@nestjs/swagger`, `swagger-ui-express`, `multer`, `@types/multer`.

- [ ] **Step 2: Create Prisma schema**
  Write `prisma/schema.prisma` declaring the datasource (PostgreSQL with `env("DATABASE_URL")` and `env("DATABASE_URL_UNPOOLED")`), generator, Enums (`Role`, `SpaceType`, `ReservationStatus`), and the 6 relational models.

- [ ] **Step 3: Run Prisma migration on Neon PostgreSQL**
  Run `npx prisma migrate dev --name init_schema` to apply migrations directly to Neon cloud DB and generate the typed client.

- [ ] **Step 4: Create seed script with default data**
  Write `prisma/seed.ts` seeding:
  - 1 Default Space Owner (`admin_space1` / `Admin123!`) with profile `Moklet Hub Coworking`
  - 2 Spaces (`Personal Desk Alpha 01`, `Meeting Room Alpha`)
  - 2 Active Promos (`DISKONHEMAT20`, `PROMOAGUSTUS`)
  - 1 Member (`johndoe` / `Secret123!`) with profile `John Doe`
  - 1 Sample Reservation (`BOOK-20260830-0012`)
  Execute `npx prisma db seed`.

- [ ] **Step 5: Verify database contents and commit**
  Verify tables and seed data in Neon PostgreSQL. Commit changes.

---

### Task 2: Common Core (PrismaModule, Interceptors, Filters, Utilities)

**Files:**
- Create: `src/common/database/prisma.service.ts`
- Create: `src/common/database/prisma.module.ts`
- Create: `src/common/interceptors/transform.interceptor.ts`
- Create: `src/common/filters/http-exception.filter.ts`
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/decorators/current-user.decorator.ts`
- Create: `src/common/decorators/public.decorator.ts`
- Create: `src/common/utils/date-time.util.ts`
- Create: `src/common/utils/booking-code.util.ts`
- Create: `src/common/utils/reservation-calc.util.ts`
- Test: `tests/utils.spec.ts`

**Interfaces:**
- Produces:
  - `PrismaService` injectable globally.
  - `TransformInterceptor`: formats response to standard success structure.
  - `HttpExceptionFilter`: formats errors to standard error structure.
  - `calculateEndTime(startTime: string, durationHours: number): string`
  - `checkOverlap(startA: string, endA: string, startB: string, endB: string): boolean`
  - `calculatePricing(hourlyRate: number, durationHours: number, discountPercentage?: number)`

- [ ] **Step 1: Write failing unit test for date/time & pricing utilities**
  Create `tests/utils.spec.ts` testing `calculateEndTime("09:00", 3)` -> `"12:00"`, overlap detection logic, and discount percentage math.

- [ ] **Step 2: Implement utilities to pass tests**
  Implement `date-time.util.ts`, `booking-code.util.ts`, and `reservation-calc.util.ts`. Run `npm test` to verify.

- [ ] **Step 3: Implement PrismaService & PrismaModule**
  Create `prisma.service.ts` connecting on `onModuleInit` with clean shutdown hooks.

- [ ] **Step 4: Implement TransformInterceptor & HttpExceptionFilter**
  Implement uniform response JSON envelope matching the contract.

- [ ] **Step 5: Commit common infrastructure**
  Commit common module and tests.

---

### Task 3: Auth Module (JWT, Member/Admin Registration, Login, Profile, Logout)

**Files:**
- Create: `src/modules/auth/dto/register-member.dto.ts`
- Create: `src/modules/auth/dto/register-admin-space.dto.ts`
- Create: `src/modules/auth/dto/login.dto.ts`
- Create: `src/modules/auth/auth.service.ts`
- Create: `src/modules/auth/auth.controller.ts`
- Create: `src/modules/auth/auth.module.ts`
- Create: `src/common/guards/jwt-auth.guard.ts`
- Create: `src/common/guards/roles.guard.ts`
- Create: `src/modules/auth/strategies/jwt.strategy.ts`
- Test: `tests/auth.spec.ts`

**Interfaces:**
- Produces:
  - `POST /api/auth/register/member`
  - `POST /api/auth/register/admin-space`
  - `POST /api/auth/login`
  - `GET /api/auth/profile`
  - `POST /api/auth/logout`

- [ ] **Step 1: Write integration tests for auth endpoints**
  Create `tests/auth.spec.ts` with Supertest testing member registration, admin registration, duplicate username rejection (400), valid login (200), invalid password (401), and profile retrieval (200).

- [ ] **Step 2: Implement DTOs with validation rules**
  Write `register-member.dto.ts`, `register-admin-space.dto.ts`, and `login.dto.ts` with `class-validator`.

- [ ] **Step 3: Implement AuthService**
  Implement user creation in DB transaction (User + Member or User + SpaceOwner), bcrypt password hashing, credential validation, and JWT signing.

- [ ] **Step 4: Implement AuthController & Passport JWT Strategy**
  Expose the endpoints with proper status codes (201 for register, 200 for login/profile).

- [ ] **Step 5: Run tests and commit**
  Run `npx jest tests/auth.spec.ts` and commit.

---

### Task 4: Spaces Module (Public Catalog, Types & Availability)

**Files:**
- Create: `src/modules/spaces/dto/check-availability.dto.ts`
- Create: `src/modules/spaces/dto/query-spaces.dto.ts`
- Create: `src/modules/spaces/spaces.service.ts`
- Create: `src/modules/spaces/spaces.controller.ts`
- Create: `src/modules/spaces/spaces.module.ts`
- Test: `tests/spaces.spec.ts`

**Interfaces:**
- Produces:
  - `GET /api/spaces/types`
  - `GET /api/spaces/availability`
  - `GET /api/spaces`
  - `GET /api/spaces/:id`

- [ ] **Step 1: Write integration tests for spaces endpoints**
  Create `tests/spaces.spec.ts` testing static types retrieval, catalog query with search & filter, space detail by ID, 404 for nonexistent space, and availability check for open vs booked slot.

- [ ] **Step 2: Implement SpacesService**
  Implement space queries with relation `owner`, `foto_url` generation, and schedule conflict check against `reservasis` table.

- [ ] **Step 3: Implement SpacesController**
  Wire endpoints and query DTOs.

- [ ] **Step 4: Run tests and commit**
  Run `npx jest tests/spaces.spec.ts` and commit.

---

### Task 5: Diskon Module (Public Active Promos & Code Verification)

**Files:**
- Create: `src/modules/diskon/dto/check-promo.dto.ts`
- Create: `src/modules/diskon/diskon.service.ts`
- Create: `src/modules/diskon/diskon.controller.ts`
- Create: `src/modules/diskon/diskon.module.ts`
- Test: `tests/diskon.spec.ts`

**Interfaces:**
- Produces:
  - `GET /api/diskon/active`
  - `POST /api/diskon/check`
  - `GET /api/diskon/:id`

- [ ] **Step 1: Write integration tests for diskon endpoints**
  Create `tests/diskon.spec.ts` verifying active promo list (`now()` within date bounds), promo code check (200 with `is_active: true` for valid code, 400 for expired/nonexistent), and detail by ID.

- [ ] **Step 2: Implement DiskonService & Controller**
  Implement date-filtering queries and promo validation logic.

- [ ] **Step 3: Run tests and commit**
  Run `npx jest tests/diskon.spec.ts` and commit.

---

### Task 6: Reservasi Module (Member Bookings, E-Ticket & Cancellation)

**Files:**
- Create: `src/modules/reservasi/dto/create-reservasi.dto.ts`
- Create: `src/modules/reservasi/dto/query-history.dto.ts`
- Create: `src/modules/reservasi/reservasi.service.ts`
- Create: `src/modules/reservasi/reservasi.controller.ts`
- Create: `src/modules/reservasi/reservasi.module.ts`
- Test: `tests/reservasi.spec.ts`

**Interfaces:**
- Produces:
  - `POST /api/reservasi`
  - `GET /api/reservasi/my`
  - `GET /api/reservasi/my/history`
  - `GET /api/reservasi/:id/e-ticket`
  - `GET /api/reservasi/:id`
  - `PATCH /api/reservasi/:id/cancel`

- [ ] **Step 1: Write integration tests for member reservations**
  Create `tests/reservasi.spec.ts` testing reservation creation with price calculation & promo code, collision rejection (400), my reservations list, history with month/year filters, e-ticket generation with QR code payload, and cancellation rules (status restriction).

- [ ] **Step 2: Implement ReservasiService**
  Implement conflict checking, price calculation, promo resolution, auto booking code generation, e-ticket formatting, and state-gated cancellation.

- [ ] **Step 3: Implement ReservasiController with `@Roles('member')`**
  Secure member endpoints and expose the routes.

- [ ] **Step 4: Run tests and commit**
  Run `npx jest tests/reservasi.spec.ts` and commit.

---

### Task 7: Admin Module (Profile, Members, Spaces, Diskon, Reservasi Operations, Reports)

**Files:**
- Create: `src/modules/admin/dto/update-profile.dto.ts`
- Create: `src/modules/admin/dto/admin-member.dto.ts`
- Create: `src/modules/admin/dto/admin-space.dto.ts`
- Create: `src/modules/admin/dto/admin-diskon.dto.ts`
- Create: `src/modules/admin/dto/query-admin-reservasi.dto.ts`
- Create: `src/modules/admin/dto/update-status.dto.ts`
- Create: `src/modules/admin/dto/query-report.dto.ts`
- Create: `src/modules/admin/admin.service.ts`
- Create: `src/modules/admin/admin.controller.ts`
- Create: `src/modules/admin/admin.module.ts`
- Test: `tests/admin.spec.ts`

**Interfaces:**
- Produces:
  - `/api/admin/profile` (GET, PUT)
  - `/api/admin/members` (GET, POST, GET :id, PUT :id, DELETE :id)
  - `/api/admin/spaces` (GET, POST, GET :id, PUT :id, DELETE :id)
  - `/api/admin/diskon` (GET, POST, GET :id, PUT :id, DELETE :id)
  - `/api/admin/reservasi` (GET)
  - `/api/admin/reservasi/:id/status` (PATCH)
  - `/api/admin/reservasi/:id/check-in` (POST)
  - `/api/admin/reservasi/:id/check-out` (POST)
  - `/api/admin/reports/monthly` (GET)
  - `/api/admin/reports/income` (GET)

- [ ] **Step 1: Write integration tests for admin operations**
  Create `tests/admin.spec.ts` testing profile update, member CRUD, space CRUD strictly filtered to current admin, check-in (`disetujui` -> `aktif`), check-out (`aktif` -> `selesai`), and monthly report financial aggregations.

- [ ] **Step 2: Implement AdminService**
  Implement all admin CRUD, status transitions, check-in/out timestamps, and financial reporting SQL/Prisma aggregations.

- [ ] **Step 3: Implement AdminController with `@Roles('admin_space')`**
  Secure all admin endpoints under JWT + admin_space role guard.

- [ ] **Step 4: Run tests and commit**
  Run `npx jest tests/admin.spec.ts` and commit.

---

### Task 8: Upload Module & Static File Serving

**Files:**
- Create: `src/modules/upload/upload.controller.ts`
- Create: `src/modules/upload/upload.module.ts`
- Modify: `src/main.ts` (Serve static `/uploads` from `uploads/`)
- Test: `tests/upload.spec.ts`

**Interfaces:**
- Produces:
  - `POST /api/upload/image`
  - `POST /api/upload/spaces`
  - `POST /api/upload/members`
  - Static route: `http://localhost:3000/uploads/:folder/:filename`

- [ ] **Step 1: Write test for uploads**
  Create `tests/upload.spec.ts` using Supertest `.attach('file', buffer, 'test.png')` verifying 201 response with `filename` and `url`.

- [ ] **Step 2: Implement UploadController with Multer DiskStorage**
  Configure disk storage to write into `uploads/general/`, `uploads/spaces/`, and `uploads/members/` with file type validation.

- [ ] **Step 3: Configure static asset serving in `main.ts`**
  Add static middleware serving the `uploads` directory.

- [ ] **Step 4: Run tests and commit**
  Run `npx jest tests/upload.spec.ts` and commit.

---

### Task 9: Root, Health Check & Swagger Documentation

**Files:**
- Modify: `src/app.controller.ts`
- Modify: `src/main.ts`
- Test: `tests/root.spec.ts`

**Interfaces:**
- Produces:
  - `GET /`
  - `GET /health`
  - Swagger UI at `http://localhost:3000/docs`
  - Swagger JSON at `http://localhost:3000/docs-json`

- [ ] **Step 1: Write test for root & health endpoints**
  Verify `GET /` returns status online and Swagger links, and `GET /health` returns `{ status: "ok" }`.

- [ ] **Step 2: Update AppController & setup Swagger in `main.ts`**
  Configure Swagger document builder with Bearer Auth and endpoint annotations.

- [ ] **Step 3: Run test and commit**
  Run `npx jest tests/root.spec.ts` and commit.

---

### Task 10: Complete Test Suite & Coverage Verification

- [ ] **Step 1: Run all tests in band**
  Run `npm test -- --runInBand`.
- [ ] **Step 2: Verify coverage report**
  Run `npm run test:cov` and verify statement coverage across modules meets the threshold.

---

### Task 11: Postman Collection & Newman E2E Verification

**Files:**
- Create: `postman/Coworking-Space-API.postman_collection.json`
- Create: `postman/Coworking-Space-API.postman_environment.json`
- Modify: `package.json` (add `"test:postman"` script)

- [ ] **Step 1: Build Postman collection and environment files**
  Configure sequential test runner with auto token assignment (`token_member`, `token_admin`, `space_id`, `diskon_id`, `reservasi_id`).
- [ ] **Step 2: Run Newman CLI test**
  Run `npx newman run postman/Coworking-Space-API.postman_collection.json -e postman/Coworking-Space-API.postman_environment.json` against the active server and confirm all assertions pass.

---

### Task 12: README Documentation & Final Packaging

**Files:**
- Update: `README.md`
- Export: `prisma/schema.sql` (or SQL dump)

- [ ] **Step 1: Write comprehensive README.md**
  Document project overview, tech stack, directory tree, installation steps, migration, seed, test commands (Jest & Newman), endpoint catalog, and test account credentials.
- [ ] **Step 2: Export SQL schema**
  Generate `prisma/schema.sql` for the mandatory database file deliverable (Lampiran B).
- [ ] **Step 3: Final commit and status report**
  Commit all deliverables.
