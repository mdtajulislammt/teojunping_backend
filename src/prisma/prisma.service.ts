import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import appConfig from '../config/app.config';
import { PrismaClient } from 'prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export interface PrismaService extends PrismaClient {}

@Injectable()
export class PrismaService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    const datasourceUrl = appConfig().database.url;

    if (!datasourceUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({ connectionString: datasourceUrl });
    const adapter = new PrismaPg(pool);

    this.prisma = new PrismaClient({
      adapter,
      log: ['error'],
    });

    if (process.env.PRISMA_ENV === '1') {
      this.logger.log('Prisma Middleware disabled');
    }

    // Return a Proxy to delegate all calls to the prisma client
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        return (target.prisma as any)[prop];
      },
    });
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
