import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAdminSpaceDto {
  @ApiProperty({ example: 'admin_space1' })
  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi' })
  username: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'Moklet Hub Coworking' })
  @IsString()
  @IsNotEmpty({ message: 'Nama coworking wajib diisi' })
  nama_coworking: string;

  @ApiProperty({ example: 'Ahmad Bidin' })
  @IsString()
  @IsNotEmpty({ message: 'Nama pemilik wajib diisi' })
  nama_pemilik: string;

  @ApiProperty({ example: '081298765432' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  telp: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 1, Malang' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: 'Coworking space modern dan representatif' })
  @IsOptional()
  @IsString()
  deskripsi?: string;
}
