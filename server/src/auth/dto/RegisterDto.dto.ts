import { NormalizeEmail } from '../../decorators/normalize-email.decorator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Registro público: solo cuentas LOCAL con contraseña y rol CLIENT.
 * Antes se aceptaba authProvider GOOGLE/APPLE sin contraseña, lo que permitía
 * "ocupar" el email de otra persona (no hay login social implementado).
 */
export class RegisterDto {
  @ApiProperty({ description: 'User Name', example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'User Email', example: 'juan.perez@example.com' })
  @NormalizeEmail()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (6-72 characters)',
    example: 'my_secure_password',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72) // bcrypt ignora lo que pasa de 72 bytes
  password: string;
}
