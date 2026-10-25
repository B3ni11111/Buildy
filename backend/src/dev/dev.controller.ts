import { Controller, Get, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../auth/public.decorator.js';
import { DEV_SUB_PREFIX, devLoginEnabled } from '../auth/dev-login.js';

/** Dev only (`DEV_LOGIN=true`): the mock users the sign-in page offers, with their roles — 404 otherwise. */
@Controller('dev')
export class DevController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('users')
  async users() {
    if (!devLoginEnabled()) throw new NotFoundException();
    const users = await this.prisma.user.findMany({
      where: { cognitoSub: { startsWith: DEV_SUB_PREFIX } },
      include: {
        roles: { include: { building: { select: { name: true } } } },
        apartments: { include: { apartment: { select: { number: true, building: { select: { name: true } } } } } },
      },
    });
    // mock-user-2 before mock-user-10
    users.sort((a, b) => Number(a.cognitoSub.slice(DEV_SUB_PREFIX.length)) - Number(b.cognitoSub.slice(DEV_SUB_PREFIX.length)));
    return users.map((u) => ({
      sub: u.cognitoSub,
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      roles: u.roles.map((r) => ({ building: r.building.name, role: r.role })),
      apartments: u.apartments.map((a) => ({ building: a.apartment.building.name, number: a.apartment.number, relationType: a.relationType })),
    }));
  }
}
