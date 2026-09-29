import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    example: {
      total: 1250,
      verified: 1100,
      joinedToday: 24,
      joinedThisWeek: 180,
    },
  })
  users: {
    total: number;
    verified: number;
    joinedToday: number;
    joinedThisWeek: number;
  };

  @ApiProperty({
    example: {
      totalActive: 1200,
      freeTier: 950,
      premiumTier: 220,
      enterpriseTier: 30,
    },
  })
  subscriptions: {
    totalActive: number;
    freeTier: number;
    premiumTier: number;
    enterpriseTier: number;
  };

  @ApiProperty({
    example: {
      totalConversations: 3400,
      totalMessages: 28500,
      totalTokensConsumed: 12500000,
    },
  })
  chat: {
    totalConversations: number;
    totalMessages: number;
    totalTokensConsumed: number;
  };

  @ApiProperty({
    example: {
      totalSearches: 8200,
      cacheEntries: 1450,
    },
  })
  search: {
    totalSearches: number;
    cacheEntries: number;
  };

  @ApiProperty({
    example: {
      callsToday: 15400,
      averageLatencyMs: 68,
      errorRatePercent: 0.45,
    },
  })
  apiTraffic: {
    callsToday: number;
    averageLatencyMs: number;
    errorRatePercent: number;
  };
}

export class SystemHealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded', 'error'] })
  status: string;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 3450.25 })
  uptimeSeconds: number;

  @ApiProperty({
    example: {
      rssMb: 124,
      heapTotalMb: 85,
      heapUsedMb: 62,
    },
  })
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };

  @ApiProperty({
    example: {
      status: 'up',
      latencyMs: 4,
    },
  })
  database: {
    status: string;
    latencyMs: number;
  };
}
