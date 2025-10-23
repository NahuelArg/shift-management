import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @ApiProperty({
    description: 'Actual cash counted',
    example: 15000,
  })
  @IsNumber()
  @Min(0)
  actualBalance: number;

  @ApiPropertyOptional({
    description: 'Closing notes',
    example: 'Todo correcto',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
