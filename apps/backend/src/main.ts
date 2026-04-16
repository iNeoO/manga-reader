import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { fastifyCookie } from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('api');
  await app.register(compression);
  await app.register(multipart);
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SIGNATURE,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
