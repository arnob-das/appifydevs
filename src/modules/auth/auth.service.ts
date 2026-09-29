import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { hashValue, compareValue } from '../../common/utils/hash.util.js';
import {
  Role,
  PlanTier,
  SubscriptionStatus,
} from '../../common/constants/index.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    const passwordHash = await hashValue(dto.password);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: dto.name || null,
        role: Role.USER,
        isEmailVerified: false,
        emailVerifyToken,
        emailVerifyExpires,
        subscription: {
          create: {
            planTier: PlanTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            requestsLimitDaily: 20,
            tokensLimitMonthly: 100000,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.createSession(user.id, tokens.refreshToken, ip, userAgent);

    this.logger.log(`New user registered: ${user.email} (${user.id})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        isEmailVerified: user.isEmailVerified,
        planTier: user.subscription?.planTier || 'FREE',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    };
  }

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compareValue(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.createSession(user.id, tokens.refreshToken, ip, userAgent);

    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        isEmailVerified: user.isEmailVerified,
        planTier: user.subscription?.planTier || 'FREE',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    };
  }

  async refreshToken(
    dto: RefreshTokenDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'echogpt_super_secret_refresh_jwt_key_2026',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        subscription: true,
        sessions: {
          where: { isRevoked: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let matchingSession = null;
    for (const session of user.sessions) {
      if (session.expiresAt > new Date()) {
        const isMatch = await compareValue(
          dto.refreshToken,
          session.refreshTokenHash,
        );
        if (isMatch) {
          matchingSession = session;
          break;
        }
      }
    }

    if (!matchingSession) {
      throw new UnauthorizedException(
        'Session has been revoked or expired. Please sign in again.',
      );
    }

    await this.prisma.session.update({
      where: { id: matchingSession.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.createSession(user.id, tokens.refreshToken, ip, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        isEmailVerified: user.isEmailVerified,
        planTier: user.subscription?.planTier || 'FREE',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    };
  }

  async logout(
    userId: string,
    sessionId?: string,
  ): Promise<{ message: string }> {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return { message: 'Successfully logged out. Session revoked.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid email verification token');
    }

    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      throw new BadRequestException(
        'Email verification token has expired. Please request a new one.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return {
      message: 'Email address successfully verified.',
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return {
        message:
          'If the email is registered and unverified, a verification link has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return { message: 'This email is already verified.' };
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    return {
      message: 'A new verification link has been sent to your email address.',
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'echogpt_super_secret_access_jwt_key_2026';
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'echogpt_super_secret_refresh_jwt_key_2026';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ) {
    const refreshTokenHash = await hashValue(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: ip || null,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        expiresAt,
      },
    });
  }
}
