// entities/payment-verification.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  import { PaymentStatus } from '../enums/payment-status.enum';
  
  @Entity('payment_verifications')
  export class PaymentVerification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'reference_id' })
    @Index()
    referenceId: string;
  
    @Column({
      type: 'enum',
      enum: PaymentStatus,
    })
    status: PaymentStatus;
  
    @Column({ name: 'verification_data', nullable: true, type: 'text' })
    verificationData?: string;
  
    @Column({ name: 'verified_at' })
    verifiedAt: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }