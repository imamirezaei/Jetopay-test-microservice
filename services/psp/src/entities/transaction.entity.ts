import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
  } from 'typeorm';
  import { PaymentAttempt } from './payment-attempt.entity';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { PaymentMethodType } from '../enums/payment-method-type.enum';
  
  @Entity('transactions')
  export class Transaction {
    @PrimaryColumn()
    id: string;
  
    @Column()
    @Index()
    userId: string;
  
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ nullable: true })
    merchantId: string;
  
    @Column({ nullable: true })
    @Index()
    gatewayReferenceId: string;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    @Index()
    status: TransactionStatus;
  
    @Column({ nullable: true })
    statusDetails: string;
  
    @Column({
      type: 'enum',
      enum: PaymentMethodType,
      default: PaymentMethodType.CARD,
    })
    paymentMethodType: PaymentMethodType;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
  
    @OneToMany(() => PaymentAttempt, attempt => attempt.transaction)
    attempts: PaymentAttempt[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }