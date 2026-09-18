import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('DiskonModule (e2e)', () => {
  let app: INestApplication;
  let testDiskonId: number;

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

  describe('GET /api/diskon/active', () => {
    it('should return list of active promos with 200', async () => {
      const res = await request(app.getHttpServer()).get('/api/diskon/active');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const first = res.body.data[0];
      testDiskonId = first.id;
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('nama_diskon');
      expect(first).toHaveProperty('persentase_diskon');
    });
  });

  describe('POST /api/diskon/check', () => {
    it('should validate an active promo and return 200 with is_active: true', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/diskon/check')
        .send({ nama_diskon: 'DISKONHEMAT20' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Kode promo valid dan masih berlaku!');
      expect(res.body.data.nama_diskon).toBe('DISKONHEMAT20');
      expect(res.body.data.is_active).toBe(true);
    });

    it('should reject invalid or expired promo with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/diskon/check')
        .send({ nama_diskon: 'INVALIDPROMO999' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Kode promo tidak ditemukan atau sudah kedaluwarsa');
    });
  });

  describe('GET /api/diskon/:id', () => {
    it('should return detail for existing promo ID with 200', async () => {
      const res = await request(app.getHttpServer()).get(`/api/diskon/${testDiskonId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.id).toBe(testDiskonId);
      expect(res.body.data).toHaveProperty('nama_diskon');
    });

    it('should return 404 for non-existent promo ID', async () => {
      const res = await request(app.getHttpServer()).get('/api/diskon/999999');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Diskon tidak ditemukan');
    });
  });
});
