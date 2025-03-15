import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InterbankController } from './controllers/interbank.controller';
import { HealthController } from './controllers/health.controller';
import { MessageController } from './controllers/message.controller';
import { InterbankService } from './services/interbank.service';
import { SettlementService } from './services/settlement.service';
import { RoutingService } from './services/routing.service';
import { InterbankTransaction } from './entities/interbank-transaction.entity';
import { BankInfo } from './entities/bank-info.entity';
import { SettlementBatch } from './entities/settlement-batch.entity';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

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
        database: config.get<string>('DB_DATABASE', 'jetopay_shetab'),
        entities: [InterbankTransaction, BankInfo, SettlementBatch],
        synchronize: config.get<boolean>('DB_SYNC', false),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
    
    // Entity registration
    TypeOrmModule.forFeature([InterbankTransaction, BankInfo, SettlementBatch]),
    
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
        name: 'HUB_SHAPARAK_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'hub_shaparak_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [InterbankController, HealthController, MessageController],
  providers: [InterbankService, SettlementService, RoutingService],
})
export class AppModule {}