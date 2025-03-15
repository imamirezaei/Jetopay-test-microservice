// entities/merchant-info.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('merchant_info')
  export class MerchantInfo {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'merchant_id', unique: true })
    @Index()
    merchantId: string;
  
    @Column({ name: 'terminal_id', nullable: true })
    terminalId?: string;
  
    @Column()
    name: string;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ default: true })
    active: boolean;
  
    @Column({ nullable: true })
    username?: string;
  
    @Column({ nullable: true })
    password?: string;
  
    @Column({ name: 'api_key', nullable: true })
    apiKey?: string;
  
    @Column({ name: 'callback_url', nullable: true })
    callbackUrl?: string;
  
    @Column({ name: 'contact_email', nullable: true })
    contactEmail?: string;
  
    @Column({ name: 'contact_phone', nullable: true })
    contactPhone?: string;
  
    @Column({ name: 'allowed_ips', type: 'simple-array', nullable: true })
    allowedIps?: string[];
  
    @Column({ name: 'verification_status', default: 'PENDING' })
    verificationStatus: string;
  
    @Column({ name: 'verified_at', nullable: true })
    verifiedAt?: Date;
  
    @Column({ name: 'deactivated_at', nullable: true })
    deactivatedAt?: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  
  