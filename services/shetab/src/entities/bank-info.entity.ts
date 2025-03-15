// entities/bank-info.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('bank_info')
  export class BankInfo {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    @Index({ unique: true })
    code: string;
  
    @Column()
    name: string;
  
    @Column({ nullable: true })
    persianName: string;
  
    @Column({ nullable: true })
    logoUrl: string;
  
    @Column({ nullable: true })
    websiteUrl: string;
  
    @Column({ nullable: true })
    cardPrefix: string;
  
    @Column({ default: true })
    isActive: boolean;
  
    @Column({ nullable: true })
    apiUrl: string;
  
    @Column({ nullable: true })
    ipgUrl: string;
  
    @Column({ type: 'jsonb', nullable: true })
    contactInfo: {
      phone?: string;
      email?: string;
      address?: string;
    };
  
    @Column({ type: 'jsonb', nullable: true })
    supportedFeatures: {
      directDebit: boolean;
      instantTransfer: boolean;
      cardToCard: boolean;
      accountInquiry: boolean;
    };
  
    @Column({ type: 'jsonb', nullable: true })
    transferLimits: {
      minAmount: number;
      maxAmount: number;
      dailyLimit: number;
    };
  
    @Column({ nullable: true })
    description: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Dat