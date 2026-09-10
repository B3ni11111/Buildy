import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';

const BUILDING_SUMMARY_SELECT = { id: true, name: true, address: true } as const;

@Injectable()
export class BuildingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  list() {
    return this.prisma.building.findMany({ select: BUILDING_SUMMARY_SELECT });
  }

  async me(authUser: AuthUser) {
    const user = await this.usersService.findOrCreate(authUser);
    if (!user.currentBuildingId) return null;
    return this.prisma.building.findUnique({
      where: { id: user.currentBuildingId },
      select: BUILDING_SUMMARY_SELECT,
    });
  }

  async join(authUser: AuthUser, dto: JoinBuildingDto) {
    const user = await this.usersService.findOrCreate(authUser);
    const building = await this.prisma.building.findUnique({ where: { id: dto.buildingId } });
    if (!building) throw new NotFoundException('Building not found');

    const passwordMatches = await compare(dto.password, building.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Incorrect password');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { currentBuildingId: building.id },
    });

    return { id: building.id, name: building.name, address: building.address };
  }

  async leave(authUser: AuthUser) {
    const user = await this.usersService.findOrCreate(authUser);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { currentBuildingId: null },
    });
    return { ok: true };
  }
}
