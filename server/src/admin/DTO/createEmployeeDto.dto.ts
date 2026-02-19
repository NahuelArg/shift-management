import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum, IsUUID } from 'class-validator';

enum Role {
  EMPLOYEE = 'EMPLOYEE'
}

enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE'
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'empleado@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '44898053-404e-4d78-98e3-eb05d2753fce' })
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ example: 'EMPLOYEE', enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'LOCAL', enum: AuthProvider })
  @IsEnum(AuthProvider)
  authProvider: AuthProvider;
}
