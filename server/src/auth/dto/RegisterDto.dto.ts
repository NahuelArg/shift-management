import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { AuthProvider } from '@prisma/client'; // Esto se utiliza para el enum de proveedores de autenticación

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

  @ApiProperty({
    description: 'User Password',
    example: 'my_secure_password',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'User Auth Provider',
    example: 'LOCAL',
    enum: ['LOCAL', 'GOOGLE', 'APPLE'],
    required: false,
  })
  @IsEnum(['LOCAL', 'GOOGLE', 'APPLE'])
  @IsOptional()
  authProvider: AuthProvider = 'LOCAL';
}
