// payment/entities/payment-method.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  import { PaymentMethodType } from '../enums/payment-method-type.enum';
  
  @Entity('payment_methods')
  @Index(['userId', 'isDefault'])
  export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @Column({
      type: 'enum',
      enum: PaymentMethodType,
      default: PaymentMethodType.CARD,
    })
    type: PaymentMethodType;
  
    @Column({ name: 'masked_card_number', nullable: true })
    maskedCardNumber: string;
  
    @Column({ name: 'card_holder_name', nullable: true })
    cardHolderName: string;
  
    @Column({ name: 'expiration_date', nullable: true })
    expirationDate: string;
  
    @Column({ name: 'is_default', default: false })
    isDefault: boolean;
  
    @Column({ nullable: true })
    token: string;
  
    @Column({ nullable: true })
    nickname: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }