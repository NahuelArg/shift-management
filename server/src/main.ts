import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render (y la mayoría de PaaS) pone un proxy delante de la app. Sin esto,
  // req.ip es la IP del proxy y el rate limiting comparte un único cupo entre
  // todos los usuarios. TRUST_PROXY_HOPS = cantidad de proxies de confianza
  // (por defecto 1). No usar `true`: tomaría la IP que el cliente quiera mandar.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  app.use(helmet());
  app.enableShutdownHooks(); // cierra conexiones de Prisma al recibir SIGTERM

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:5173',
  ];

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

  // Swagger expone el mapa completo de la API: solo fuera de producción,
  // salvo que se habilite explícitamente con SWAGGER_ENABLED=true.
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Booking Management API')
      .setDescription('API for managing bookings in businesses')
      .setVersion('1.0')
      .addTag('bookings')
      .addTag('users')
      .addTag('services')
      .addTag('schedules')
      .addTag('Auth')
      .addTag('Admin')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
