import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';
import { BalanceService } from './services/balance.service';
import { TransactionService } from './services/transaction.service';
import { BankAccount } from './entities/bank-account.entity';
import { AccountTransaction } from './entities/account-transaction.entity';
import { AccountBalance } from './entities/account-balance.entity';
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
        database: config.get<string>('DB_DATABASE', 'jetopay_bank_source'),
        entities: [BankAccount, AccountTransaction, AccountBalance],
        synchronize: config.get<boolean>('DB_SYNC', false),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
    
    // Entity registration
    TypeOrmModule.forFeature([BankAccount, AccountTransaction, AccountBalance]),
    
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
  controllers: [AccountController, HealthController, MessageController],
  providers: [AccountService, BalanceService, TransactionService],
})
export class AppModule {}