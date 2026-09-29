import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hashValue } from '../src/common/utils/hash.util.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      session: {
        create: vi.fn().mockResolvedValue({ id: 'sess-1' }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt_token_mock'),
      verifyAsync: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return 'mock_secret';
      }),
    };

    service = new AuthService(
      mockPrisma as any,
      mockJwtService as any,
      mockConfigService as any,
    );
  });

  it('should register a new user with free subscription and hashed password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'alex@example.com',
      name: 'Alex',
      role: 'USER',
      isEmailVerified: false,
      subscription: { planTier: 'FREE' },
    });

    const res = await service.register({
      email: 'alex@example.com',
      password: 'Password@123',
      name: 'Alex',
    });

    expect(res.user.email).toBe('alex@example.com');
    expect(res.user.planTier).toBe('FREE');
    expect(res.accessToken).toBe('jwt_token_mock');
    expect(res.refreshToken).toBe('jwt_token_mock');
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  it('should throw ConflictException when registering duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

    await expect(
      service.register({
        email: 'alex@example.com',
        password: 'Password@123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should login valid user and issue fresh tokens and session', async () => {
    const pwdHash = await hashValue('Password@123');

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'alex@example.com',
      passwordHash: pwdHash,
      role: 'USER',
      isEmailVerified: true,
      subscription: { planTier: 'FREE' },
    });

    const res = await service.login({
      email: 'alex@example.com',
      password: 'Password@123',
    });

    expect(res.user.email).toBe('alex@example.com');
    expect(res.accessToken).toBe('jwt_token_mock');
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    const pwdHash = await hashValue('Password@123');

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'alex@example.com',
      passwordHash: pwdHash,
      role: 'USER',
    });

    await expect(
      service.login({
        email: 'alex@example.com',
        password: 'WrongPassword@123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
