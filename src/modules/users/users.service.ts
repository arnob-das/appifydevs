import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UserProfileResponseDto } from './dto/user-profile-response.dto.js';
import { compareValue, hashValue } from '../../common/utils/hash.util.js';
import { Role } from '../../common/constants/index.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    let subscriptionSummary = null;
    if (user.subscription) {
      const remaining = Math.max(
        0,
        user.subscription.requestsLimitDaily -
          user.subscription.requestsUsedToday,
      );

      subscriptionSummary = {
        id: user.subscription.id,
        planTier: user.subscription.planTier,
        status: user.subscription.status,
        requestsUsedToday: user.subscription.requestsUsedToday,
        requestsLimitDaily: user.subscription.requestsLimitDaily,
        remainingRequestsToday: remaining,
        tokensUsedCurrentMonth: user.subscription.tokensUsedCurrentMonth,
        tokensLimitMonthly: user.subscription.tokensLimitMonthly,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role as Role,
      isEmailVerified: user.isEmailVerified,
      subscription: subscriptionSummary,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return this.getProfile(updated.id);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await compareValue(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Current password does not match');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newHash = await hashValue(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),

      this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    this.logger.log(
      `Password changed and sessions revoked for user: ${userId}`,
    );
    return {
      message:
        'Password changed successfully. All previous sessions have been invalidated.',
    };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`Account deleted for user: ${userId}`);
    return {
      message:
        'Your account and all associated data have been permanently deleted.',
    };
  }
}
