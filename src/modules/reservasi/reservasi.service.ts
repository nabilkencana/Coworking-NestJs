import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, Role } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { calculateEndTime } from '../../common/utils/date-time.util';
import {
  generateBookingCode,
  generateETicketNumber,
  generateQrPayload,
} from '../../common/utils/booking-code.util';
import {
  calculatePricing,
  checkScheduleOverlap,
} from '../../common/utils/reservation-calc.util';

@Injectable()
export class ReservasiService {
  constructor(private prisma: PrismaService) {}

  async create(user: any, dto: CreateReservasiDto) {
    if (!user.member) {
      throw new BadRequestException('Hanya akun member yang dapat melakukan reservasi!');
    }

    const space = await this.prisma.space.findUnique({
      where: { id: dto.id_space },
      include: { owner: true },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    const jamSelesai = calculateEndTime(dto.jam_mulai, dto.durasi_jam);

    // Conflict Check
    const existingReservations = await this.prisma.reservasi.findMany({
      where: {
        spaceId: dto.id_space,
        tanggalReservasi: dto.tanggal_reservasi,
        status: {
          not: ReservationStatus.dibatalkan,
        },
      },
    });

    const isConflict = existingReservations.some((res) =>
      checkScheduleOverlap(dto.jam_mulai, jamSelesai, res.jamMulai, res.jamSelesai),
    );

    if (isConflict) {
      throw new BadRequestException('Space tidak tersedia pada tanggal dan rentang jam tersebut!');
    }

    // Resolve Diskon
    let diskon: any = null;
    const now = new Date();

    if (dto.id_diskon) {
      diskon = await this.prisma.diskon.findUnique({
        where: { id: dto.id_diskon },
      });
      if (!diskon || diskon.tanggalAwal > now || diskon.tanggalAkhir < now) {
        throw new BadRequestException('Kode promo / diskon tidak ditemukan atau sudah kedaluwarsa!');
      }
    } else if (dto.kode_promo) {
      diskon = await this.prisma.diskon.findUnique({
        where: { namaDiskon: dto.kode_promo },
      });
      if (!diskon || diskon.tanggalAwal > now || diskon.tanggalAkhir < now) {
        throw new BadRequestException('Kode promo / diskon tidak ditemukan atau sudah kedaluwarsa!');
      }
    }

    const pricing = calculatePricing(
      space.hargaPerJam,
      dto.durasi_jam,
      diskon ? diskon.persentaseDiskon : 0,
    );

    const tempBookingCode = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const created = await this.prisma.reservasi.create({
      data: {
        kodeBooking: tempBookingCode,
        memberId: user.member.id,
        spaceId: space.id,
        diskonId: diskon ? diskon.id : null,
        tanggalReservasi: dto.tanggal_reservasi,
        jamMulai: dto.jam_mulai,
        jamSelesai,
        durasiJam: dto.durasi_jam,
        hargaPerJam: pricing.hargaPerJam,
        totalHargaAwal: pricing.totalHargaAwal,
        potonganDiskon: pricing.potonganDiskon,
        totalBayar: pricing.totalBayar,
        status: ReservationStatus.belum_dikonfirm,
      },
    });

    const finalBookingCode = generateBookingCode(dto.tanggal_reservasi, created.id);
    const updated = await this.prisma.reservasi.update({
      where: { id: created.id },
      data: { kodeBooking: finalBookingCode },
    });

    return {
      message: 'Reservasi berhasil dibuat! Silakan tunggu konfirmasi admin.',
      data: {
        id: updated.id,
        kode_booking: updated.kodeBooking,
        id_member: updated.memberId,
        id_space: updated.spaceId,
        id_diskon: updated.diskonId,
        tanggal_reservasi: updated.tanggalReservasi,
        jam_mulai: updated.jamMulai,
        jam_selesai: updated.jamSelesai,
        durasi_jam: updated.durasiJam,
        harga_per_jam: updated.hargaPerJam,
        total_harga_awal: updated.totalHargaAwal,
        potongan_diskon: updated.potonganDiskon,
        total_bayar: updated.totalBayar,
        status: updated.status,
        created_at: updated.createdAt.toISOString(),
      },
    };
  }

  async findMy(user: any) {
    if (!user.member) {
      throw new BadRequestException('Hanya akun member yang dapat melihat reservasi sendiri!');
    }

    const reservations = await this.prisma.reservasi.findMany({
      where: { memberId: user.member.id },
      include: {
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
      total_bayar: r.totalBayar,
      status: r.status,
      space: {
        id: r.space.id,
        nama_space: r.space.namaSpace,
        tipe: r.space.tipe,
      },
    }));
  }

  async findMyHistory(user: any, query: QueryHistoryDto) {
    if (!user.member) {
      throw new BadRequestException('Hanya akun member yang dapat melihat histori reservasi!');
    }

    const now = new Date();
    const month = query.month || now.getMonth() + 1;
    const year = query.year || now.getFullYear();

    const monthStr = String(month).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const reservations = await this.prisma.reservasi.findMany({
      where: {
        memberId: user.member.id,
        tanggalReservasi: {
          startsWith: prefix,
        },
      },
      include: {
        space: true,
      },
      orderBy: { id: 'desc' },
    });

    const totalReservasi = reservations.length;
    const totalPengeluaran = reservations.reduce((acc, r) => acc + r.totalBayar, 0);

    const items = reservations.map((r) => ({
      id: r.id,
      kode_booking: r.kodeBooking,
      tanggal_reservasi: r.tanggalReservasi,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      durasi_jam: r.durasiJam,
      total_bayar: r.totalBayar,
      status: r.status,
      space_name: r.space.namaSpace,
    }));

    return {
      month,
      year,
      total_reservasi: totalReservasi,
      total_pengeluaran: totalPengeluaran,
      items,
    };
  }

  async getETicket(user: any, id: number) {
    const r = await this.prisma.reservasi.findUnique({
      where: { id },
      include: {
        member: true,
        space: {
          include: { owner: true },
        },
        diskon: true,
      },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    const isMemberOwner = user.role === Role.member && user.member?.id === r.memberId;
    const isAdminOwner = user.role === Role.admin_space && user.spaceOwner?.id === r.space.ownerId;

    if (!isMemberOwner && !isAdminOwner) {
      throw new ForbiddenException('Anda tidak memiliki izin mengakses e-ticket ini!');
    }

    const typeDisplay =
      r.space.tipe === 'desk'
        ? 'Personal Desk'
        : r.space.tipe === 'meeting_room'
        ? 'Meeting Room'
        : 'Private Office';

    const eTicketNumber = generateETicketNumber(
      r.space.owner.namaCoworking,
      r.tanggalReservasi,
      r.id,
    );

    const qrPayload = generateQrPayload(r.id, r.kodeBooking);

    return {
      message: 'E-Ticket berhasil dimuat',
      data: {
        e_ticket_number: eTicketNumber,
        kode_booking: r.kodeBooking,
        coworking_space: {
          nama: r.space.owner.namaCoworking,
          telepon: r.space.owner.telp,
        },
        member: {
          nama: r.member.namaMember,
          instansi: r.member.instansi,
          telp: r.member.telp,
        },
        space: {
          nama: r.space.namaSpace,
          tipe: typeDisplay,
          harga_per_jam: r.hargaPerJam,
        },
        jadwal: {
          tanggal: r.tanggalReservasi,
          jam_mulai: r.jamMulai,
          jam_selesai: r.jamSelesai,
          durasi: `${r.durasiJam} Jam`,
        },
        rincian_pembayaran: {
          tarif_kotor: r.totalHargaAwal,
          diskon_promo: r.diskon
            ? `${r.diskon.persentaseDiskon}% (${r.diskon.namaDiskon})`
            : null,
          potongan: r.potonganDiskon,
          total_dibayar: r.totalBayar,
        },
        status_reservasi: r.status,
        qr_code_payload: qrPayload,
      },
    };
  }

  async findById(user: any, id: number) {
    const r = await this.prisma.reservasi.findUnique({
      where: { id },
      include: {
        member: true,
        space: {
          include: { owner: true },
        },
      },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    const isMemberOwner = user.role === Role.member && user.member?.id === r.memberId;
    const isAdminOwner = user.role === Role.admin_space && user.spaceOwner?.id === r.space.ownerId;

    if (!isMemberOwner && !isAdminOwner) {
      throw new ForbiddenException('Anda tidak memiliki izin mengakses reservasi ini!');
    }

    return {
      id: r.id,
      kode_booking: r.kodeBooking,
      id_member: r.memberId,
      id_space: r.spaceId,
      tanggal_reservasi: r.tanggalReservasi,
      jam_mulai: r.jamMulai,
      jam_selesai: r.jamSelesai,
      durasi_jam: r.durasiJam,
      total_bayar: r.totalBayar,
      status: r.status,
      member: {
        nama_member: r.member.namaMember,
        telp: r.member.telp,
      },
      space: {
        nama_space: r.space.namaSpace,
        harga_per_jam: r.hargaPerJam,
      },
    };
  }

  async cancel(user: any, id: number) {
    const r = await this.prisma.reservasi.findUnique({
      where: { id },
    });

    if (!r) {
      throw new NotFoundException('Reservasi tidak ditemukan!');
    }

    if (user.role !== Role.member || user.member?.id !== r.memberId) {
      throw new ForbiddenException('Anda tidak memiliki izin membatalkan reservasi ini!');
    }

    if (
      r.status !== ReservationStatus.belum_dikonfirm &&
      r.status !== ReservationStatus.disetujui
    ) {
      throw new BadRequestException(
        'Reservasi yang sudah aktif, selesai, atau dibatalkan tidak dapat dibatalkan!',
      );
    }

    const updated = await this.prisma.reservasi.update({
      where: { id },
      data: { status: ReservationStatus.dibatalkan },
    });

    return {
      message: 'Reservasi berhasil dibatalkan oleh pengguna',
      data: {
        id: updated.id,
        status: updated.status,
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }
}
