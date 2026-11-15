import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, map } from 'rxjs';

/**
 * Convierte en profundidad los Prisma.Decimal de las respuestas a `number`.
 *
 * El dinero se guarda como DECIMAL(12,2) (exacto), pero Prisma lo devuelve como
 * objeto Decimal, que en JSON se serializa como string ("15000"). Para no
 * cambiar el contrato de la API (el frontend espera números) lo convertimos
 * acá, una sola vez y para todos los endpoints. Montos con 2 decimales entran
 * sin pérdida en un number de JS; las sumas se hacen con Decimal en el servicio.
 */
export function decimalsToNumbers<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Prisma.Decimal.isDecimal(value))
    return (value as Prisma.Decimal).toNumber() as T;
  if (value instanceof Date) return value;
  if (Array.isArray(value))
    return value.map((v: unknown) => decimalsToNumbers(v)) as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = decimalsToNumbers(v);
    }
    return out as T;
  }
  return value;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => decimalsToNumbers(data)));
  }
}
