import { ApiProperty } from '@nestjs/swagger';
import {
  PlanTier,
  SubscriptionStatus,
} from '../../../common/constants/index.js';

export class PlanDetailsDto {
  @ApiProperty({ enum: PlanTier, example: PlanTier.PREMIUM })
  planTier: PlanTier;

  @ApiProperty({ example: 500 })
  dailyRequestsLimit: number;

  @ApiProperty({ example: 2000000 })
  monthlyTokensLimit: number;

  @ApiProperty({ example: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'] })
  supportedModels: string[];

  @ApiProperty({ example: true })
  streamingEnabled: boolean;

  @ApiProperty({ example: true })
  prioritySupport: boolean;

  @ApiProperty({ example: 19.99 })
  pricePerMonth: number;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ enum: PlanTier, example: PlanTier.PREMIUM })
  planTier: PlanTier;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiProperty({ example: 25 })
  requestsUsedToday: number;

  @ApiProperty({ example: 500 })
  requestsLimitDaily: number;

  @ApiProperty({ example: 475 })
  remainingRequestsToday: number;

  @ApiProperty({ example: 50000 })
  tokensUsedCurrentMonth: number;

  @ApiProperty({ example: 2000000 })
  tokensLimitMonthly: number;

  @ApiProperty({ example: 1950000 })
  remainingTokensMonthly: number;

  @ApiProperty({ example: '2026-10-25T00:00:00.000Z' })
  currentPeriodEnd: Date;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ type: PlanDetailsDto })
  planDetails: PlanDetailsDto;
}

export class RemainingRequestsResponseDto {
  @ApiProperty({ enum: PlanTier, example: PlanTier.FREE })
  planTier: PlanTier;

  @ApiProperty({ example: 5 })
  requestsUsedToday: number;

  @ApiProperty({ example: 20 })
  requestsLimitDaily: number;

  @ApiProperty({ example: 15 })
  remainingRequests: number;

  @ApiProperty({ example: '2026-09-26T00:00:00.000Z' })
  resetsAt: string;
}
