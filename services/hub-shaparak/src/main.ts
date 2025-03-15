import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Transport } from '@nestjs/microservices';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { Logger } from './utils/logger';

async function bootstrap() {
  // Set up Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
          ),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  // Create NestJS application with logger
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3006);

  // Set up microservice transport
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
      queue: 'hub_shaparak_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Apply global middlewares
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set up global validation pipe
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

  // Set up Swagger documentation
  const options = new DocumentBuilder()
    .setTitle('Hub Shaparak API')
    .setDescription('The Hub Shaparak API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('transactions', 'Transaction processing endpoints')
    .addTag('health', 'Health check endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // Start microservices
  await app.startAllMicroservices();
  
  // Start HTTP server
  await app.listen(port);
  
  Logger.log(`Hub Shaparak service is running on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger documentation available at http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();