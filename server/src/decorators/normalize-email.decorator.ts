import { Transform } from 'class-transformer';

/**
 * Normaliza emails (trim + minúsculas) antes de validar. Evita cuentas
 * duplicadas como "Ana@Mail.com" y "ana@mail.com", y que el login falle por
 * una mayúscula. Requiere ValidationPipe con `transform: true` (ya activo).
 */
export const NormalizeEmail = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
