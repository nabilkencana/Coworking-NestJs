import { Module } from '@nestjs/common';
import { DiskonService } from './diskon.service';
import { DiskonController } from './diskon.controller';

@Module({
  controllers: [DiskonController],
  providers: [DiskonService],
  exports: [DiskonService],
})
export class DiskonModule {}
