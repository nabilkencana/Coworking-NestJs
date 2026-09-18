import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('AuthModule (e2e)', () => {
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

  const uniqueId = Date.now();
  const memberUsername = `test_member_${uniqueId}`;
  const adminUsername = `test_admin_${uniqueId}`;
  let memberToken = '';

  describe('POST /api/auth/register/member', () => {
    it('should register a new member and return 201 with access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register/member')
        .send({
          username: memberUsername,
          password: 'Secret123!',
          nama_member: 'Test Member',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Malang',
          telp: '081234567890',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.statusCode).toBe(201);
      expect(res.body.message).toBe('Registrasi member berhasil!');
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data.role).toBe('member');
      expect(res.body.data.member.nama_member).toBe('Test Member');
      memberToken = res.body.data.access_token;
    });

    it('should reject duplicate username with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register/member')
        .send({
          username: memberUsername,
          password: 'Secret123!',
          nama_member: 'Test Member Duplicate',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Malang',
          telp: '081234567890',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Username sudah digunakan');
    });

    it('should reject invalid payload (short password) with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register/member')
        .send({
          username: `user_${Date.now()}`,
          password: '123', // less than 6 chars
          nama_member: 'Short Password',
          instansi: 'SMK Telkom',
          alamat: 'Malang',
          telp: '08123',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Password minimal 6 karakter');
    });
  });

  describe('POST /api/auth/register/admin-space', () => {
    it('should register a new admin space and return 201 with access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register/admin-space')
        .send({
          username: adminUsername,
          password: 'Admin123!',
          nama_coworking: 'Malang Innovation Hub',
          nama_pemilik: 'Budi Santoso',
          telp: '085712345678',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.data.role).toBe('admin_space');
      expect(res.body.data.space_owner.nama_coworking).toBe('Malang Innovation Hub');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: memberUsername,
          password: 'Secret123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Login berhasil!');
      expect(res.body.data).toHaveProperty('access_token');
    });

    it('should reject invalid credentials with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: memberUsername,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toContain('Username atau Password salah!');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.username).toBe(memberUsername);
      expect(res.body.data.role).toBe('member');
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/profile');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 logout success', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Logout berhasil!');
    });
  });
});
