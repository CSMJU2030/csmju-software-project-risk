import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
// เนเธเธฅเนเธเธตเนเน€เธเธดเธ”เธเธฒเธ `npm run prisma:generate` (เธ”เธน prisma/schema.prisma)
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.DATABASE_POOL_MAX) || 5,
      }),
    });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL is not set (see .env.example)');
    }
    try {
      await this.$connect();
      this.logger.log('Database connection OK');
    } catch (error) {
      // เนเธกเนเนเธซเนเนเธญเธเธฅเนเธกเธ•เธญเธเน€เธฃเธดเนเธก เน€เธเธทเนเธญเนเธซเนเธขเธฑเธเธ—เธ”เธชเธญเธ validation เนเธ”เน
      // request เธ—เธตเนเธ•เนเธญเธเนเธเน DB เธเธฐเธ•เธญเธ 503 (เธ”เธน ProjectsService)
      this.logger.error(`Database connection FAILED: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
