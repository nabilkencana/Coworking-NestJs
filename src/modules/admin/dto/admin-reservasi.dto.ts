import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class QueryAdminReservasiDto {
  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ enum: ReservationStatus, example: ReservationStatus.belum_dikonfirm })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_space?: number;

  @ApiPropertyOptional({ example: '2026-08-30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  tanggal?: string;
}

export class UpdateReservasiStatusDto {
  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.disetujui })
  @IsEnum(ReservationStatus, { message: 'Status tidak valid' })
  status: ReservationStatus;
}
