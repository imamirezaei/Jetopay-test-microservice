  // entities/ledger.entity.ts
  import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { Transaction } from './transaction.entity';
  
  @Entity('ledger_entries')
  @Index(['transactionId', 'entryType'])
  export class Ledger {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'transaction_id' })
    transactionId: string;
  
    @ManyToOne(() => Transaction, (transaction) => transaction.ledgerEntries, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;
  
    @Column({ name: 'bank_code' })
    bankCode: string;
  
    @Column({ name: 'account_number' })
    accountNumber: string;
  
    // 'DEBIT' or 'CREDIT'
    @Column({ name: 'entry_type' })
    entryType: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ default: 'IRR' })
    currency: string;
  
    @Column({ name: 'entry_date', type: 'timestamp' })
    entryDate: Date;
  
    @Column({ name: 'description', nullable: true })
    description: string;
  
    @Column({ name: 'reference_id', nullable: true })
    referenceId: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }