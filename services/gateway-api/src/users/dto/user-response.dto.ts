// users/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ required: false })
  nationalId?: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ required: false })
  lastLogin?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
