import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('ReservasiModule (e2e)', () => {
  let app: INestApplication;
  let memberToken: string;
  let createdReservasiId: number;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login as member
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'johndoe',
        password: 'Secret123!',
      });
    memberToken = loginRes.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/reservasi', () => {
    it('should create a reservation with accurate discount and pricing math', async () => {
      // Space 2 (Personal Desk Alpha 01) tarif: 25000/jam
      // Durasi: 3 jam => total_harga_awal: 75000
      // Promo DISKONHEMAT20 (20%) => potongan: 15000, total_bayar: 60000
      const res = await request(app.getHttpServer())
        .post('/api/reservasi')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          id_space: 2,
          tanggal_reservasi: '2026-11-10',
          jam_mulai: '09:00',
          durasi_jam: 3,
          kode_promo: 'DISKONHEMAT20',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toContain('Reservasi berhasil dibuat');
      expect(res.body.data.harga_per_jam).toBe(25000);
      expect(res.body.data.durasi_jam).toBe(3);
      expect(res.body.data.total_harga_awal).toBe(75000);
      expect(res.body.data.potongan_diskon).toBe(15000);
      expect(res.body.data.total_bayar).toBe(60000);
      expect(res.body.data.jam_selesai).toBe('12:00');
      expect(res.body.data.status).toBe('belum_dikonfirm');
      expect(res.body.data.kode_booking).toMatch(/^BOOK-20261110-\d{4}$/);

      createdReservasiId = res.body.data.id;
    });

    it('should reject schedule collision on the same space and time with 400', async () => {
      // Try to book overlapping slot (10:00 - 12:00) on the same space & date
      const res = await request(app.getHttpServer())
        .post('/api/reservasi')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          id_space: 2,
          tanggal_reservasi: '2026-11-10',
          jam_mulai: '10:00',
          durasi_jam: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Space tidak tersedia pada tanggal dan rentang jam tersebut');
    });

    it('should reject non-existent or expired promo code with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reservasi')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          id_space: 2,
          tanggal_reservasi: '2026-11-15',
          jam_mulai: '09:00',
          durasi_jam: 2,
          kode_promo: 'FAKE_PROMO_CODE_XYZ',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Kode promo / diskon tidak ditemukan');
    });
  });

  describe('GET /api/reservasi/my', () => {
    it('should return list of reservations belonging to the member', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reservasi/my')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const item = res.body.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('kode_booking');
      expect(item).toHaveProperty('space');
      expect(item.space).toHaveProperty('nama_space');
    });
  });

  describe('GET /api/reservasi/my/history', () => {
    it('should return aggregated monthly history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reservasi/my/history?month=11&year=2026')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.month).toBe(11);
      expect(res.body.data.year).toBe(2026);
      expect(res.body.data.total_reservasi).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total_pengeluaran).toBeGreaterThanOrEqual(60000);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/reservasi/:id/e-ticket', () => {
    it('should generate e-ticket with QR code payload and booking breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reservasi/${createdReservasiId}/e-ticket`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('E-Ticket berhasil dimuat');
      expect(res.body.data).toHaveProperty('e_ticket_number');
      expect(res.body.data).toHaveProperty('qr_code_payload');
      expect(res.body.data.qr_code_payload).toContain(`VERIFY-RESERVASI-${createdReservasiId}`);
      expect(res.body.data).toHaveProperty('coworking_space');
      expect(res.body.data).toHaveProperty('member');
      expect(res.body.data).toHaveProperty('space');
      expect(res.body.data).toHaveProperty('rincian_pembayaran');
      expect(res.body.data.rincian_pembayaran.total_dibayar).toBe(60000);
    });
  });

  describe('PATCH /api/reservasi/:id/cancel', () => {
    it('should cancel an eligible reservation (belum_dikonfirm)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/reservasi/${createdReservasiId}/cancel`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.status).toBe('dibatalkan');
    });

    it('should reject cancelling an already cancelled reservation with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/reservasi/${createdReservasiId}/cancel`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('tidak dapat dibatalkan');
    });
  });
});
