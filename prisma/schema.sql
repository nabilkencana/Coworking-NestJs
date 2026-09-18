warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'admin_space');

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('desk', 'meeting_room', 'private_office');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nama_member" TEXT NOT NULL,
    "instansi" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "foto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_owners" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nama_coworking" TEXT NOT NULL,
    "nama_pemilik" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "alamat" TEXT,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "nama_space" TEXT NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "tipe" "SpaceType" NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "foto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diskons" (
    "id" SERIAL NOT NULL,
    "nama_diskon" TEXT NOT NULL,
    "persentase_diskon" INTEGER NOT NULL,
    "tanggal_awal" TIMESTAMP(3) NOT NULL,
    "tanggal_akhir" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diskons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservasis" (
    "id" SERIAL NOT NULL,
    "kode_booking" TEXT NOT NULL,
    "member_id" INTEGER NOT NULL,
    "space_id" INTEGER NOT NULL,
    "diskon_id" INTEGER,
    "tanggal_reservasi" TEXT NOT NULL,
    "jam_mulai" TEXT NOT NULL,
    "jam_selesai" TEXT NOT NULL,
    "durasi_jam" INTEGER NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "total_harga_awal" INTEGER NOT NULL,
    "potongan_diskon" INTEGER NOT NULL,
    "total_bayar" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'belum_dikonfirm',
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservasis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_owners_user_id_key" ON "space_owners"("user_id");

-- CreateIndex
CREATE INDEX "spaces_owner_id_idx" ON "spaces"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "diskons_nama_diskon_key" ON "diskons"("nama_diskon");

-- CreateIndex
CREATE UNIQUE INDEX "reservasis_kode_booking_key" ON "reservasis"("kode_booking");

-- CreateIndex
CREATE INDEX "reservasis_space_id_tanggal_reservasi_idx" ON "reservasis"("space_id", "tanggal_reservasi");

-- CreateIndex
CREATE INDEX "reservasis_member_id_idx" ON "reservasis"("member_id");

-- CreateIndex
CREATE INDEX "reservasis_status_idx" ON "reservasis"("status");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_owners" ADD CONSTRAINT "space_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "space_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasis" ADD CONSTRAINT "reservasis_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasis" ADD CONSTRAINT "reservasis_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasis" ADD CONSTRAINT "reservasis_diskon_id_fkey" FOREIGN KEY ("diskon_id") REFERENCES "diskons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

