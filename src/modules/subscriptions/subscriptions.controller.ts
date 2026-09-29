import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service.js';
import { ChangePlanDto } from './dto/upgrade-subscription.dto.js';
import {
  SubscriptionStatusResponseDto,
  RemainingRequestsResponseDto,
  PlanDetailsDto,
} from './dto/subscription-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator.js';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({
    summary: 'List all available subscription plans',
    description:
      'Returns pricing, daily limits, supported models, and features for Free, Premium, and Enterprise plans.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plans retrieved successfully',
    type: [PlanDetailsDto],
  })
  getAvailablePlans(): PlanDetailsDto[] {
    return this.subscriptionsService.getAvailablePlans();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('status')
  @ApiOperation({
    summary: 'Get user subscription status',
    description:
      'Returns current plan tier, daily requests quota, monthly token quota, renewal date, and remaining quota.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription status retrieved successfully',
    type: SubscriptionStatusResponseDto,
  })
  async getStatus(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SubscriptionStatusResponseDto> {
    return this.subscriptionsService.getStatus(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('remaining-requests')
  @ApiOperation({
    summary: 'Get remaining requests for today',
    description:
      'Fast endpoint for Chrome extension to check remaining daily request quota and reset time.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remaining requests retrieved successfully',
    type: RemainingRequestsResponseDto,
  })
  async getRemainingRequests(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<RemainingRequestsResponseDto> {
    return this.subscriptionsService.getRemainingRequests(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade subscription plan',
    description:
      'Upgrades the authenticated user to Premium or Enterprise plan with increased limits.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription upgraded successfully',
    type: SubscriptionStatusResponseDto,
  })
  async upgrade(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePlanDto,
  ): Promise<SubscriptionStatusResponseDto> {
    return this.subscriptionsService.upgrade(user.userId, dto.planTier);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Downgrade subscription plan',
    description: 'Downgrades user to a lower plan tier.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription downgraded successfully',
    type: SubscriptionStatusResponseDto,
  })
  async downgrade(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePlanDto,
  ): Promise<SubscriptionStatusResponseDto> {
    return this.subscriptionsService.downgrade(user.userId, dto.planTier);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel auto-renewal',
    description:
      'Marks subscription to not renew after the current billing cycle expires.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
  })
  async cancel(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.cancel(user.userId);
  }
}
