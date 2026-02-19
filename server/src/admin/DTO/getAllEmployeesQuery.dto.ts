import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAllEmployeesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessId?: string;
}
