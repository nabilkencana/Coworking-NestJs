import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCoworkingProfileDto {
  @ApiProperty({ example: 'Moklet Hub Coworking Space (Updated)' })
  @IsString()
  @IsNotEmpty()
  nama_coworking: string;

  @ApiProperty({ example: 'Ahmad Bidin, S.Kom' })
  @IsString()
  @IsNotEmpty()
  nama_pemilik: string;

  @ApiProperty({ example: '081298765432' })
  @IsString()
  @IsNotEmpty()
  telp: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 1, Malang' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: 'Fasilitas coworking terdepan' })
  @IsOptional()
  @IsString()
  deskripsi?: string;
}
