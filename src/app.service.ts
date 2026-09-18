import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
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
        health: '/health',
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
}
