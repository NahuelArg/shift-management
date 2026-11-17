import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestLike = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

/**
 * Devuelve la IP con la que se cuenta el rate limit.
 *
 * Si `headerName` está definido (CLIENT_IP_HEADER), usa esa cabecera. Solo es
 * seguro si un proxy de confianza la SOBRESCRIBE siempre: en Render el tráfico
 * pasa por Cloudflare, que pone la IP real en `CF-Connecting-IP`, mientras que
 * esa IP no aparece en `X-Forwarded-For` (solo la del edge de Cloudflare, que
 * rota). Sin la variable, o si la cabecera no llega, se usa `req.ip`
 * (local, tests e2e, o un despliegue sin Cloudflare).
 */
export function resolveClientIp(
  req: RequestLike,
  headerName: string | undefined,
): string {
  const name = headerName?.trim().toLowerCase();
  if (name) {
    const raw = req.headers?.[name];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.split(',')[0]?.trim();
    if (value) return value;
  }
  return req.ip ?? '';
}

@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(
      resolveClientIp(req as RequestLike, process.env.CLIENT_IP_HEADER),
    );
  }
}
