import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ReservationStatus, Role, SpaceType } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { UpdateCoworkingProfileDto } from './dto/update-profile.dto';
import { CreateMemberAdminDto, UpdateMemberAdminDto } from './dto/admin-member.dto';
import { CreateSpaceDto, UpdateSpaceDto } from './dto/admin-space.dto';
import { CreateDiskonDto, UpdateDiskonDto } from './dto/admin-diskon.dto';
import { QueryAdminReservasiDto, UpdateReservasiStatusDto } from './dto/admin-reservasi.dto';
import { QueryReportDto } from './dto/query-report.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  // ==================== PROFILE ====================
  async getProfile(user: any) {
    const owner = await this.prisma.spaceOwner.findUnique({
      where: { id: user.spaceOwner.id },
    });

    if (!owner) {
      throw new NotFoundException('Profil pengelola coworking tidak ditemukan!');
    }

    return {
      id: owner.id,
      nama_coworking: owner.namaCoworking,
      nama_pemilik: owner.namaPemilik,
      telp: owner.telp,
    };
  }

  async updateProfile(user: any, dto: UpdateCoworkingProfileDto) {
    const updated = await this.prisma.spaceOwner.update({
      where: { id: user.spaceOwner.id },
      data: {
        namaCoworking: dto.nama_coworking,
        namaPemilik: dto.nama_pemilik,
        telp: dto.telp,
        alamat: dto.alamat || undefined,
        deskripsi: dto.deskripsi || undefined,
      },
    });

    return {
      message: 'Profil Coworking Space berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_coworking: updated.namaCoworking,
        nama_pemilik: updated.namaPemilik,
        telp: updated.telp,
      },
    };
  }

  // ==================== MEMBERS ====================
  async getMembers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { namaMember: { contains: search, mode: 'insensitive' } },
        { instansi: { contains: search, mode: 'insensitive' } },
        { telp: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await this.prisma.member.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      nama_member: m.namaMember,
      instansi: m.instansi,
      alamat: m.alamat,
      telp: m.telp,
      foto: m.foto,
      created_at: m.createdAt.toISOString(),
    }));
  }

  async createMember(dto: CreateMemberAdminDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan oleh akun lain!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          role: Role.member,
          member: {
            create: {
              namaMember: dto.nama_member,
              instansi: dto.instansi,
              alamat: dto.alamat,
              telp: dto.telp,
              foto: dto.foto || null,
            },
          },
        },
        include: { member: true },
      });
    });

    return {
      message: 'Data member baru berhasil ditambahkan!',
      data: {
        id: user.member!.id,
        nama_member: user.member!.namaMember,
        instansi: user.member!.instansi,
        alamat: user.member!.alamat,
        telp: user.member!.telp,
        foto: user.member!.foto,
      },
    };
  }

  async getMemberById(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Data member tidak ditemukan!');
    }

    return {
      id: member.id,
      nama_member: member.namaMember,
      instansi: member.instansi,
      alamat: member.alamat,
      telp: member.telp,
      foto: member.foto,
    };
  }

  async updateMember(id: number, dto: UpdateMemberAdminDto) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Data member tidak ditemukan!');
    }

    if (dto.password) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.update({
        where: { id: member.userId },
        data: { password: hashedPassword },
      });
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        namaMember: dto.nama_member || undefined,
        instansi: dto.instansi || undefined,
        alamat: dto.alamat || undefined,
        telp: dto.telp || undefined,
        foto: dto.foto || undefined,
      },
    });

    return {
      message: 'Data member berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_member: updated.namaMember,
        instansi: updated.instansi,
        alamat: updated.alamat,
        telp: updated.telp,
      },
    };
  }

  async deleteMember(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Data member tidak ditemukan!');
    }

    // Delete user which cascades to member
    await this.prisma.user.delete({
      where: { id: member.userId },
    });

    return {
      message: 'Data member berhasil dihapus!',
      data: {
        id,
        deleted: true,
      },
    };
  }

  // ==================== SPACES ====================
  async getSpaces(user: any) {
    const spaces = await this.prisma.space.findMany({
      where: { ownerId: user.spaceOwner.id },
      orderBy: { id: 'asc' },
    });

    const baseUrl = this.getBaseUrl();

    return spaces.map((s) => ({
      id: s.id,
      nama_space: s.namaSpace,
      harga_per_jam: s.hargaPerJam,
      tipe: s.tipe,
      kapasitas: s.kapasitas,
      foto: s.foto,
      foto_url: s.foto ? `${baseUrl}/uploads/spaces/${s.foto}` : null,
    }));
  }

  async createSpace(user: any, dto: CreateSpaceDto) {
    const space = await this.prisma.space.create({
      data: {
        ownerId: user.spaceOwner.id,
        namaSpace: dto.nama_space,
        hargaPerJam: dto.harga_per_jam,
        tipe: dto.tipe,
        kapasitas: dto.kapasitas,
        deskripsi: dto.deskripsi,
        foto: dto.foto || null,
      },
    });

    return {
      message: 'Space baru berhasil ditambahkan!',
      data: {
        id: space.id,
        nama_space: space.namaSpace,
        harga_per_jam: space.hargaPerJam,
        tipe: space.tipe,
        kapasitas: space.kapasitas,
        deskripsi: space.deskripsi,
        foto: space.foto,
        id_owner: space.ownerId,
      },
    };
  }

  async getSpaceById(user: any, id: number) {
    const space = await this.prisma.space.findFirst({
      where: {
        id,
        ownerId: user.spaceOwner.id,
      },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan atau Anda tidak memiliki akses!');
    }

    return {
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      deskripsi: space.deskripsi,
      foto: space.foto,
    };
  }

  async updateSpace(user: any, id: number, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findFirst({
      where: { id, ownerId: user.spaceOwner.id },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan atau Anda tidak memiliki akses!');
    }

    const updated = await this.prisma.space.update({
      where: { id },
      data: {
        namaSpace: dto.nama_space || undefined,
        hargaPerJam: dto.harga_per_jam || undefined,
        tipe: dto.tipe || undefined,
        kapasitas: dto.kapasitas || undefined,
        deskripsi: dto.deskripsi || undefined,
        foto: dto.foto || undefined,
      },
    });

    return {
      message: 'Data space berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_space: updated.namaSpace,
        harga_per_jam: updated.hargaPerJam,
        tipe: updated.tipe,
        kapasitas: updated.kapasitas,
        deskripsi: updated.deskripsi,
      },
    };
  }

  async deleteSpace(user: any, id: number) {
    const space = await this.prisma.space.findFirst({
      where: { id, ownerId: user.spaceOwner.id },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan atau Anda tidak memiliki akses!');
    }

    await this.prisma.space.delete({
      where: { id },
    });

    return {
      message: 'Space berhasil dihapus!',
      data: {
        id,
        deleted: true,
      },
    };
  }

  // ==================== DISKON ====================
  async getDiskons() {
    const diskons = await this.prisma.diskon.findMany({
      orderBy: { id: 'asc' },
    });

    return diskons.map((d) => ({
      id: d.id,
      nama_diskon: d.namaDiskon,
      persentase_diskon: d.persentaseDiskon,
      tanggal_awal: d.tanggalAwal.toISOString(),
      tanggal_akhir: d.tanggalAkhir.toISOString(),
    }));
  }

  async createDiskon(dto: CreateDiskonDto) {
    const startDate = new Date(dto.tanggal_awal);
    const endDate = new Date(dto.tanggal_akhir);

    if (endDate <= startDate) {
      throw new BadRequestException('tanggal_akhir harus lebih besar dari tanggal_awal!');
    }

    const existing = await this.prisma.diskon.findUnique({
      where: { namaDiskon: dto.nama_diskon },
    });
    if (existing) {
      throw new BadRequestException('Nama diskon / kode promo sudah terdaftar!');
    }

    const diskon = await this.prisma.diskon.create({
      data: {
        namaDiskon: dto.nama_diskon,
        persentaseDiskon: dto.persentase_diskon,
        tanggalAwal: startDate,
        tanggalAkhir: endDate,
      },
    });

    return {
      message: 'Kode promo baru berhasil dibuat!',
      data: {
        id: diskon.id,
        nama_diskon: diskon.namaDiskon,
        persentase_diskon: diskon.persentaseDiskon,
        tanggal_awal: diskon.tanggalAwal.toISOString(),
        tanggal_akhir: diskon.tanggalAkhir.toISOString(),
      },
    };
  }

  async getDiskonById(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException('Data diskon tidak ditemukan!');
    }

    return {
      id: diskon.id,
      nama_diskon: diskon.namaDiskon,
      persentase_diskon: diskon.persentaseDiskon,
      tanggal_awal: diskon.tanggalAwal.toISOString(),
      tanggal_akhir: diskon.tanggalAkhir.toISOString(),
    };
  }

  async updateDiskon(id: number, dto: UpdateDiskonDto) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException('Data diskon tidak ditemukan!');
    }

    const start = dto.tanggal_awal ? new Date(dto.tanggal_awal) : diskon.tanggalAwal;
    const end = dto.tanggal_akhir ? new Date(dto.tanggal_akhir) : diskon.tanggalAkhir;

    if (end <= start) {
      throw new BadRequestException('tanggal_akhir harus lebih besar dari tanggal_awal!');
    }

    const updated = await this.prisma.diskon.update({
      where: { id },
      data: {
        namaDiskon: dto.nama_diskon || undefined,
        persentaseDiskon: dto.persentase_diskon !== undefined ? dto.persentase_diskon : undefined,
        tanggalAwal: dto.tanggal_awal ? new Date(dto.tanggal_awal) : undefined,
        tanggalAkhir: dto.tanggal_akhir ? new Date(dto.tanggal_akhir) : undefined,
      },
    });

    return {
      message: 'Data promo diskon berhasil diperbarui!',
      data: {
        id: updated.id,
        nama_diskon: updated.namaDiskon,
        persentase_diskon: updated.persentaseDiskon,
        tanggal_akhir: updated.tanggalAkhir.toISOString(),
      },
    };
  }

  async deleteDiskon(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException('Data diskon tidak ditemukan!');
    }

    await this.prisma.diskon.delete({
      where: { id },
    });

    return {
      message: 'Kode promo berhasil dihapus!',
      data: {
        id,
        deleted: true,
      },
    };
  }

  // ==================== RESERVATIONS ====================
  async getReservations(user: any, query: QueryAdminReservasiDto) {
    const where: any = {
      space: {
        ownerId: user.spaceOwner.id,
      },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.id_space) {
      where.spaceId = query.id_space;
    }

    if (query.tanggal) {
      where.tanggalReservasi = query.tanggal;
    }

    if (query.month && query.year) {
      const monthStr = String(query.month).padStart(2, '0');
      where.tanggalReservasi = {
        startsWith: `${query.year}-${monthStr}`,
      };
    }

    const reservations = await this.prisma.reservasi.findMany({
      where,
      include: {
        member: true,
        space: true,
      },
      orderBy: { id: 'desc' },
    });

    return reservations.map((r) => ({
      id: r.id,
      kode_booking: r.kodeBooking,
      tanggal_reservasi: r.tanggalReservasi,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      durasi_jam: r.durasiJam,
      total_harga_awal: r.totalHargaAwal,
      potongan_diskon: r.potonganDiskon,
      total_bayar: r.totalBayar,
      status: r.status,
      member: {
        id: r.member.id,
        nama_member: r.member.namaMember,
        telp: r.member.telp,
      },
      space: {
        id: r.space.id,
        nama_space: r.space.namaSpace,
        tipe: r.space.tipe,
      },
    }));
  }

  async updateStatus(user: any, id: number, dto: UpdateReservasiStatusDto) {
    const r = await this.prisma.reservasi.findFirst({
      where: {
        id,
        space: { ownerId: user.spaceOwner.id },
      },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    // State machine check
    const current = r.status;
    const next = dto.status;

    let isValidTransition = false;
    if (current === ReservationStatus.belum_dikonfirm) {
      isValidTransition = next === ReservationStatus.disetujui || next === ReservationStatus.dibatalkan;
    } else if (current === ReservationStatus.disetujui) {
      isValidTransition = next === ReservationStatus.aktif || next === ReservationStatus.dibatalkan;
    } else if (current === ReservationStatus.aktif) {
      isValidTransition = next === ReservationStatus.selesai;
    }

    if (!isValidTransition) {
      throw new BadRequestException(
        `Transisi status tidak valid dari ${current} ke ${next}!`,
      );
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: next },
    });

    return {
      message: `Status reservasi berhasil diperbarui menjadi ${next}`,
      data: {
        id: updated.id,
        status: updated.status,
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }

  async checkIn(user: any, id: number) {
    const r = await this.prisma.reservasi.findFirst({
      where: {
        id,
        space: { ownerId: user.spaceOwner.id },
      },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    if (r.status !== ReservationStatus.disetujui) {
      throw new BadRequestException('Check-in hanya dapat dilakukan jika status reservasi disetujui!');
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: {
        status: ReservationStatus.aktif,
        checkInAt: new Date(),
      },
    });

    return {
      message: 'Check-in member berhasil! Status reservasi aktif.',
      data: {
        id: updated.id,
        status: updated.status,
        check_in_time: updated.checkInAt!.toISOString(),
      },
    };
  }

  async checkOut(user: any, id: number) {
    const r = await this.prisma.reservasi.findFirst({
      where: {
        id,
        space: { ownerId: user.spaceOwner.id },
      },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    if (r.status !== ReservationStatus.aktif) {
      throw new BadRequestException('Check-out hanya dapat dilakukan jika status reservasi aktif!');
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: {
        status: ReservationStatus.selesai,
        checkOutAt: new Date(),
      },
    });

    return {
      message: 'Check-out member berhasil! Reservasi telah selesai.',
      data: {
        id: updated.id,
        status: updated.status,
        check_out_time: updated.checkOutAt!.toISOString(),
      },
    };
  }

  // ==================== REPORTS ====================
  async getMonthlyReport(user: any, query: QueryReportDto) {
    const now = new Date();
    const month = query.month || now.getMonth() + 1;
    const year = query.year || now.getFullYear();

    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        space: { ownerId: user.spaceOwner.id },
        tanggalReservasi: {
          startsWith: prefix,
        },
      },
      include: {
        space: true,
      },
    });

    const activeReservations = reservations.filter(
      (r) => r.status !== ReservationStatus.dibatalkan,
    );
    const completedReservations = reservations.filter(
      (r) => r.status === ReservationStatus.selesai,
    );

    const totalTransaksi = activeReservations.length;
    const totalJamTerpakai = activeReservations.reduce((acc, r) => acc + r.durasiJam, 0);
    const estimasiPendapatanKotor = activeReservations.reduce(
      (acc, r) => acc + r.totalHargaAwal,
      0,
    );
    const totalPotonganDiskon = activeReservations.reduce(
      (acc, r) => acc + r.potonganDiskon,
      0,
    );
    const realisasiPendapatanBersih = completedReservations.reduce(
      (acc, r) => acc + r.totalBayar,
      0,
    );

    const types: { tipe: SpaceType; label: string }[] = [
      { tipe: SpaceType.desk, label: 'Personal Desk' },
      { tipe: SpaceType.meeting_room, label: 'Meeting Room' },
      { tipe: SpaceType.private_office, label: 'Private Office' },
    ];

    const rincianPerTipeSpace = types.map(({ tipe, label }) => {
      const perType = activeReservations.filter((r) => r.space.tipe === tipe);
      const perTypeCompleted = completedReservations.filter((r) => r.space.tipe === tipe);
      return {
        tipe,
        label,
        total_booking: perType.length,
        total_jam: perType.reduce((acc, r) => acc + r.durasiJam, 0),
        total_pendapatan: perTypeCompleted.reduce((acc, r) => acc + r.totalBayar, 0),
      };
    });

    return {
      month,
      year,
      total_transaksi: totalTransaksi,
      total_jam_terpakai: totalJamTerpakai,
      estimasi_pendapatan_kotor: estimasiPendapatanKotor,
      total_potongan_diskon: totalPotonganDiskon,
      realisasi_pendapatan_bersih: realisasiPendapatanBersih,
      rincian_per_tipe_space: rincianPerTipeSpace,
    };
  }

  async getIncomeReport(user: any, query: QueryReportDto) {
    const report = await this.getMonthlyReport(user, query);
    return {
      month: report.month,
      year: report.year,
      realisasi_pendapatan_bersih: report.realisasi_pendapatan_bersih,
    };
  }
}
