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
  
  @Entity('account_balances')
  export class AccountBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'account_id' })
    @Index()
    accountId: string;
  
    @ManyToOne(() => BankAccount, account => account.balances)
    @JoinColumn({ name: 'account_id' })
    account: BankAccount;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, name: 'available_balance' })
    availableBalance: number;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, name: 'current_balance' })
    currentBalance: number;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, name: 'reserved_balance', default: 0 })
    reservedBalance: number;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, name: 'pending_credits', default: 0 })
    pendingCredits: number;
  
    @Column({ type: 'decimal', precision: 18, scale: 2, name: 'pending_debits', default: 0 })
    pendingDebits: number;
  
    @Column({ name: 'last_updated' })
    lastUpdated: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }