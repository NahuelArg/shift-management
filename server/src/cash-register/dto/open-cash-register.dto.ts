import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @ApiProperty({
    description: 'Opening balance (initial cash)',
    example: 100.5,
  })
  @IsNumber()
  @Min(0)
  openingBalance: number;
}
