import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof message === 'object' && message !== null
        ? (message as any).message || message
        : message;

    const errorName =
      exception instanceof HttpException
        ? (exception.getResponse() as any).error || exception.name
        : 'InternalServerError';

    this.logger.error(
      `HTTP Error ${status} [${request.method}] ${request.url}: ${JSON.stringify(
        errorMessage,
      )}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message: errorMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
