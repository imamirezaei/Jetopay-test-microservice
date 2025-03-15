// entities/transaction.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
  } from 'typeorm';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { Ledger } from './ledger.entity';
  
  @Entity('transactions')
  @Index(['referenceId'], { unique: true })
  @Index(['originatorBankCode', 'status'])
  @Index(['destinationBankCode', 'status'])
  export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'reference_id', unique: true })
    referenceId: string;
  
    @Column({ name: 'transaction_date', type: 'timestamp' })
    transactionDate: Date;
  
    @Column({ name: 'originator_bank_code' })
    originatorBankCode: string;
  
    @Column({ name: 'destination_bank_code' })
    destinationBankCode: string;
  
    @Column({ name: 'originator_account' })
    originatorAccount: string;
  
    @Column({ name: 'destination_account' })
    destinationAccount: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;
  
    @Column({ name: 'status_detail', nullable: true })
    statusDetail: string;
  
    @Column({ name: 'verification_code', nullable: true })
    verificationCode: string;
  
    @Column({ name: 'tracking_code', nullable: true })
    trackingCode: string;
  
    @Column({ name: 'merchant_id', nullable: true })
    merchantId: string;
  
    @Column({ name: 'terminal_id', nullable: true })
    terminalId: string;
  
    @Column({ name: 'retry_count', default: 0 })
    retryCount: number;
  
    @Column({ name: 'fee_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    feeAmount: number;
  
    @Column({ name: 'description', nullable: true })
    description: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;
  
    @OneToMany(() => Ledger, (ledger) => ledger.transaction)
    ledgerEntries: Ledger[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
