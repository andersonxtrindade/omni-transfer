import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Omni API')
    .setDescription('API para transações entre usuários')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'apiKey',
        description: 'Input your token',
        name: 'Authorization',
        in: 'header'
      },
      'auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      security: [{ auth: [] }],
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
