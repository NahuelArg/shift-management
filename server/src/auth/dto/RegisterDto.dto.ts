import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { AuthProvider } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User Name',
    example: 'Juan Perez',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User Email',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description:
      'User Password (required only for LOCAL auth, min 6 characters)',
    example: 'my_secure_password',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'Auth Provider',
    example: 'LOCAL',
    enum: ['LOCAL', 'GOOGLE', 'APPLE'],
    default: 'LOCAL',
  })
  @IsOptional()
  @IsEnum(['LOCAL', 'GOOGLE', 'APPLE'])
  authProvider?: AuthProvider;
}
