import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceType } from '@prisma/client';

export class CreateSpaceDto {
  @ApiProperty({ example: 'Personal Desk Alpha 01' })
  @IsString()
  @IsNotEmpty()
  nama_space: string;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  harga_per_jam: number;

  @ApiProperty({ enum: SpaceType, example: SpaceType.desk })
  @IsEnum(SpaceType)
  tipe: SpaceType;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  kapasitas: number;

  @ApiProperty({ example: 'Dilengkapi colokan listrik, WiFi 100Mbps, monitor 24 inch, dan free flow kopi/teh.' })
  @IsString()
  @IsNotEmpty()
  deskripsi: string;

  @ApiPropertyOptional({ example: 'desk_alpha_01.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;
}

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Personal Desk Alpha 01 (Updated)' })
  @IsOptional()
  @IsString()
  nama_space?: string;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  harga_per_jam?: number;

  @ApiPropertyOptional({ enum: SpaceType, example: SpaceType.desk })
  @IsOptional()
  @IsEnum(SpaceType)
  tipe?: SpaceType;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  kapasitas?: number;

  @ApiPropertyOptional({ example: 'Fasilitas terupdate dengan monitor 27 inch 4K.' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiPropertyOptional({ example: 'desk_alpha_new.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;
}
