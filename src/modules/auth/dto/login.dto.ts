import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi' })
  username: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}
