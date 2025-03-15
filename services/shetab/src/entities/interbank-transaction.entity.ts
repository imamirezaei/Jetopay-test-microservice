import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  import { TransactionStatus } from '../enums/transaction-status.enum';
  import { TransactionType } from '../enums/transaction-type.enum';
  
  @Entity('interbank_transactions')
  export class InterbankTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index({ unique: true })
    referenceId: string;
  
    @Column({ nullable: true })
    bankReferenceId: string;
  
    @Column({ nullable: true })
    transactionId: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    fee: number;
  
    @Column()
    sourceBankCode: string;
  
    @Column()
    sourceAccountNumber: string;
  
    @Column()
    destinationBankCode: string;
  
    @Column()
    destinationAccountNumber: string;
  
    @Column({
      type: 'enum',
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    })
    @Index()
    status: TransactionStatus;
  
    @Column({
      type: 'enum',
      enum: TransactionType,
      default: TransactionType.TRANSFER,
    })
    type: TransactionType;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ nullable: true })
    failureReason: string;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
  
    @Column({ nullable: true })
    completedAt: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }