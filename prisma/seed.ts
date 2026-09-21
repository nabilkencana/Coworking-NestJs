import { PrismaClient, Role, SpaceType, ReservationStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed database on Neon PostgreSQL...");

  // Clean existing data
  await prisma.reservasi.deleteMany({});
  await prisma.diskon.deleteMany({});
  await prisma.space.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.spaceOwner.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Admin User & SpaceOwner
  const adminHashedPassword = await bcrypt.hash("Admin123!", 10);
  const adminUser = await prisma.user.create({
    data: {
      username: "admin_demo",
      password: adminHashedPassword,
      role: Role.admin_space,
      spaceOwner: {
        create: {
          namaCoworking: "Moklet Hub Coworking Space",
          namaPemilik: "Ahmad Bidin, S.Kom",
          telp: "081298765432",
          alamat: "Jl. Danau Ranau No. 1, Sawojajar, Malang",
          deskripsi: "Coworking space modern dengan internet gigabit, free flow beverage, meeting room kedap suara, dan workstation ergonomis.",
        },
      },
    },
    include: {
      spaceOwner: true,
    },
  });

  // Also create admin_space1 for standard UKK checks
  await prisma.user.create({
    data: {
      username: "admin_space1",
      password: adminHashedPassword,
      role: Role.admin_space,
      spaceOwner: {
        create: {
          namaCoworking: "Moklet Hub Coworking Space",
          namaPemilik: "Ahmad Bidin, S.Kom",
          telp: "081298765432",
          alamat: "Jl. Danau Ranau No. 1, Sawojajar, Malang",
          deskripsi: "Coworking space modern dengan internet gigabit.",
        },
      },
    },
  });
  const spaceOwnerId = adminUser.spaceOwner!.id;

  // 2. Create Spaces under Admin
  const space1 = await prisma.space.create({
    data: {
      ownerId: spaceOwnerId,
      namaSpace: "Personal Desk - Flexi 01",
      hargaPerJam: 20000,
      tipe: SpaceType.desk,
      kapasitas: 1,
      deskripsi: "Meja kerja individual yang tenang dan nyaman dengan colokan listrik, WiFi kencang 100Mbps, lampu meja LED, dan free refill air mineral.",
      foto: "desk_flexi_01.jpg",
    },
  });

  const space2 = await prisma.space.create({
    data: {
      ownerId: spaceOwnerId,
      namaSpace: "Personal Desk Alpha 01",
      hargaPerJam: 25000,
      tipe: SpaceType.desk,
      kapasitas: 1,
      deskripsi: "Dilengkapi colokan listrik, WiFi 100Mbps, monitor 24 inch, dan free flow kopi/teh.",
      foto: "desk_alpha_01.jpg",
    },
  });

  const space3 = await prisma.space.create({
    data: {
      ownerId: spaceOwnerId,
      namaSpace: "Meeting Room Alpha",
      hargaPerJam: 100000,
      tipe: SpaceType.meeting_room,
      kapasitas: 8,
      deskripsi: "Ruang rapat kedap suara berkapasitas 8 orang, dilengkapi Smart TV 55 inch, soundbar Bluetooth, whiteboard kaca, AC dingin, dan conference speaker.",
      foto: "meeting_room_alpha.jpg",
    },
  });

  const space4 = await prisma.space.create({
    data: {
      ownerId: spaceOwnerId,
      namaSpace: "Private Office Suite",
      hargaPerJam: 250000,
      tipe: SpaceType.private_office,
      kapasitas: 10,
      deskripsi: "Ruang kantor privat eksklusif untuk tim kecil hingga menengah dengan akses fleksibel dan keamanan 24 jam.",
      foto: "private_office_suite.jpg",
    },
  });

  // 3. Create Diskon Promos
  const diskon1 = await prisma.diskon.create({
    data: {
      namaDiskon: "DISKONHEMAT20",
      persentaseDiskon: 20,
      tanggalAwal: new Date("2026-01-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2026-12-31T23:59:59.000Z"),
    },
  });

  const diskon2 = await prisma.diskon.create({
    data: {
      namaDiskon: "UKKPROMO50",
      persentaseDiskon: 50,
      tanggalAwal: new Date("2026-08-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2026-09-30T23:59:59.000Z"),
    },
  });

  const diskon3 = await prisma.diskon.create({
    data: {
      namaDiskon: "PROMOAGUSTUS",
      persentaseDiskon: 20,
      tanggalAwal: new Date("2026-08-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2026-08-31T23:59:59.000Z"),
    },
  });
  await prisma.diskon.create({
    data: {
      namaDiskon: "DISKONMEMBER20",
      persentaseDiskon: 20,
      tanggalAwal: new Date("2026-01-01T00:00:00.000Z"),
      tanggalAkhir: new Date("2026-12-31T23:59:59.000Z"),
    },
  });


  // 4. Create Member Users & Profiles
  const memberHashedPassword = await bcrypt.hash("Secret123!", 10);
  const memberUser1 = await prisma.user.create({
    data: {
      username: "johndoe",
      password: memberHashedPassword,
      role: Role.member,
      member: {
        create: {
          namaMember: "John Doe",
          instansi: "Universitas Indonesia / PT Maju Mundur",
          alamat: "Jl. Sudirman No. 123, Jakarta Selatan",
          telp: "081234567890",
          foto: "member_john.jpg",
        },
      },
    },
    include: {
      member: true,
    },
  });

  const memberUser2 = await prisma.user.create({
    data: {
      username: "user_budi",
      password: memberHashedPassword,
      role: Role.member,
      member: {
        create: {
          namaMember: "Budi Raharjo",
          instansi: "SMK Telkom Malang",
          alamat: "Jl. Danau Ranau No. 1, Sawojajar, Malang",
          telp: "085712345678",
          foto: "budi.jpg",
        },
      },
    },
    include: {
      member: true,
    },
  });
  const memberJourneyPassword = await bcrypt.hash("Member123!", 10);
  await prisma.user.create({
    data: {
      username: "budi.member",
      password: memberJourneyPassword,
      role: Role.member,
      member: {
        create: {
          namaMember: "Budi Member",
          instansi: "SMK Telkom Malang",
          alamat: "Jl. Danau Ranau No. 1, Sawojajar, Malang",
          telp: "085712345678",
          foto: "budi.jpg",
        },
      },
    },
  });


  // 5. Create Sample Reservations
  await prisma.reservasi.create({
    data: {
      kodeBooking: "BOOK-20260830-0012",
      memberId: memberUser1.member!.id,
      spaceId: space1.id,
      diskonId: diskon1.id,
      tanggalReservasi: "2026-08-30",
      jamMulai: "09:00",
      jamSelesai: "12:00",
      durasiJam: 3,
      hargaPerJam: 20000,
      totalHargaAwal: 60000,
      potonganDiskon: 12000,
      totalBayar: 48000,
      status: ReservationStatus.disetujui,
    },
  });

  await prisma.reservasi.create({
    data: {
      kodeBooking: "BOOK-20260831-0013",
      memberId: memberUser2.member!.id,
      spaceId: space3.id,
      tanggalReservasi: "2026-08-31",
      jamMulai: "13:00",
      jamSelesai: "15:00",
      durasiJam: 2,
      hargaPerJam: 100000,
      totalHargaAwal: 200000,
      potonganDiskon: 0,
      totalBayar: 200000,
      status: ReservationStatus.selesai,
      checkInAt: new Date("2026-08-31T13:02:00.000Z"),
      checkOutAt: new Date("2026-08-31T15:00:00.000Z"),
    },
  });

  console.log("✅ Seed database finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
