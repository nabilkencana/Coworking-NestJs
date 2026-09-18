import { Module } from '@nestjs/common';
import { ReservasiService } from './reservasi.service';
import { ReservasiController } from './reservasi.controller';

@Module({
  controllers: [ReservasiController],
  providers: [ReservasiService],
  exports: [ReservasiService],
})
export class ReservasiModule {}
