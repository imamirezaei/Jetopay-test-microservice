// biometric/entities/biometric-key.entity.ts
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
  import { User } from '../../users/entities/user.entity';
  
  @Entity('biometric_keys')
  @Index(['userId', 'deviceId'], { unique: true })
  export class BiometricKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @ManyToOne(() => User, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ name: 'device_id' })
    deviceId: string;
  
    @Column({ name: 'public_key', type: 'text' })
    publicKey: string;
  
    @Column({ name: 'key_type', default: 'RSA' })
    keyType: string;
  
    @Column({ name: 'key_algorithm', default: 'RS256' })
    keyAlgorithm: string;
  
    @Column({ name: 'last_used', nullable: true })
    lastUsed: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  
  // biometric/entities/biometric-challenge.entity.ts
  import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('biometric_challenges')
  @Index(['userId', 'deviceId', 'challenge'], { unique: true })
  export class BiometricChallenge {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @Column({ name: 'device_id' })
    deviceId: string;
  
    @Column()
    challenge: string;
  
    @Column({ name: 'expires_at' })
    expiresAt: Date;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }
  