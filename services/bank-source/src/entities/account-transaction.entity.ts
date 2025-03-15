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
  import { BankAccount } from './bank-account.entity';
  import { TransactionType } from '../enums/transaction-type.enum';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  
  @Entity('account_transactions')
  export class AccountTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'account_id' })
    @Index()
    accountId: string;
  
    @ManyToOne(() => BankAccount, account => account.transactions)
    @JoinColumn({ name: 'account_id' })
    account: BankAccount;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({
      type: 'enum',
      enum: TransactionType,
    })
    @Index()
    type: TransactionType;
  
    @Column()
    description: string;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    @Index()
    status: TransactionStatus;
  
    @Column({ nullable: true, name: 'failure_reason' })
    failureReason?: string;
  
    @Column({ nullable: true, name: 'external_id' })
    @Index()
    externalId?: string;
  
    @Column({ nullable: true, name: 'reference_id' })
    @Index()
    referenceId?: string;
  
    @Column({ name: 'has_frozen_funds', default: false })
    hasFrozenFunds: boolean;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }