import { isAxiosError } from 'axios';

/**
 * Extrae un mensaje legible de un error de la API sin usar `any`.
 * NestJS devuelve `{ message: string | string[] }`; si son varios mensajes de
 * validación, se unen. Si no hay mensaje, se usa el texto de respaldo.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string | string[] }>(err)) {
    const message = err.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (message) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
