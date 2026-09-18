import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpacesService } from './spaces.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';

@ApiTags('Spaces')
@Controller('api/spaces')
export class SpacesController {
  constructor(private spacesService: SpacesService) {}

  @Get('types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daftar Tipe Space (Personal Desk, Meeting Room, Private Office)' })
  getTypes() {
    return this.spacesService.getTypes();
  }

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cek Ketersediaan Space Berdasarkan Tanggal & Jam' })
  checkAvailability(@Query() dto: CheckAvailabilityDto) {
    return this.spacesService.checkAvailability(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Semua Space Coworking (Katalog Meja/Ruangan)' })
  findAll(@Query() query: QuerySpacesDto) {
    return this.spacesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lihat Detail Space Coworking Berdasarkan ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findById(id);
  }
}
