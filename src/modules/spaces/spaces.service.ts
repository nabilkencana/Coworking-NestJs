import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, SpaceType } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { calculateEndTime } from '../../common/utils/date-time.util';
import { checkScheduleOverlap } from '../../common/utils/reservation-calc.util';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  private getBaseUrl(): string {
    return process.env.BASE_URL || 'http://localhost:3000';
  }

  getTypes() {
    return [
      {
        tipe: 'desk',
        label: 'Personal Desk',
        deskripsi:
          'Meja kerja individual yang nyaman dengan fasilitas colokan listrik, WiFi kencang, dan air minum.',
      },
      {
        tipe: 'meeting_room',
        label: 'Meeting Room',
        deskripsi:
          'Ruang rapat tertutup dengan fasilitas proyektor/TV LED, whiteboard, sound system, dan AC dingin.',
      },
      {
        tipe: 'private_office',
        label: 'Private Office',
        deskripsi:
          'Ruang kantor privat eksklusif untuk tim kecil hingga menengah dengan akses fleksibel dan keamanan 24 jam.',
      },
    ];
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: dto.id_space },
    });

    if (!space) {
      throw new NotFoundException('Space tidak ditemukan!');
    }

    const jamSelesai = calculateEndTime(dto.jam_mulai, dto.durasi_jam);

    const existingReservations = await this.prisma.reservasi.findMany({
      where: {
        spaceId: dto.id_space,
        tanggalReservasi: dto.tanggal,
        status: {
          not: ReservationStatus.dibatalkan,
        },
      },
    });

    const isConflict = existingReservations.some((res) =>
      checkScheduleOverlap(dto.jam_mulai, jamSelesai, res.jamMulai, res.jamSelesai),
    );

    if (isConflict) {
      throw new BadRequestException('Maaf, space sudah terisi atau dibooking pada jam tersebut!');
    }

    return {
      message: 'Space tersedia untuk dipesan pada jadwal yang diminta',
      data: {
        available: true,
        id_space: space.id,
        nama_space: space.namaSpace,
        tanggal: dto.tanggal,
        jam_mulai: dto.jam_mulai,
        jam_selesai: jamSelesai,
        durasi_jam: dto.durasi_jam,
        harga_per_jam: space.hargaPerJam,
        estimasi_total: space.hargaPerJam * dto.durasi_jam,
      },
    };
  }

  async findAll(query: QuerySpacesDto) {
    const whereClause: any = {};

    if (query.tipe) {
      whereClause.tipe = query.tipe;
    }

    if (query.search) {
      whereClause.OR = [
        { namaSpace: { contains: query.search, mode: 'insensitive' } },
        { deskripsi: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const spaces = await this.prisma.space.findMany({
      where: whereClause,
      include: {
        owner: true,
      },
      orderBy: { id: 'asc' },
    });

    const baseUrl = this.getBaseUrl();

    return spaces.map((space) => ({
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      foto: space.foto,
      deskripsi: space.deskripsi,
      id_owner: space.ownerId,
      owner: {
        id: space.owner.id,
        nama_coworking: space.owner.namaCoworking,
        nama_pemilik: space.owner.namaPemilik,
        telp: space.owner.telp,
      },
      foto_url: space.foto ? `${baseUrl}/uploads/spaces/${space.foto}` : null,
    }));
  }

  async findById(id: number) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!space) {
      throw new NotFoundException('Space dengan ID tersebut tidak ditemukan!');
    }

    const baseUrl = this.getBaseUrl();

    return {
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      foto: space.foto,
      deskripsi: space.deskripsi,
      id_owner: space.ownerId,
      owner: {
        id: space.owner.id,
        nama_coworking: space.owner.namaCoworking,
        nama_pemilik: space.owner.namaPemilik,
        telp: space.owner.telp,
      },
      foto_url: space.foto ? `${baseUrl}/uploads/spaces/${space.foto}` : null,
    };
  }
}
