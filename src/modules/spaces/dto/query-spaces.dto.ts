import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SpaceType } from '@prisma/client';

export class QuerySpacesDto {
  @ApiPropertyOptional({ enum: SpaceType, example: SpaceType.desk })
  @IsOptional()
  @IsEnum(SpaceType, { message: 'Tipe space harus desk, meeting_room, atau private_office' })
  tipe?: SpaceType;

  @ApiPropertyOptional({ example: 'Alpha' })
  @IsOptional()
  @IsString()
  search?: string;
}
