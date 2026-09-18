import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { UpdateCoworkingProfileDto } from './dto/update-profile.dto';
import { CreateMemberAdminDto, UpdateMemberAdminDto } from './dto/admin-member.dto';
import { CreateSpaceDto, UpdateSpaceDto } from './dto/admin-space.dto';
import { CreateDiskonDto, UpdateDiskonDto } from './dto/admin-diskon.dto';
import { QueryAdminReservasiDto, UpdateReservasiStatusDto } from './dto/admin-reservasi.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin_space)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== PROFILE ====================
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Data Profil Lokasi Coworking Space' })
  getProfile(@CurrentUser() user: any) {
    return this.adminService.getProfile(user);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Data Profil Lokasi Coworking Space' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateCoworkingProfileDto) {
    return this.adminService.updateProfile(user, dto);
  }

  // ==================== MEMBERS ====================
  @Get('members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daftar Semua Member / Pelanggan Coworking' })
  getMembers(@Query('search') search?: string) {
    return this.adminService.getMembers(search);
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Data Member Baru oleh Admin' })
  createMember(@Body() dto: CreateMemberAdminDto) {
    return this.adminService.createMember(dto);
  }

  @Get('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detail Data Member Berdasarkan ID' })
  getMemberById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getMemberById(id);
  }

  @Put('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Data Member / Pelanggan (Admin)' })
  updateMember(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberAdminDto) {
    return this.adminService.updateMember(id, dto);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus Data Member / Pelanggan (Admin)' })
  deleteMember(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMember(id);
  }

  // ==================== SPACES ====================
  @Get('spaces')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daftar Semua Ruangan & Meja Milik Admin' })
  getSpaces(@CurrentUser() user: any) {
    return this.adminService.getSpaces(user);
  }

  @Post('spaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Ruangan / Meja Space Baru Beserta Fasilitas & Foto' })
  createSpace(@CurrentUser() user: any, @Body() dto: CreateSpaceDto) {
    return this.adminService.createSpace(user, dto);
  }

  @Get('spaces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detail Data Space Berdasarkan ID' })
  getSpaceById(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSpaceById(user, id);
  }

  @Put('spaces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Data Ruangan & Fasilitas Space' })
  updateSpace(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.adminService.updateSpace(user, id, dto);
  }

  @Delete('spaces/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus Data Ruangan / Meja Space' })
  deleteSpace(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteSpace(user, id);
  }

  // ==================== DISKON ====================
  @Get('diskon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daftar Semua Kode Promo / Diskon Event' })
  getDiskons() {
    return this.adminService.getDiskons();
  }

  @Post('diskon')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah Kode Promo / Diskon Event Baru' })
  createDiskon(@Body() dto: CreateDiskonDto) {
    return this.adminService.createDiskon(dto);
  }

  @Get('diskon/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detail Data Diskon Berdasarkan ID' })
  getDiskonById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getDiskonById(id);
  }

  @Put('diskon/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Data Kode Promo & Periode Diskon' })
  updateDiskon(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiskonDto) {
    return this.adminService.updateDiskon(id, dto);
  }

  @Delete('diskon/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus Kode Promo / Diskon' })
  deleteDiskon(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDiskon(id);
  }

  // ==================== RESERVASIS ====================
  @Get('reservasi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Seluruh Data Reservasi Coworking Space (Filter Lengkap)' })
  getReservations(@CurrentUser() user: any, @Query() query: QueryAdminReservasiDto) {
    return this.adminService.getReservations(user, query);
  }

  @Patch('reservasi/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Konfirmasi & Ubah Status Pemesanan (Admin)' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservasiStatusDto,
  ) {
    return this.adminService.updateStatus(user, id, dto);
  }

  @Post('reservasi/:id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-In Pelanggan (Ubah Status ke Aktif / Digunakan)' })
  checkIn(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.checkIn(user, id);
  }

  @Post('reservasi/:id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check-Out Pelanggan (Ubah Status ke Selesai)' })
  checkOut(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.checkOut(user, id);
  }

  // ==================== REPORTS ====================
  @Get('reports/monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rekapitulasi Estimasi & Realisasi Pendapatan Per Bulan' })
  getMonthlyReport(@CurrentUser() user: any, @Query() query: QueryReportDto) {
    return this.adminService.getMonthlyReport(user, query);
  }

  @Get('reports/income')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alias Endpoint untuk Rekapitulasi Pendapatan Bulanan' })
  getIncomeReport(@CurrentUser() user: any, @Query() query: QueryReportDto) {
    return this.adminService.getIncomeReport(user, query);
  }
}
