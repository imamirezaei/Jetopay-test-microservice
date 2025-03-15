import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ShaparakController } from './controllers/shaparak.controller';
import { ShaparakService } from './services/shaparak.service';
import { CardPaymentService } from './services/card-payment.service';
import { MerchantService } from './services/merchant.service';
import { CryptoService } from './services/crypto.service';
import { CardPayment } from './entities/card-payment.entity';
import { MerchantInfo } from './entities/merchant-info.entity';
import { PaymentVerification } from './entities/payment-verification.entity';
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
        database: config.get<string>('DB_DATABASE', 'jetopay_shaparak'),
        entities: [CardPayment, MerchantInfo, PaymentVerification],
        synchronize: config.get<boolean>('DB_SYNC', false),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
    
    // Entity registration
    TypeOrmModule.forFeature([CardPayment, MerchantInfo, PaymentVerification]),
    
    // Microservice clients
    ClientsModule.registerAsync([
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
  controllers: [ShaparakController, HealthController, MessageController],
  providers: [ShaparakService, CardPaymentService, MerchantService, CryptoService],
})
export class AppModule {}