import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.userId;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          this.logger.log(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms`,
          );

          this.logToDatabase({
            userId,
            endpoint: originalUrl.split('?')[0],
            method,
            statusCode,
            responseTimeMs: duration,
            ipAddress: ip,
            userAgent,
          }).catch((err) => {
            this.logger.warn(`Failed to save audit log: ${err.message}`);
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.warn(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms - Error: ${error.message}`,
          );

          this.logToDatabase({
            userId,
            endpoint: originalUrl.split('?')[0],
            method,
            statusCode,
            responseTimeMs: duration,
            ipAddress: ip,
            userAgent,
            errorMessage: error.message,
          }).catch((err) => {
            this.logger.warn(`Failed to save audit log: ${err.message}`);
          });
        },
      }),
    );
  }

  private async logToDatabase(data: {
    userId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }) {
    try {
      await this.prisma.apiUsageLog.create({
        data: {
          userId: data.userId || null,
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          responseTimeMs: data.responseTimeMs,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent ? data.userAgent.slice(0, 255) : null,
          errorMessage: data.errorMessage || null,
        },
      });
    } catch {}
  }
}
