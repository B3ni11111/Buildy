import { readFileSync } from 'node:fs';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // On AWS, DB_SSL_CA points at the RDS CA bundle (RDS forces SSL). Locally it is unset.
    // DB_POOL_MAX keeps each Lambda to a few connections so a small RDS isn't exhausted.
    const caPath = process.env.DB_SSL_CA;
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ...(caPath ? { ssl: { ca: readFileSync(caPath, 'utf8') } } : {}),
      ...(process.env.DB_POOL_MAX ? { max: Number(process.env.DB_POOL_MAX) } : {}),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
