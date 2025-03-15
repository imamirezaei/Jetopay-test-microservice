// payment/entities/transaction.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { TransactionType } from '../enums/transaction-type.enum';
  import { PaymentMethod } from './payment-method.entity';
  
  @Entity('transactions')
  @Index(['userId', 'status'])
  @Index(['userId', 'date'])
  @Index(['referenceId'], { unique: true, where: 'reference_id IS NOT NULL' })
  export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ name: 'merchant_id', nullable: true })
    merchantId: string;
  
    @Column({ name: 'reference_id', nullable: true })
    referenceId: string;
  
    @Column({ name: 'gateway_url', nullable: true })
    gatewayUrl: string;
  
    @Column({ name: 'payment_method_id', nullable: true })
    paymentMethodId: string;
  
    @ManyToOne(() => PaymentMethod, { nullable: true })
    @JoinColumn({ name: 'payment_method_id' })
    paymentMethod: PaymentMethod;
  
    @Column({
      type: 'enum',
      enum: TransactionType,
      default: TransactionType.PAYMENT,
    })
    type: TransactionType;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;
  
    @Column({ name: 'status_detail', nullable: true })
    statusDetail: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;
  
    @Column({ type: 'timestamp' })
    date: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }