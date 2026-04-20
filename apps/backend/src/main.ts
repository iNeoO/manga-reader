import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import compression from '@fastify/compress';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { fastifyCookie } from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { env } from './env';
import { AppLogger } from './logging/app-logger.service';

const uploadMaxBytes = env.UPLOAD_MAX_BYTES;
const port = Number(process.env.PORT ?? 3000);
const globalPrefix = 'api';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ...(uploadMaxBytes !== undefined ? { bodyLimit: uploadMaxBytes } : {}),
      disableRequestLogging: true,
      logger: false,
      requestIdHeader: 'x-request-id',
      genReqId: (request) => {
        const header = request.headers['x-request-id'];
        return Array.isArray(header) ? header[0] : header ?? randomUUID();
      },
    }),
  );
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.setGlobalPrefix(globalPrefix);
  await app.register(compression);
  await app.register(multipart, {
    limits: {
      ...(uploadMaxBytes !== undefined ? { fileSize: uploadMaxBytes } : {}),
      files: 1,
    },
  });
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SIGNATURE,
  });
  app.useGlobalPipes(new ValidationPipe());
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', (request: any, _reply: any, done: () => void) => {
    request.receivedAt = process.hrtime.bigint();
    done();
  });
  await app.listen(port, '0.0.0.0');
  logger.log(
    'backend_started',
    {
      globalPrefix,
      port,
      uploadMaxBytes,
    },
    'Bootstrap',
  );
}
bootstrap();
