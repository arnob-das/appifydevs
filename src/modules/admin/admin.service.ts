import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DashboardStatsDto,
  SystemHealthResponseDto,
} from './dto/admin-stats.dto.js';
import {
  AdminUserQueryDto,
  AdminUpdateSubscriptionDto,
} from './dto/admin-users.dto.js';
import { Role, PlanTier, PLAN_LIMITS } from '../../common/constants/index.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedUsers,
      joinedToday,
      joinedThisWeek,
      freeSubs,
      premiumSubs,
      enterpriseSubs,
      totalConversations,
      totalMessages,
      tokensAgg,
      totalSearches,
      cacheEntries,
      apiLogsToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isEmailVerified: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.subscription.count({ where: { planTier: PlanTier.FREE } }),
      this.prisma.subscription.count({ where: { planTier: PlanTier.PREMIUM } }),
      this.prisma.subscription.count({
        where: { planTier: PlanTier.ENTERPRISE },
      }),
      this.prisma.conversation.count(),
      this.prisma.chatMessage.count(),
      this.prisma.chatMessage.aggregate({ _sum: { tokensUsed: true } }),
      this.prisma.webSearch.count(),
      this.prisma.searchCache.count(),
      this.prisma.apiUsageLog.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { statusCode: true, responseTimeMs: true },
      }),
    ]);

    const callsToday = apiLogsToday.length;
    const avgLatency =
      callsToday > 0
        ? Math.round(
            apiLogsToday.reduce((acc, curr) => acc + curr.responseTimeMs, 0) /
              callsToday,
          )
        : 0;

    const errorCalls = apiLogsToday.filter(
      (log) => log.statusCode >= 400,
    ).length;
    const errorRate =
      callsToday > 0 ? Number(((errorCalls / callsToday) * 100).toFixed(2)) : 0;

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        joinedToday,
        joinedThisWeek,
      },
      subscriptions: {
        totalActive: freeSubs + premiumSubs + enterpriseSubs,
        freeTier: freeSubs,
        premiumTier: premiumSubs,
        enterpriseTier: enterpriseSubs,
      },
      chat: {
        totalConversations,
        totalMessages,
        totalTokensConsumed: tokensAgg._sum.tokensUsed || 0,
      },
      search: {
        totalSearches,
        cacheEntries,
      },
      apiTraffic: {
        callsToday,
        averageLatencyMs: avgLatency,
        errorRatePercent: errorRate,
      },
    };
  }

  async getUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          subscription: {
            select: {
              planTier: true,
              status: true,
              requestsUsedToday: true,
              requestsLimitDaily: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      meta: {
        totalItems: total,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: {
          select: {
            sessions: true,
            conversations: true,
            webSearches: true,
            apiUsageLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const {
      passwordHash: _passwordHash,
      emailVerifyToken: _emailVerifyToken,
      resetPasswordToken: _resetPasswordToken,
      ...safeUser
    } = user;
    return safeUser;
  }

  async updateUserRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    this.logger.log(`Admin updated role of user ${id} to ${role}`);
    return updated;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`Admin deleted user ${id}`);
    return { message: `User #${id} and all related records deleted.` };
  }

  async getSubscriptions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [subs, total] = await Promise.all([
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      items: subs,
      meta: {
        totalItems: total,
        itemCount: subs.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async updateSubscription(id: string, dto: AdminUpdateSubscriptionDto) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription #${id} not found`);
    }

    const planConfig = PLAN_LIMITS[dto.planTier];
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        planTier: dto.planTier,
        requestsLimitDaily:
          dto.requestsLimitDaily || planConfig.dailyRequestsLimit,
        tokensLimitMonthly: planConfig.monthlyTokensLimit,
      },
    });

    return updated;
  }

  async getUsageAnalytics() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [topEndpoints, statusCodes, recentLogs] = await Promise.all([
      this.prisma.apiUsageLog.groupBy({
        by: ['endpoint', 'method'],
        where: { createdAt: { gte: last24h } },
        _count: { _all: true },
        _avg: { responseTimeMs: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
      this.prisma.apiUsageLog.groupBy({
        by: ['statusCode'],
        where: { createdAt: { gte: last24h } },
        _count: { _all: true },
      }),
      this.prisma.apiUsageLog.findMany({
        where: { createdAt: { gte: last24h } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      timeframe: 'last_24_hours',
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.endpoint,
        method: e.method,
        requests: e._count._all,
        avgResponseTimeMs: Math.round(e._avg.responseTimeMs || 0),
      })),
      statusCodes: statusCodes.map((s) => ({
        code: s.statusCode,
        count: s._count._all,
      })),
      recentLogs,
    };
  }

  async getRequestLogs(page = 1, limit = 20, statusCode?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (statusCode) {
      where.statusCode = statusCode;
    }

    const [logs, total] = await Promise.all([
      this.prisma.apiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),
      this.prisma.apiUsageLog.count({ where }),
    ]);

    return {
      items: logs,
      meta: {
        totalItems: total,
        itemCount: logs.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getSystemHealth(): Promise<SystemHealthResponseDto> {
    const memory = process.memoryUsage();
    const startDb = Date.now();
    let dbStatus = 'up';
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - startDb;
    } catch {
      dbStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
    };
  }
}
