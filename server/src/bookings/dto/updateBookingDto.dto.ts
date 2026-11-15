import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * Cambios que un ADMIN puede hacer sobre una reserva de su negocio.
 * El estado NO se cambia acá: va por PATCH /bookings/:id/status, que aplica
 * las reglas por rol. Fecha y servicio tampoco: cambiarlos sin recalcular
 * la hora de fin ni revisar conflictos dejaba datos inconsistentes.
 */
export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Reassign the booking to another employee of the business' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Adjusted final price', example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalPrice?: number;
}
