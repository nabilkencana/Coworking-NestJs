import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

describe('Root & Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should return 200 with service metadata', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.name).toBe('Smart Space Booking API');
    expect(res.body.data.documentation).toBe('/docs');
    expect(res.body.data.endpoints).toHaveProperty('auth');
    expect(res.body.data.endpoints).toHaveProperty('spaces');
    expect(res.body.data.endpoints).toHaveProperty('diskon');
    expect(res.body.data.endpoints).toHaveProperty('reservasi');
    expect(res.body.data.endpoints).toHaveProperty('admin');
    expect(res.body.data.endpoints).toHaveProperty('upload');
  });

  it('GET /health should return 200 with ok status', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('timestamp');
  });
});
