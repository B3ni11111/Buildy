import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('cities')
export class CitiesController {
  constructor(private readonly prisma: PrismaService) {}

  // ~1.3k rows (CBS settlement list) — small enough to send whole and filter client-side.
  @Get()
  list() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }
}
