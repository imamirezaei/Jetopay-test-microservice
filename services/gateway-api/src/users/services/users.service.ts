// users/services/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { RegisterDto } from '../../auth/dto/register.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserProfileDto } from '../dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async findById(id: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'roles', 'phoneNumber'],
    });
  }

  async findByPhone(phoneNumber: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { phoneNumber },
    });
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // Create user
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
      roles: user.roles,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  mapToProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      verified: user.verified,
      profile: user.profile ? {
        address: user.profile.address,
        city: user.profile.city,
        state: user.profile.state,
        country: user.profile.country,
        postalCode: user.profile.postalCode,
        dateOfBirth: user.profile.dateOfBirth,
        avatar: user.profile.avatar,
        preferences: user.profile.preferences,
      } : null,
    };
  }
}
