import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReservasiService } from './reservasi.service';
import { CreateReservasiDto } from './dto/create-reservasi.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reservasi')
@Controller('api/reservasi')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservasiController {
  constructor(private reservasiService: ReservasiService) {}

  @Post()
  @Roles(Role.member)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat Pemesanan Space Baru (Member)' })
  create(@CurrentUser() user: any, @Body() dto: CreateReservasiDto) {
    return this.reservasiService.create(user, dto);
  }

  @Get('my')
  @Roles(Role.member)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Status Semua Pemesanan Saya (Member)' })
  findMy(@CurrentUser() user: any) {
    return this.reservasiService.findMy(user);
  }

  @Get('my/history')
  @Roles(Role.member)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Histori Pemesanan Berdasarkan Bulan & Tahun (Member)' })
  findMyHistory(@CurrentUser() user: any, @Query() query: QueryHistoryDto) {
    return this.reservasiService.findMyHistory(user, query);
  }

  @Get(':id/e-ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cetak E-Ticket / Bukti Nota Digital Reservasi' })
  getETicket(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reservasiService.getETicket(user, id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Detail Reservasi Berdasarkan ID' })
  findById(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reservasiService.findById(user, id);
  }

  @Patch(':id/cancel')
  @Roles(Role.member)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batalkan Pemesanan (Member)' })
  cancel(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.reservasiService.cancel(user, id);
  }
}
