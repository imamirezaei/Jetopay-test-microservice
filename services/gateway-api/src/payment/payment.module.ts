// payment/payment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { TransactionService } from './services/transaction.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { Transaction } from './entities/transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentMethodService } from './services/payment-method.service';
import { BiometricModule } from '../biometric/biometric.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, PaymentMethod]),
    ClientsModule.registerAsync([
      {
        name: 'PSP_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'psp_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
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
    BiometricModule,
  ],
  controllers: [PaymentController, PaymentMethodController],
  providers: [
    PaymentService,
    TransactionService,
    PaymentProcessorService,
    PaymentMethodService,
  ],
  exports: [PaymentService, TransactionService, PaymentMethodService],
})
export class PaymentModule {}
