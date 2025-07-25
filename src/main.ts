import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BullBoardAdapter } from '@bull-board/express';
import { Express } from 'express';
import { Logger } from 'nestjs-pino';
import { AppDataSource } from './config/ormconfig.migrations';

async function bootstrap() {
  await AppDataSource.initialize();

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await setupSwagger(app);
  await setupBullBoard(app, server);

  const port = process.env.PORT ?? 3000;

  await app.init();
  await server.listen(port);

  const logger = app.get(Logger);
  
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Bull Board at http://localhost:${port}/admin/queues`);
}

async function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Omni API')
    .setDescription('API para transações entre usuários')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'apiKey',
        description: 'Input your token',
        name: 'Authorization',
        in: 'header',
      },
      'auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      security: [{ auth: [] }],
    },
  });
}

async function setupBullBoard(app: INestApplication, server: Express) {
  const transferQueue = app.get<Queue>(getQueueToken('transfer-queue'));

  const serverAdapter = new BullBoardAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(transferQueue)],
    serverAdapter,
  });

  server.use('/admin/queues', serverAdapter.getRouter());
}

bootstrap();
