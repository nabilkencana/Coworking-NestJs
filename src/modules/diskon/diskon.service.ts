import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CheckPromoDto } from './dto/check-promo.dto';

@Injectable()
export class DiskonService {
  constructor(private prisma: PrismaService) {}

  async findActive() {
    const now = new Date();

    const activeDiskons = await this.prisma.diskon.findMany({
      where: {
        tanggalAwal: { lte: now },
        tanggalAkhir: { gte: now },
      },
      orderBy: { id: 'asc' },
    });

    return activeDiskons.map((d) => ({
      id: d.id,
      nama_diskon: d.namaDiskon,
      persentase_diskon: d.persentaseDiskon,
      tanggal_awal: d.tanggalAwal.toISOString(),
      tanggal_akhir: d.tanggalAkhir.toISOString(),
    }));
  }

  async checkPromo(dto: CheckPromoDto) {
    const now = new Date();
    const promoCode = (dto.nama_diskon || dto.kode_promo || dto.kode || '').trim().toUpperCase();

    if (!promoCode) {
      throw new BadRequestException('Kode promo atau nama diskon wajib diisi!');
    }

    const diskon = await this.prisma.diskon.findFirst({
      where: {
        namaDiskon: {
          equals: promoCode,
          mode: 'insensitive',
        },
      },
    });

    if (!diskon || diskon.tanggalAwal > now || diskon.tanggalAkhir < now) {
      throw new BadRequestException('Kode promo tidak ditemukan atau sudah kedaluwarsa!');
    }

    const potongan = dto.subtotal
      ? Math.round((Number(dto.subtotal) * diskon.persentaseDiskon) / 100)
      : 0;

    const diskonData = {
      id: diskon.id,
      nama_diskon: diskon.namaDiskon,
      persentase_diskon: diskon.persentaseDiskon,
      tanggal_awal: diskon.tanggalAwal.toISOString(),
      tanggal_akhir: diskon.tanggalAkhir.toISOString(),
      is_active: true,
      potongan,
      valid: true,
    };

    return {
      message: 'Kode promo valid dan masih berlaku!',
      data: {
        ...diskonData,
        diskon: diskonData,
      },
    };
  }

  async findById(id: number) {
    const diskon = await this.prisma.diskon.findUnique({
      where: { id },
    });

    if (!diskon) {
      throw new NotFoundException('Diskon tidak ditemukan!');
    }

    return {
      id: diskon.id,
      nama_diskon: diskon.namaDiskon,
      persentase_diskon: diskon.persentaseDiskon,
      tanggal_awal: diskon.tanggalAwal.toISOString(),
      tanggal_akhir: diskon.tanggalAkhir.toISOString(),
    };
  }
}
