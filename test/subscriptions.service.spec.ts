import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service.js';
import { PlanTier, SubscriptionStatus } from '../src/common/constants/index.js';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscription: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };
    service = new SubscriptionsService(mockPrisma as any);
  });

  it('should return available plan tiers with limits and pricing', () => {
    const plans = service.getAvailablePlans();
    expect(plans).toHaveLength(3);
    const freePlan = plans.find((p) => p.planTier === PlanTier.FREE);
    const premiumPlan = plans.find((p) => p.planTier === PlanTier.PREMIUM);

    expect(freePlan?.dailyRequestsLimit).toBe(20);
    expect(premiumPlan?.dailyRequestsLimit).toBe(500);
    expect(premiumPlan?.pricePerMonth).toBe(19.99);
  });

  it('should return subscription status with remaining requests today', async () => {
    const mockSub = {
      id: 'sub-1',
      userId: 'user-1',
      planTier: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      requestsUsedToday: 5,
      requestsLimitDaily: 20,
      tokensUsedCurrentMonth: 2500,
      tokensLimitMonthly: 100000,
      currentPeriodEnd: new Date('2026-10-25'),
      lastResetDate: new Date(),
      cancelAtPeriodEnd: false,
    };

    mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);

    const status = await service.getStatus('user-1');
    expect(status.planTier).toBe(PlanTier.FREE);
    expect(status.requestsUsedToday).toBe(5);
    expect(status.remainingRequestsToday).toBe(15);
    expect(status.remainingTokensMonthly).toBe(97500);
  });

  it('should upgrade user plan and update daily and monthly limits', async () => {
    mockPrisma.subscription.findUnique
      .mockResolvedValueOnce({
        id: 'sub-1',
        userId: 'user-1',
        planTier: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        requestsUsedToday: 5,
        requestsLimitDaily: 20,
        tokensUsedCurrentMonth: 0,
        tokensLimitMonthly: 100000,
        lastResetDate: new Date(),
        currentPeriodEnd: new Date('2026-10-25'),
        cancelAtPeriodEnd: false,
      })
      .mockResolvedValueOnce({
        id: 'sub-1',
        userId: 'user-1',
        planTier: PlanTier.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        requestsUsedToday: 5,
        requestsLimitDaily: 500,
        tokensUsedCurrentMonth: 0,
        tokensLimitMonthly: 2000000,
        lastResetDate: new Date(),
        currentPeriodEnd: new Date('2026-10-25'),
        cancelAtPeriodEnd: false,
      });

    mockPrisma.subscription.upsert.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planTier: PlanTier.PREMIUM,
      requestsLimitDaily: 500,
      tokensLimitMonthly: 2000000,
    });

    const upgraded = await service.upgrade('user-1', PlanTier.PREMIUM);
    expect(upgraded.planTier).toBe(PlanTier.PREMIUM);
    expect(upgraded.requestsLimitDaily).toBe(500);
    expect(upgraded.remainingRequestsToday).toBe(495);
  });
});
