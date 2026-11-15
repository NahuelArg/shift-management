import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  // Swagger expone el mapa completo de la API: solo fuera de producción,
  // salvo que se habilite explícitamente con SWAGGER_ENABLED=true.
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';
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
