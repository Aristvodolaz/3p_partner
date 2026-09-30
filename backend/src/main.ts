import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

process.on('unhandledRejection', (reason) => {
  // Раньше падал процессом целиком (process.exit(1)) на любой необработанный
  // reject где угодно в приложении — один забытый await в фоновой задаче
  // мог положить весь бэкенд для всех партнёров разом. Логируем и продолжаем.
  console.error('Unhandled rejection:', reason);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS_ORIGIN в .env сейчас не используется (см. аудит) — оставлено '*'
  // намеренно: backend отдаёт и сам фронтенд той же самой Express-инстанцией
  // (см. useStaticAssets ниже), а реальный прод-домен веба неизвестен отсюда.
  // Сузить до конкретного origin — отдельное решение с подтверждением
  // реального адреса, на котором открыт веб в проде, иначе есть риск
  // случайно заблокировать легитимный доступ.
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // /api/docs отдаёт полную схему API (все роуты, все DTO) без какой-либо
  // авторизации — не должно быть доступно в проде.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('3P Partner API')
      .setDescription('API для управления внешними партнёрами НПП')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Отдаём собранный фронтенд как статику
  const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
  app.useStaticAssets(frontendDist);

  // Загруженные фото SKU
  const uploadsDir = join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  const port = process.env.PORT ?? 3032;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
