import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterMemberDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi' })
  username: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Nama member wajib diisi' })
  nama_member: string;

  @ApiProperty({ example: 'Universitas Indonesia / PT Maju Mundur' })
  @IsString()
  @IsNotEmpty({ message: 'Instansi wajib diisi' })
  instansi: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 123, Jakarta Selatan' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  alamat: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  telp: string;

  @ApiPropertyOptional({ example: 'member_john.jpg' })
  @IsOptional()
  @IsString()
  foto?: string;
}
