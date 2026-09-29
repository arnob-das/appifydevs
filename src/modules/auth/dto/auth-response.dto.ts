import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/constants/index.js';

export class UserSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'alex.developer@example.com' })
  email: string;

  @ApiProperty({ example: 'Alex Developer', nullable: true })
  name: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: 'FREE' })
  planTier: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Bearer Access Token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token for rotating session',
  })
  refreshToken: string;

  @ApiProperty({
    example: '15m',
    description: 'Access token expiration timeframe',
  })
  expiresIn: string;
}
