import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'User name',
    example: 'Juan Perez',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User phone number (optional)',
    example: '123456789',
    required: false,
  })
  @ApiPropertyOptional({
    description: 'User phone number (optional)',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'User role (default "CLIENT")',
    example: 'CLIENT',
    required: false,
  })
  @IsEnum(['CLIENT', 'ADMIN'])
  @IsOptional()
  @IsString()
  role?: 'ADMIN';

  @ApiPropertyOptional({
    description: 'User authentication provider',
    example: 'LOCAL',
    enum: ['LOCAL', 'GOOGLE', 'APPLE'],
    required: false,
  })
  @IsEnum(['LOCAL', 'GOOGLE', 'APPLE'])
  authProvider: 'LOCAL' | 'GOOGLE' | 'APPLE' = 'LOCAL';

  @ApiPropertyOptional({
    description: 'User password (minimum 6 characters)',
    example: 'my_secure_password',
  })
  @IsString()
  @MinLength(6)
  password: string | null;
}
