import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL via Prisma');
    } catch (error) {
      this.logger.warn(
        `Database connection deferred (will connect when PostgreSQL instance is available): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      const models = Reflect.ownKeys(this).filter(
        (key): key is string =>
          typeof key === 'string' &&
          !key.startsWith('_') &&
          !key.startsWith('$'),
      );
      return Promise.all(
        models.map((modelKey) => {
          if ((this as any)[modelKey]?.deleteMany) {
            return (this as any)[modelKey].deleteMany();
          }
          return Promise.resolve();
        }),
      );
    }
  }
}
