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
  import { DestinationAccount } from './destination-account.entity';
  import { TransferStatus } from '../enums/transfer-status.enum';
  
  @Entity('transfers')
  export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'source_account_id' })
    @Index()
    sourceAccountId: string;
  
    @Column({ name: 'destination_account_id' })
    @Index()
    destinationAccountId: string;
  
    @ManyToOne(() => DestinationAccount, account => account.transfers)
    @JoinColumn({ name: 'destination_account_id' })
    destinationAccount: DestinationAccount;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column()
    description: string;
  
    @Column({
      type: 'enum',
      enum: TransferStatus,
      default: TransferStatus.PENDING,
    })
    @Index()
    status: TransferStatus;
  
    @Column({ nullable: true, name: 'failure_reason' })
    failureReason?: string;
  
    @Column({ nullable: true, name: 'bank_transaction_id' })
    @Index()
    bankTransactionId?: string;
  
    @Column({ nullable: true, name: 'external_id' })
    @Index()
    externalId?: string;
  
    @Column({ nullable: true, name: 'reference_id' })
    @Index()
    referenceId?: string;
  
    @Column({ nullable: true, name: 'completed_at' })
    completedAt?: Date;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }