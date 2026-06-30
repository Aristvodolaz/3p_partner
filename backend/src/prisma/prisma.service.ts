import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: ['error', 'warn'] });
    // Lazy connection: Prisma connects on first query
    this.logger.log('PrismaService initialized (lazy connect)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
