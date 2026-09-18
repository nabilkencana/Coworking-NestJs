import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('SpacesModule (e2e)', () => {
  let app: INestApplication;
  let testSpaceId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/spaces/types', () => {
    it('should return static list of 3 space types with 200', async () => {
      const res = await request(app.getHttpServer()).get('/api/spaces/types');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.map((t: any) => t.tipe)).toEqual([
        'desk',
        'meeting_room',
        'private_office',
      ]);
    });
  });

  describe('GET /api/spaces', () => {
    it('should return list of spaces with owner and foto_url', async () => {
      const res = await request(app.getHttpServer()).get('/api/spaces');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const first = res.body.data[0];
      testSpaceId = first.id;
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('nama_space');
      expect(first).toHaveProperty('owner');
      expect(first.owner).toHaveProperty('nama_coworking');
    });

    it('should filter spaces by tipe', async () => {
      const res = await request(app.getHttpServer()).get('/api/spaces?tipe=desk');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      res.body.data.forEach((space: any) => {
        expect(space.tipe).toBe('desk');
      });
    });

    it('should search spaces by keyword', async () => {
      const res = await request(app.getHttpServer()).get('/api/spaces?search=Alpha');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/spaces/:id', () => {
    it('should return space details for existing ID', async () => {
      const res = await request(app.getHttpServer()).get(`/api/spaces/${testSpaceId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.id).toBe(testSpaceId);
      expect(res.body.data).toHaveProperty('nama_space');
      expect(res.body.data).toHaveProperty('owner');
    });

    it('should return 404 for non-existent space ID', async () => {
      const res = await request(app.getHttpServer()).get('/api/spaces/999999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });

  describe('GET /api/spaces/availability', () => {
    it('should confirm availability when schedule does not overlap', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/spaces/availability?id_space=${testSpaceId}&tanggal=2026-08-30&jam_mulai=14:00&durasi_jam=2`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.available).toBe(true);
      expect(res.body.data.jam_selesai).toBe('16:00');
    });

    it('should return 400 when schedule overlaps with existing reservation', async () => {
      // Seed reservation has space 1 booked on 2026-08-30 from 09:00 to 12:00
      const res = await request(app.getHttpServer())
        .get(`/api/spaces/availability?id_space=1&tanggal=2026-08-30&jam_mulai=10:00&durasi_jam=2`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('space sudah terisi atau dibooking');
    });
  });
});
