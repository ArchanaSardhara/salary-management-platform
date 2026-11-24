import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import type { EnvConfig } from '../../config/env.schema';

/**
 * Thin wrapper around the generated Prisma client, exposed as an injectable
 * provider so every module reaches PostgreSQL the same way (see
 * docs/backend-architecture.md §2 — PrismaModule is the only module that
 * touches Postgres directly).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<EnvConfig, true>) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL', {
        infer: true,
      }),
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }
}
