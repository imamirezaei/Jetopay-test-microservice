// users/entities/user.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { RefreshToken } from '../../auth/entities/refresh-token.entity';
  import { UserProfile } from './user-profile.entity';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ select: false })
    password: string;
  
    @Column({ name: 'first_name' })
    firstName: string;
  
    @Column({ name: 'last_name' })
    lastName: string;
  
    @Column({ name: 'phone_number', unique: true })
    phoneNumber: string;
  
    @Column({ name: 'national_id', nullable: true, unique: true })
    nationalId: string;
  
    @Column({ type: 'boolean', default: false })
    verified: boolean;
  
    @Column({ type: 'boolean', default: true })
    active: boolean;
  
    @Column({ type: 'simple-array', default: 'user' })
    roles: string[];
  
    @Column({ name: 'last_login', nullable: true })
    lastLogin: Date;
  
    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens: RefreshToken[];
  
    @OneToOne(() => UserProfile, (profile) => profile.user, {
      cascade: true,
    })
    profile: UserProfile;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }