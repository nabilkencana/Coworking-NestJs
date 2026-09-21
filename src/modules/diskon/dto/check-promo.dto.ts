import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckPromoDto {
  @ApiPropertyOptional({ example: 'DISKONHEMAT20' })
  @IsOptional()
  @IsString()
  nama_diskon?: string;

  @ApiPropertyOptional({ example: 'DISKONHEMAT20' })
  @IsOptional()
  @IsString()
  kode_promo?: string;

  @ApiPropertyOptional({ example: 'DISKONHEMAT20' })
  @IsOptional()
  @IsString()
  kode?: string;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsNumber()
  subtotal?: number;
}
