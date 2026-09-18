import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Serve static files from uploads folder
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Smart Space Booking API - Coworking Space & Workstation')
    .setDescription(
      'RESTful API untuk Uji Kompetensi Keahlian (UKK) RPL 2026/2027 Paket B. Menyediakan layanan reservasi coworking space, workstation, manajemen diskon promo, tiket digital dengan QR code, dan laporan keuangan transaksi.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan JWT token (dapat diperoleh dari /api/auth/login)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Root & Health', 'Pemeriksaan status server dan ketersediaan layanan')
    .addTag('Auth', 'Registrasi, Login, dan Profil Pengguna (Member & Admin)')
    .addTag('Spaces', 'Katalog Ruangan Coworking, Workstation, Tipe & Cek Ketersediaan')
    .addTag('Diskon', 'Daftar Promo Diskon Aktif & Pengecekan Kode Promo')
    .addTag('Reservasi', 'Pemesanan Ruangan, Kalkulasi Biaya, E-Tiket QR & Pembatalan')
    .addTag('Admin', 'Manajemen Ruangan, Diskon, Member, Status Reservasi & Laporan Keuangan')
    .addTag('Upload', 'Upload Berkas Gambar (Umum, Ruangan, Member)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Smart Space Booking API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
