import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterAdminSpaceDto } from './dto/register-admin-space.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/member')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrasi Akun Member / Pelanggan Baru' })
  async registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Post('register/admin-space')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrasi Pengelola Lokasi / Admin Coworking Space' })
  async registerAdminSpace(@Body() dto: RegisterAdminSpaceDto) {
    return this.authService.registerAdminSpace(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login Akun Pengguna (Member atau Admin Space)' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Profil Pengguna yang Sedang Login' })
  async profile(@CurrentUser() user: any) {
    return this.authService.profile(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout Pengguna' })
  async logout() {
    return {
      message: 'Logout berhasil!',
      data: null,
    };
  }
}
