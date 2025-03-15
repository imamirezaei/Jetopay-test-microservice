// entities/settlement-batch.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
  } from 'typeorm';
  import { InterbankTransaction } from './interbank-transaction.entity';
  
  export enum SettlementStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  }
  
  @Entity('settlement_batches')
  export class SettlementBatch {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index({ unique: true })
    batchNumber: string;
  
    @Column({
      type: 'enum',
      enum: SettlementStatus,
      default: SettlementStatus.PENDING,
    })
    @Index()
    status: SettlementStatus;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    totalAmount: number;
  
    @Column({ default: 0 })
    transactionCount: number;
  
    @Column({ default: 0 })
    successfulTransactions: number;
  
    @Column({ default: 0 })
    failedTransactions: number;
  
    @Column({ nullable: true })
    settlementDate: Date;
  
    @Column({ nullable: true })
    settlementReference: string;
  
    @Column({ type: 'jsonb', nullable: true })
    bankSummary: Record<string, {
      totalAmount: number;
      count: number;
    }>;
  
    @Column({ nullable: true })
    failureReason: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => InterbankTransaction, transaction => transaction.settlementBatch)
    transactions: InterbankTransaction[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;
}