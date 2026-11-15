import { NormalizeEmail } from '../../decorators/normalize-email.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateAdminDto {
  @ApiProperty({
    description: 'Admin Name',
    example: 'Carlos Admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Admin Email',
    example: 'admin.carlos@example.com',
    required: false,
  })
  @NormalizeEmail()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Admin Phone',
    example: '987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
