import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UserProfileResponseDto } from './dto/user-profile-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the authenticated user profile along with subscription tier and usage quota.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Bearer token missing or invalid',
  })
  async getProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Allows updating user display name and avatar URL.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change account password',
    description:
      'Validates current password, updates to new password, and invalidates all existing sessions for security.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Current password invalid or new password criteria not met',
  })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user account',
    description:
      'Permanently deletes the authenticated user account and cascades all sessions, conversations, and search logs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deleted successfully',
  })
  async deleteAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.deleteAccount(user.userId);
  }
}
