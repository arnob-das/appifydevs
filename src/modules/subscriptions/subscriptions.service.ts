import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  PlanTier,
  SubscriptionStatus,
  PLAN_LIMITS,
} from '../../common/constants/index.js';
import {
  SubscriptionStatusResponseDto,
  RemainingRequestsResponseDto,
  PlanDetailsDto,
} from './dto/subscription-response.dto.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<SubscriptionStatusResponseDto> {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planTier: PlanTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          requestsLimitDaily: PLAN_LIMITS[PlanTier.FREE].dailyRequestsLimit,
          tokensLimitMonthly: PLAN_LIMITS[PlanTier.FREE].monthlyTokensLimit,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    subscription = await this.checkAndResetDailyQuota(subscription);

    if (!subscription) {
      throw new NotFoundException('Subscription could not be loaded');
    }

    const planConfig = PLAN_LIMITS[subscription.planTier as PlanTier];
    const remainingRequests = Math.max(
      0,
      subscription.requestsLimitDaily - subscription.requestsUsedToday,
    );
    const remainingTokens = Math.max(
      0,
      subscription.tokensLimitMonthly - subscription.tokensUsedCurrentMonth,
    );

    return {
      id: subscription.id,
      planTier: subscription.planTier as PlanTier,
      status: subscription.status as SubscriptionStatus,
      requestsUsedToday: subscription.requestsUsedToday,
      requestsLimitDaily: subscription.requestsLimitDaily,
      remainingRequestsToday: remainingRequests,
      tokensUsedCurrentMonth: subscription.tokensUsedCurrentMonth,
      tokensLimitMonthly: subscription.tokensLimitMonthly,
      remainingTokensMonthly: remainingTokens,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      planDetails: {
        planTier: subscription.planTier as PlanTier,
        ...planConfig,
      },
    };
  }

  async getRemainingRequests(
    userId: string,
  ): Promise<RemainingRequestsResponseDto> {
    const status = await this.getStatus(userId);

    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    return {
      planTier: status.planTier,
      requestsUsedToday: status.requestsUsedToday,
      requestsLimitDaily: status.requestsLimitDaily,
      remainingRequests: status.remainingRequestsToday,
      resetsAt: tomorrow.toISOString(),
    };
  }

  async upgrade(
    userId: string,
    targetTier: PlanTier,
  ): Promise<SubscriptionStatusResponseDto> {
    const current = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (current && current.planTier === targetTier) {
      throw new BadRequestException(
        `You are already subscribed to the ${targetTier} plan.`,
      );
    }

    const limits = PLAN_LIMITS[targetTier];

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planTier: targetTier,
        status: SubscriptionStatus.ACTIVE,
        requestsLimitDaily: limits.dailyRequestsLimit,
        tokensLimitMonthly: limits.monthlyTokensLimit,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        planTier: targetTier,
        status: SubscriptionStatus.ACTIVE,
        requestsLimitDaily: limits.dailyRequestsLimit,
        tokensLimitMonthly: limits.monthlyTokensLimit,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`User ${userId} upgraded subscription to ${targetTier}`);
    return this.getStatus(userId);
  }

  async downgrade(
    userId: string,
    targetTier: PlanTier,
  ): Promise<SubscriptionStatusResponseDto> {
    return this.upgrade(userId, targetTier);
  }

  async cancel(userId: string): Promise<{ message: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(
      `Subscription for user ${userId} set to cancel at period end`,
    );
    return {
      message:
        'Your subscription will not renew after the current period ends.',
    };
  }

  getAvailablePlans(): PlanDetailsDto[] {
    return Object.entries(PLAN_LIMITS).map(([tier, config]) => ({
      planTier: tier as PlanTier,
      ...config,
    }));
  }

  async incrementUsage(userId: string, tokens = 0): Promise<void> {
    try {
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          requestsUsedToday: { increment: 1 },
          tokensUsedCurrentMonth: { increment: tokens },
        },
      });
    } catch {
      this.logger.warn(`Could not increment usage for user ${userId}`);
    }
  }

  private async checkAndResetDailyQuota(subscription: any) {
    if (!subscription) return null;
    const now = new Date();
    const lastReset = new Date(subscription.lastResetDate);
    const isNewDay =
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate();

    if (isNewDay) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          requestsUsedToday: 0,
          lastResetDate: now,
        },
      });
    }

    return subscription;
  }
}
