// users/dto/update-user.dto.ts
import { IsEmail, IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'User password',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+\d{1,15}$/, {
    message: 'Phone number must be in international format',
  })
  phoneNumber?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'User national ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  nationalId?: string;
}
