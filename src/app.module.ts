import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { configuration } from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { AiProvidersModule } from './modules/ai-providers/ai-providers.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { WebSearchModule } from './modules/web-search/web-search.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { AppController } from './app.controller.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') || 60000,
          limit: config.get<number>('throttle.limit') || 100,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    AiProvidersModule,
    ChatModule,
    WebSearchModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
