// users/entities/user-profile.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity('user_profiles')
  export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @OneToOne(() => User, (user) => user.profile, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ nullable: true })
    address: string;
  
    @Column({ nullable: true })
    city: string;
  
    @Column({ nullable: true })
    state: string;
  
    @Column({ nullable: true })
    country: string;
  
    @Column({ nullable: true, name: 'postal_code' })
    postalCode: string;
  
    @Column({ nullable: true, name: 'date_of_birth' })
    dateOfBirth: Date;
  
    @Column({ nullable: true })
    avatar: string;
  
    @Column({ type: 'jsonb', nullable: true })
    preferences: any;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  