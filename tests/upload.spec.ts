import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('UploadModule (e2e)', () => {
  let app: INestApplication;

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

  const dummyImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  describe('POST /api/upload/image', () => {
    it('should upload general image and return 201 with metadata', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/upload/image')
        .attach('file', dummyImageBuffer, 'test_banner.png');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('File berhasil diupload');
      expect(res.body.data).toHaveProperty('filename');
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data.url).toContain('/uploads/general/');
      expect(res.body.data.mimetype).toBe('image/png');
    });

    it('should reject non-image file with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/upload/image')
        .attach('file', Buffer.from('plain text'), 'test.txt');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Format berkas tidak didukung');
    });

    it('should reject request without file with 400', async () => {
      const res = await request(app.getHttpServer()).post('/api/upload/image');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
    });
  });

  describe('POST /api/upload/spaces', () => {
    it('should upload space image and return 201 with url in /uploads/spaces/', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/upload/spaces')
        .attach('file', dummyImageBuffer, 'space_photo.png');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Foto space berhasil diupload');
      expect(res.body.data.url).toContain('/uploads/spaces/');
    });
  });

  describe('POST /api/upload/members', () => {
    it('should upload member profile image and return 201 with url in /uploads/members/', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/upload/members')
        .attach('file', dummyImageBuffer, 'avatar.png');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Foto member berhasil diupload');
      expect(res.body.data.url).toContain('/uploads/members/');
    });
  });
});
