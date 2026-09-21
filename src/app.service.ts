import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './common/database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getInfo() {
    return {
      name: 'Smart Space Booking API',
      description:
        'RESTful API Reservasi Coworking Space & Workstation - UKK RPL Paket B 2026/2027',
      version: '1.0.0',
      status: 'active',
      documentation: '/docs',
      endpoints: {
        auth: '/api/auth',
        spaces: '/api/spaces',
        diskon: '/api/diskon',
        reservasi: '/api/reservasi',
        admin: '/api/admin',
        upload: '/api/upload',
        health: '/api/health',
        location: '/api/location/profile',
      },
    };
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async getLocationProfile() {
    const owner = await this.prisma.spaceOwner.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!owner) {
      throw new NotFoundException('Data lokasi coworking space tidak ditemukan!');
    }

    return {
      id: owner.id,
      nama_coworking: owner.namaCoworking,
      nama_pemilik: owner.namaPemilik,
      telp: owner.telp,
      alamat: owner.alamat || 'Jl. Danau Ranau No. 1, Sawojajar, Malang',
      deskripsi: owner.deskripsi,
    };
  }
}
