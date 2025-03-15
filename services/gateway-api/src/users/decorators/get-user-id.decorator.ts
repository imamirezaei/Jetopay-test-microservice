// users/decorators/get-user-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
); ['user'],
    });
    
    // Create empty profile
    const profile = this.userProfileRepository.create({
      user,
    });
    
    user.profile = profile;
    
    return this.usersRepository.save(user);
  }

  async createWithPhone(phoneNumber: string): Promise<User> {
    // Generate a random password (won't be used for login as this user 
    // will authenticate via OTP)
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    // Create minimal user record
    const user = this.usersRepository.create({
      email: `${phoneNumber.replace(/\D/g, '')}@temporary.com`,
      password: hashedPassword,
      firstName: 'User',
      lastName: phoneNumber.slice(-4),
      phoneNumber,
      roles: ['user'],
      verified: true, // Phone verified via OTP
    });
    
    // Create empty profile
    const profile = this.userProfileRepository.create({
      user,
    });
    
    user.profile = profile;
    
    return this.usersRepository.save(user);
  }

  async createFromOAuth(profile: any): Promise<User> {
    // Extract profile data from OAuth response
    const { email, given_name, family_name } = profile;
    
    // Generate a random password as OAuth users won't log in with password
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    // Create user from OAuth profile
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName: given_name || 'User',
      lastName: family_name || '',
      phoneNumber: `+temp${Math.floor(Math.random() * 1000000000)}`, // Temporary, will need update
      roles: ['user'],
      verified: true, // Email verified via OAuth
    });
    
    // Create empty profile
    const userProfile = this.userProfileRepository.create({
      user,
    });
    
    user.profile = userProfile;
    
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user properties
    const { password, ...restDto } = updateUserDto;
    Object.assign(user, restDto);

    // If password is provided, hash it
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    return this.usersRepository.save(user);
  }

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      // Create profile if it doesn't exist
      user.profile = this.userProfileRepository.create({
        userId,
      });
      await this.userProfileRepository.save(user.profile);
    }

    return this.mapToProfileDto(user);
  }

  async updateUserProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      // Create profile if it doesn't exist
      user.profile = this.userProfileRepository.create({
        userId,
        ...updateProfileDto,
      });
    } else {
      // Update existing profile
      Object.assign(user.profile, updateProfileDto);
    }

    await this.userProfileRepository.save(user.profile);
    return this.mapToProfileDto(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    await this.usersRepository.remove(user);
  }

  mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      nationalId: user.nationalId,
      verified: user.verified,
      roles: