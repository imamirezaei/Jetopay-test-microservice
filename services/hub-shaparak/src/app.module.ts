import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { TransactionController } from './controllers/transaction.controller';
import { HealthController } from './controllers/health.controller';
import { TransactionService } from './services/transaction.service';
import { LedgerService } from './services/ledger.service';
import { Transaction } from './entities/transaction.entity';
import { Ledger } from './entities/ledger.entity';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    
    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'postgres'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'jetopay_hub_shaparak'),
        entities: [Transaction, Ledger],
        synchronize: config.get<boolean>('DB_SYNC', false),
        ssl: config.get<boolean>('DB_SSL', false),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
    
    // Register entities
    TypeOrmModule.forFeature([Transaction, Ledger]),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL', 60),
        limit: config.get<number>('THROTTLE_LIMIT', 10),
      }),
    }),
    
    // Event emitter for local events
    EventEmitterModule.forRoot(),
    
    // Microservice clients
    ClientsModule.registerAsync([
      {
        name: 'BANK_SOURCE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'bank_source_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: 'BANK_DESTINATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'bank_destination_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
      {
        name: 'SHAPARAK_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'shaparak_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [TransactionController, HealthController],
  providers: [TransactionService, LedgerService],
})
export class AppModule {
  // Apply logging middleware to all routes
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}