import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
  } from 'typeorm';
  import { Transfer } from './transfer.entity';
  import { AccountStatus } from '../enums/account-status.enum';
  
  @Entity('destination_accounts')
  export class DestinationAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    @Index()
    userId: string;
  
    @Column({ name: 'account_name' })
    accountName: string;
  
    @Column({ name: 'account_number' })
    @Index()
    accountNumber: string;
  
    @Column({ name: 'bank_code' })
    bankCode: string;
  
    @Column({
      type: 'enum',
      enum: AccountStatus,
      default: AccountStatus.PENDING_VERIFICATION,
    })
    status: AccountStatus;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ name: 'is_favorite', default: false })
    isFavorite: boolean;
  
    @Column({ name: 'verified_at', nullable: true })
    verifiedAt?: Date;
  
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;
  
    @OneToMany(() => Transfer, transfer => transfer.destinationAccount)
    transfers: Transfer[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }