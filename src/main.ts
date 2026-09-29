import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupSwagger(app);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req, res) => {
    res.redirect('/api/docs');
  });

  app.enableShutdownHooks();

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  logger.log('====================================================');
  logger.log(
    `EchoGPT Backend REST API running at: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(
    `Swagger OpenAPI Documentation at: http://localhost:${port}/api/docs`,
  );
  logger.log('====================================================');
}

await bootstrap();
