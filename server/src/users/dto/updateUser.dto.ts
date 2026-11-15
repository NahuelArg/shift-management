import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './CreateUserDto.dto';

/**
 * Campos editables de un usuario. Se excluyen a propósito `role` y
 * `authProvider`: cambiar el rol desde acá permitía escalar privilegios.
 * `password` se acepta pero el service siempre la hashea.
 */
export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'email', 'phone', 'password'] as const),
) {}
