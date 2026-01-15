import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200', // Permite cualquier origen en desarrollo
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
