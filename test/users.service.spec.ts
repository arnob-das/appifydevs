import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../src/modules/users/users.service.js';
import { BadRequestException } from '@nestjs/common';
import { hashValue } from '../src/common/utils/hash.util.js';
import { Role } from '../src/common/constants/index.js';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      session: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: vi
        .fn()
        .mockImplementation((promises) => Promise.all(promises)),
    };
    service = new UsersService(mockPrisma as any);
  });

  it('should retrieve user profile with remaining daily requests calculated', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex',
      avatarUrl: null,
      role: Role.USER,
      isEmailVerified: true,
      createdAt: new Date(),
      subscription: {
        id: 'sub-1',
        planTier: 'FREE',
        status: 'ACTIVE',
        requestsUsedToday: 4,
        requestsLimitDaily: 20,
        tokensUsedCurrentMonth: 1200,
        tokensLimitMonthly: 100000,
        currentPeriodEnd: new Date(),
      },
    });

    const profile = await service.getProfile('user-1');
    expect(profile.email).toBe('alex@example.com');
    expect(profile.subscription?.remainingRequestsToday).toBe(16);
  });

  it('should change user password and invalidate active sessions', async () => {
    const oldHash = await hashValue('OldPassword@123');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: oldHash,
    });

    const res = await service.changePassword('user-1', {
      currentPassword: 'OldPassword@123',
      newPassword: 'NewSecurePassword@2026',
    });

    expect(res.message).toContain('Password changed successfully');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should throw BadRequestException if current password does not match', async () => {
    const oldHash = await hashValue('OldPassword@123');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: oldHash,
    });

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'WrongPassword@123',
        newPassword: 'NewSecurePassword@2026',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
