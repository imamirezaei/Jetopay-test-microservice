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
  import { Transaction } from './transaction.entity';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  
  @Entity('payment_attempts')
  export class PaymentAttempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index()
    transactionId: string;
  
    @ManyToOne(() => Transaction, transaction => transaction.attempts)
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;
  
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;
  
    @Column({ nullable: true })
    errorDetails: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }