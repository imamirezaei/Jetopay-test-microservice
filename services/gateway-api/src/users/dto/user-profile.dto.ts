// users/dto/user-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class ProfileDetails {
  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  postalCode?: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false, type: 'object' })
  preferences?: any;
}

export class UserProfileDto {
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

  @ApiProperty({ type: ProfileDetails, nullable: true })
  profile: ProfileDetails;
}
