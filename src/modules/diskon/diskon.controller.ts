import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiskonService } from './diskon.service';
import { CheckPromoDto } from './dto/check-promo.dto';

@ApiTags('Diskon')
@Controller('api/diskon')
export class DiskonController {
  constructor(private diskonService: DiskonService) {}

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daftar Promo / Diskon yang Sedang Aktif' })
  findActive() {
    return this.diskonService.findActive();
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Periksa Validitas & Hitung Potongan Kode Promo' })
  checkPromo(@Body() dto: CheckPromoDto) {
    return this.diskonService.checkPromo(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Detail Diskon Berdasarkan ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.diskonService.findById(id);
  }
}
