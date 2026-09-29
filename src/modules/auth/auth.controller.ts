import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import {
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/verify-email.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user profile with free subscription plan and returns access & refresh tokens.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user credentials',
    description:
      'Validates email and password, creates an active session, and returns JWT tokens.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses a valid refresh token to rotate session and issue a fresh access and refresh token pair.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token rotated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, revoked, or expired refresh token',
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto, ip, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out user',
    description:
      'Revokes the current session or all user sessions in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session revoked successfully',
  })
  async logout(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logout(user.userId, user.sessionId);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email address (Bonus)',
    description:
      'Validates email verification token and marks account verified.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link (Bonus)',
    description:
      'Generates a new verification token for an unverified account.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification link sent',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }
}
