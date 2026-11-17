import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

/**
 * Configuración HTTP compartida por main.ts y los tests e2e, para que los
 * tests ejerciten exactamente la misma configuración que producción.
 */
export function configureApp(app: NestExpressApplication): void {
  // Render (y la mayoría de PaaS) pone un proxy delante de la app. Sin esto,
  // req.ip es la IP del proxy. TRUST_PROXY_HOPS = cantidad de proxies de
  // confianza (por defecto 1). No usar `true`: tomaría la IP que el cliente
  // quiera mandar. Ojo: en Render la IP real NO está en X-Forwarded-For (solo
  // la del edge de Cloudflare), así que el rate limit usa CLIENT_IP_HEADER
  // (ver common/client-ip-throttler.guard.ts).
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  app.use(helmet());
  app.enableShutdownHooks(); // cierra conexiones de Prisma al recibir SIGTERM

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) =>
    o.trim(),
  ) ?? ['http://localhost:5173'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
