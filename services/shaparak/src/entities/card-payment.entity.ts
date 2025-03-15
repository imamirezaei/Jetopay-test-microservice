// entities/card-payment.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  import { PaymentStatus } from '../enums/payment-status.enum';
  
  @Entity('card_payments')
  export class CardPayment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'transaction_id' })
    @Index()
    transactionId: string;
  
    @Column({ name: 'reference_id', unique: true })
    @Index()
    referenceId: string;
  
    @Column({ name: 'original_reference_id', nullable: true })
    @Index()
    originalReferenceId?: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({ name: 'merchant_id' })
    @Index()
    merchantId: string;
  
    @Column({ name: 'card_info', nullable: true, type: 'text' })
    cardInfo?: string;
  
    @Column({ name: 'callback_url', nullable: true })
    callbackUrl?: string;
  
    @Column({
      type: 'enum',
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
    })
    @Index()
    status: PaymentStatus;
  
    @Column({ name: 'status_message', nullable: true })
    statusMessage?: string;
  
    @Column({ name: 'payment_method', default: 'CARD' })
    paymentMethod: string;
  
    @Column({ name: 'response_data', nullable: true, type: 'text' })
    responseData?: string;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ name: 'completed_at', nullable: true })
    completedAt?: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }