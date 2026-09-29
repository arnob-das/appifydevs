import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import {
  DashboardStatsDto,
  SystemHealthResponseDto,
} from './dto/admin-stats.dto.js';
import {
  AdminUserQueryDto,
  UpdateUserRoleDto,
  AdminUpdateSubscriptionDto,
} from './dto/admin-users.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/constants/index.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Get platform dashboard metrics',
    description:
      'Provides high-level statistics: total users, active subscriptions breakdown, chat messages, search volume, and traffic analytics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard stats returned',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({
    summary: 'List users with pagination and search',
    description: 'Returns paginated user list with role filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users list retrieved',
  })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get user details by ID',
    description: 'Retrieves complete user information and activity counts.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details returned',
  })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({
    summary: 'Update user role (USER or ADMIN)',
    description: 'Promotes or demotes a user.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated',
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently removes a user and cascades related records.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted',
  })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('subscriptions')
  @ApiOperation({
    summary: 'List user subscriptions',
    description: 'Returns paginated subscriptions across all users.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions list retrieved',
  })
  async getSubscriptions(@Query() pagination: PaginationQueryDto) {
    return this.adminService.getSubscriptions(
      pagination.page,
      pagination.limit,
    );
  }

  @Patch('subscriptions/:id')
  @ApiOperation({
    summary: 'Admin update subscription plan',
    description: 'Manually adjusts a user subscription tier or request limit.',
  })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription updated',
  })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: AdminUpdateSubscriptionDto,
  ) {
    return this.adminService.updateSubscription(id, dto);
  }

  @Get('analytics/usage')
  @ApiOperation({
    summary: 'Get API usage analytics',
    description:
      'Aggregates endpoint traffic, response status distributions, and average latency over the last 24 hours.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage analytics returned',
  })
  async getUsageAnalytics() {
    return this.adminService.getUsageAnalytics();
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get audit request logs',
    description: 'Paginated HTTP request logs from ApiUsageLog table.',
  })
  @ApiQuery({ name: 'statusCode', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request logs retrieved',
  })
  async getRequestLogs(
    @Query() pagination: PaginationQueryDto,
    @Query('statusCode') statusCode?: number,
  ) {
    return this.adminService.getRequestLogs(
      pagination.page,
      pagination.limit,
      statusCode ? Number(statusCode) : undefined,
    );
  }

  @Get('health')
  @ApiOperation({
    summary: 'System health check',
    description:
      'Checks Node uptime, memory utilization, and PostgreSQL database connectivity latency.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status returned',
    type: SystemHealthResponseDto,
  })
  async getSystemHealth(): Promise<SystemHealthResponseDto> {
    return this.adminService.getSystemHealth();
  }
}
