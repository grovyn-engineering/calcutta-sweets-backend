import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { Prisma } from '@calcutta/database';
import { PrismaClient } from '@calcutta/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function prismaLogLevels(): Prisma.LogLevel[] {
  if (process.env.NODE_ENV !== 'development') {
    return [];
  }
  if (process.env.PRISMA_LOG_QUERIES === '1') {
    return ['query', 'warn', 'error'];
  }
  return ['warn', 'error'];
}

/** Shared pool: reuse TCP connections to Postgres instead of opening one per query burst. */
function createPgPool(): Pool {
  const max = Math.min(
    50,
    Math.max(2, parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10) || 10),
  );
  const idleTimeoutMillis = parseInt(
    process.env.DATABASE_POOL_IDLE_MS ?? '30000',
    10,
  );
  const connectionTimeoutMillis = parseInt(
    process.env.DATABASE_CONNECT_TIMEOUT_MS ?? '10000',
    10,
  );
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max,
    idleTimeoutMillis: Number.isFinite(idleTimeoutMillis)
      ? idleTimeoutMillis
      : 30000,
    connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis)
      ? connectionTimeoutMillis
      : 10000,
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = createPgPool();
    super({
      adapter: new PrismaPg(pool),
      log: prismaLogLevels(),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Verify DB connection - useful for health checks */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
