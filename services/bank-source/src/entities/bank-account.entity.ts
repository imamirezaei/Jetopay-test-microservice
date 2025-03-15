import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
  } from 'typeorm';
  import { AccountTransaction } from './account-transaction.entity';
  import { AccountBalance } from './account-balance.entity';
  import { AccountStatus } from '../enums/account-status.enum';
  
  @Entity('bank_accounts')
  export class BankAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    @Index()
    userId: string;
  
    @Column()
    name: string;
  
    @Column({ name: 'account_number' })
    @Index()
    accountNumber: string;
  
    @Column({ name: 'bank_code' })
    bankCode: string;
  
    @Column({ name: 'card_number', nullable: true })
    cardNumber?: string;
  
    @Column({
      type: 'enum',
      enum: AccountStatus,
      default: AccountStatus.PENDING,
    })
    status: AccountStatus;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ name: 'is_default', default: false })
    isDefault: boolean;
  
    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;
  
    @OneToMany(() => AccountTransaction, transaction => transaction.account)
    transactions: AccountTransaction[];
  
    @OneToMany(() => AccountBalance, balance => balance.account)
    balances: AccountBalance[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }