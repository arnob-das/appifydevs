import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/constants/index.js';

export class SubscriptionSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'FREE' })
  planTier: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 5 })
  requestsUsedToday: number;

  @ApiProperty({ example: 20 })
  requestsLimitDaily: number;

  @ApiProperty({ example: 15 })
  remainingRequestsToday: number;

  @ApiProperty({ example: 2500 })
  tokensUsedCurrentMonth: number;

  @ApiProperty({ example: 100000 })
  tokensLimitMonthly: number;

  @ApiProperty({ example: '2026-10-25T00:00:00.000Z' })
  currentPeriodEnd: Date;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'alex.developer@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Alex Developer' })
  name: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  avatarUrl: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiPropertyOptional({ type: SubscriptionSummaryDto })
  subscription: SubscriptionSummaryDto | null;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;
}
