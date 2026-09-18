import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPromoDto {
  @ApiProperty({ example: 'DISKONHEMAT20' })
  @IsString()
  @IsNotEmpty({ message: 'Nama diskon / kode promo wajib diisi' })
  nama_diskon: string;
}
