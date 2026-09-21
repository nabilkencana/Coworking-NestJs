import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root & Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Informasi Status & Metadata Server API' })
  getRoot() {
    return this.appService.getInfo();
  }

  @Get(['health', 'api/health'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health Check Status Server' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get(['location/profile', 'api/location/profile'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Data Profil Publik Coworking Space' })
  getLocationProfile() {
    return this.appService.getLocationProfile();
  }
}
