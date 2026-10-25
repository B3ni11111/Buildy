import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { requestContextMiddleware } from './auth/request-context.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // First, so every guard/service can see the per-request "view as resident" flag.
  app.use(requestContextMiddleware);
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',');
  app.enableCors({ origin: corsOrigins });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  if (process.env.DEV_LOGIN === 'true') {
    console.warn('⚠ DEV_LOGIN is on: anyone can sign in as a seeded mock user. Local development only.');
  }
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
