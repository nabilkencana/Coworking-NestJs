import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { DiskonModule } from './modules/diskon/diskon.module';
import { ReservasiModule } from './modules/reservasi/reservasi.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SpacesModule,
    DiskonModule,
    ReservasiModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
