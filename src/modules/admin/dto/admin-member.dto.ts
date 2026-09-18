import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberAdminDto {
  @ApiProperty({ example: 'user_budi' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Budi Raharjo' })
  @IsString()
  @IsNotEmpty()
  nama_member: string;

  @ApiProperty({ example: 'SMK Telkom Malang' })
  @IsString()
  @IsNotEmpty()
  instansi: string;

  @ApiProperty({ example: 'Jl. Danau Ranau No. 1, Malang' })
  @IsString()
  @IsNotEmpty()
  alamat: string;

  @ApiProperty({ example: '085712345678' })
  @IsString()
  @IsNotEmpty()
  telp: string;

  @ApiPropertyOptional({ example: 'budi_raharjo.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;
}

export class UpdateMemberAdminDto {
  @ApiPropertyOptional({ example: 'Budi Raharjo, S.T.' })
  @IsOptional()
  @IsString()
  nama_member?: string;

  @ApiPropertyOptional({ example: 'PT Teknologi Hebat' })
  @IsOptional()
  @IsString()
  instansi?: string;

  @ApiPropertyOptional({ example: 'Jl. Danau Ranau No. 2, Malang' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: '085712345678' })
  @IsOptional()
  @IsString()
  telp?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'budi_new.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;
}
