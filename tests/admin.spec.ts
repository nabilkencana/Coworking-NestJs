import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/common/database/prisma.service';

jest.setTimeout(30000);

describe('AdminModule (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let createdMemberId: number;
  let createdSpaceId: number;
  let createdDiskonId: number;
  let testReservasiId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin_space1', password: 'Admin123!' });
    adminToken = adminLogin.body.data.access_token;

    // Login Member
    const memberLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'johndoe', password: 'Secret123!' });
    memberToken = memberLogin.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authorization Role Guard', () => {
    it('should forbid member from accessing admin endpoints with 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(false);
    });
  });

  describe('Admin Profile', () => {
    it('GET /api/admin/profile should return admin coworking profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data).toHaveProperty('nama_coworking');
      expect(res.body.data).toHaveProperty('nama_pemilik');
    });

    it('PUT /api/admin/profile should update profile', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_coworking: 'Moklet Hub Coworking Space (Updated)',
          nama_pemilik: 'Ahmad Bidin, S.Kom',
          telp: '081298765432',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toContain('berhasil diperbarui');
      expect(res.body.data.nama_coworking).toBe('Moklet Hub Coworking Space (Updated)');
    });
  });

  describe('Admin Members CRUD', () => {
    it('POST /api/admin/members should add a new member', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `member_adm_${Date.now()}`,
          password: 'Secret123!',
          nama_member: 'Budi Raharjo',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Sawojajar, Malang',
          telp: '085712345678',
          foto: 'budi.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdMemberId = res.body.data.id;
    });

    it('GET /api/admin/members should list members', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/members')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/admin/members/:id should return member details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/admin/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdMemberId);
    });

    it('PUT /api/admin/members/:id should update member details', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/admin/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama_member: 'Budi Raharjo, S.T.' });

      expect(res.status).toBe(200);
      expect(res.body.data.nama_member).toBe('Budi Raharjo, S.T.');
    });

    it('DELETE /api/admin/members/:id should delete member', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Admin Spaces CRUD', () => {
    it('POST /api/admin/spaces should create a new space', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/spaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_space: 'Podcast Studio Pro',
          harga_per_jam: 80000,
          tipe: 'private_office',
          kapasitas: 4,
          deskripsi: 'Studio rekaman podcast kedap suara lengkap dengan mic Shure SM7B.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      createdSpaceId = res.body.data.id;
    });

    it('GET /api/admin/spaces should list spaces belonging to admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/spaces')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PUT /api/admin/spaces/:id should update space', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/admin/spaces/${createdSpaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ harga_per_jam: 90000 });

      expect(res.status).toBe(200);
      expect(res.body.data.harga_per_jam).toBe(90000);
    });

    it('DELETE /api/admin/spaces/:id should delete space', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/spaces/${createdSpaceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Admin Diskon CRUD', () => {
    it('POST /api/admin/diskon should create a new promo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/diskon')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_diskon: `PROMONOV_${Date.now()}`,
          persentase_diskon: 25,
          tanggal_awal: '2026-11-01T00:00:00Z',
          tanggal_akhir: '2026-11-30T23:59:59Z',
        });

      expect(res.status).toBe(201);
      createdDiskonId = res.body.data.id;
    });

    it('GET /api/admin/diskon should list promos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/diskon')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('DELETE /api/admin/diskon/:id should delete promo', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/diskon/${createdDiskonId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Admin Reservasi Operations & Reports', () => {
    beforeAll(async () => {
      const prisma = app.get(PrismaService);
      await prisma.reservasi.deleteMany({
        where: {
          spaceId: 1,
          tanggalReservasi: '2026-12-05',
        },
      });

      // Create a test reservation by member
      const res = await request(app.getHttpServer())
        .post('/api/reservasi')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          id_space: 1,
          tanggal_reservasi: '2026-12-05',
          jam_mulai: '10:00',
          durasi_jam: 2,
        });
      testReservasiId = res.body.data.id;
    });

    it('GET /api/admin/reservasi should list reservations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/reservasi')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PATCH /api/admin/reservasi/:id/status should approve reservation', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/reservasi/${testReservasiId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disetujui' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('disetujui');
    });

    it('POST /api/admin/reservasi/:id/check-in should check-in customer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/admin/reservasi/${testReservasiId}/check-in`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('aktif');
      expect(res.body.data).toHaveProperty('check_in_time');
    });

    it('POST /api/admin/reservasi/:id/check-out should check-out customer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/admin/reservasi/${testReservasiId}/check-out`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('selesai');
      expect(res.body.data).toHaveProperty('check_out_time');
    });

    it('GET /api/admin/reports/monthly should return complete monthly financial metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/reports/monthly?month=12&year=2026')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_transaksi');
      expect(res.body.data).toHaveProperty('realisasi_pendapatan_bersih');
      expect(res.body.data).toHaveProperty('rincian_per_tipe_space');
      expect(Array.isArray(res.body.data.rincian_per_tipe_space)).toBe(true);
    });

    it('GET /api/admin/reports/income should return income alias', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/reports/income?month=12&year=2026')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('realisasi_pendapatan_bersih');
    });
  });
});
