import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DestinationAccountController } from './controllers/destination-account.controller';
import { DestinationAccountService } from './services/destination-account.service';
import { TransferService } from './services/transfer.service';
import { NotificationService } from './services/notification.service';
import { DestinationAccount } from './entities/destination-account.entity';
import { Transfer } from './entities/transfer.entity';
import { HealthController } from './controllers/health.controller';
import { MessageController } from './controllers/message.controller';
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
        database: config.get<string>('DB_DATABASE', 'jetopay_bank_destination'),
        entities: [DestinationAccount, Transfer],
        synchronize: config.get<boolean>('DB_SYNC', false),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
    
    // Entity registration
    TypeOrmModule.forFeature([DestinationAccount, Transfer]),
    
    // Microservice clients
    ClientsModule.registerAsync([
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
      {
        name: 'SHETAB_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'shetab_queue',
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
  controllers: [DestinationAccountController, HealthController, MessageController],
  providers: [DestinationAccountService, TransferService, NotificationService],
})
export class AppModule {}