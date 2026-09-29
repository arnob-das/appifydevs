import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionStatus } from '../constants/index.js';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return true;
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (!subscription) {
      await this.prisma.subscription.create({
        data: {
          userId: user.userId,
          planTier: 'FREE',
          status: SubscriptionStatus.ACTIVE,
          requestsLimitDaily: 20,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return true;
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Subscription Inactive',
          message:
            'Your subscription is currently inactive or expired. Please renew or upgrade.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const now = new Date();
    const lastReset = new Date(subscription.lastResetDate);
    const isNewDay =
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate();

    if (isNewDay) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          requestsUsedToday: 0,
          lastResetDate: now,
        },
      });
      return true;
    }

    if (subscription.requestsUsedToday >= subscription.requestsLimitDaily) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Daily Usage Limit Exceeded',
          message: `You have reached your daily limit of ${subscription.requestsLimitDaily} requests for the ${subscription.planTier} tier. Upgrade your plan for higher limits.`,
          upgradeUrl: '/api/v1/subscriptions/upgrade',
          planTier: subscription.planTier,
          requestsUsedToday: subscription.requestsUsedToday,
          requestsLimitDaily: subscription.requestsLimitDaily,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
