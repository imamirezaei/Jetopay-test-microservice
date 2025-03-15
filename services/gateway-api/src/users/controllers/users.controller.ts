// users/controllers/users.controller.ts
import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Delete,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { UsersService } from '../services/users.service';
  import { UpdateUserDto } from '../dto/update-user.dto';
  import { GetUserId } from '../decorators/get-user-id.decorator';
  import { UpdateProfileDto } from '../dto/update-profile.dto';
  import { UserResponseDto } from '../dto/user-response.dto';
  import { UserProfileDto } from '../dto/user-profile.dto';
  
  @ApiTags('users')
  @Controller('users')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
      status: 200,
      description: 'Current user profile',
      type: UserResponseDto,
    })
    async getCurrentUser(@GetUserId() userId: string): Promise<UserResponseDto> {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.usersService.mapToResponseDto(user);
    }
  
    @Put('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
      status: 200,
      description: 'Updated user profile',
      type: UserResponseDto,
    })
    async updateCurrentUser(
      @GetUserId() userId: string,
      @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
      const updatedUser = await this.usersService.update(userId, updateUserDto);
      return this.usersService.mapToResponseDto(updatedUser);
    }
  
    @Get('me/profile')
    @ApiOperation({ summary: 'Get current user extended profile' })
    @ApiResponse({
      status: 200,
      description: 'Current user extended profile',
      type: UserProfileDto,
    })
    async getUserProfile(@GetUserId() userId: string): Promise<UserProfileDto> {
      return this.usersService.getUserProfile(userId);
    }
  
    @Put('me/profile')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update current user extended profile' })
    @ApiResponse({
      status: 200,
      description: 'Updated user extended profile',
      type: UserProfileDto,
    })
    async updateUserProfile(
      @GetUserId() userId: string,
      @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserProfileDto> {
      return this.usersService.updateUserProfile(userId, updateProfileDto);
    }
  
    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiResponse({ status: 200, description: 'User account deleted' })
    async deleteCurrentUser(
      @GetUserId() userId: string,
    ): Promise<{ success: boolean }> {
      await this.usersService.delete(userId);
      return { success: true };
    }
  
    // Admin routes
    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (Admin)' })
    @ApiResponse({
      status: 200,
      description: 'User profile',
      type: UserResponseDto,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getUserById(
      @Param('id') id: string,
      @GetUserId() currentUserId: string,
    ): Promise<UserResponseDto> {
      // Check if user is admin (in a real app would use a role guard)
      const currentUser = await this.usersService.findById(currentUserId);
      if (!currentUser.roles.includes('admin')) {
        throw new ForbiddenException('Insufficient privileges');
      }
  
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return this.usersService.mapToResponseDto(user);
    }
  }