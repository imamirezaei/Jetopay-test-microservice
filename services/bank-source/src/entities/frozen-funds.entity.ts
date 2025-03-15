import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('frozen_funds')
  export class FrozenFunds {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'account_id' })
    @Index()
    accountId: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount: number;
  
    @Column({ name: 'transaction_id' })
    @Index()
    transactionId: string;
  
    @Column({ default: false })
    released: boolean;
  
    @Column({ default: false })
    used: boolean;
  
    @Column({ name: 'released_at', nullable: true })
    releasedAt?: Date;
  
    @Column()
    expiration: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }