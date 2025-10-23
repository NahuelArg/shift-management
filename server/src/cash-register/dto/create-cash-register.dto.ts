import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCashRegisterDto {
  @ApiProperty({
    description: 'Cash register name',
    example: 'Main Register',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiProperty({
    description: 'Business ID',
    example: 'b1a2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  businessId: string;
}
