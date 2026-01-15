import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './createEmployeeDto.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['businessId', 'role', 'authProvider'] as const)
) {}
