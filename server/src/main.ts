import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'];

app.enableCors({
  origin: allowedOrigins,
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

app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
