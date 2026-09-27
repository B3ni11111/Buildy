import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';
import { UpdateMembershipDto } from './dto/update-membership.dto.js';

const BUILDING_SUMMARY_SELECT = {
  id: true,
  name: true,
  address: true,
  city: { select: { id: true, name: true } },
} as const;

const MEMBERSHIP_SELECT = {
  apartment: true,
  floor: true,
  relationType: true,
  sqrm: true,
  monthlyPayment: true,
  paymentMethod: true,
} as const;

const RELATION_TYPES = ['owner', 'tenant'] as const;

/** Display order of building roles — committee first. A member's role is their highest one. */
export const ROLE_ORDER: UserRole[] = ['committee_head', 'committee_member', 'manager', 'resident'];

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
    const membership = await this.prisma.buildingUser.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      select: { buildingId: true },
    });
    return membership ? this.detail(membership.buildingId, user.id) : null;
  }

  /** Full view of a building for one of its members, including their own unit. */
  private async detail(buildingId: string, userId: string) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: { id: buildingId },
      select: {
        ...BUILDING_SUMMARY_SELECT,
        description: true,
        entryCode: true,
        contactLinks: { select: { id: true, type: true, link: true }, orderBy: { id: 'asc' } },
        _count: { select: { members: true } },
        members: { where: { userId }, select: MEMBERSHIP_SELECT },
      },
    });
    const { _count, members, ...rest } = building;
    return { ...rest, memberCount: _count.members, membership: members[0] ?? null };
  }

  async updateMembership(authUser: AuthUser, dto: UpdateMembershipDto) {
    const user = await this.usersService.findOrCreate(authUser);
    const membership = await this.prisma.buildingUser.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      select: { id: true, buildingId: true },
    });
    if (!membership) throw new NotFoundException('Not a member of any building');
    await this.prisma.buildingUser.update({ where: { id: membership.id }, data: dto });
    return this.detail(membership.buildingId, user.id);
  }

  async join(authUser: AuthUser, dto: JoinBuildingDto) {
    const user = await this.usersService.findOrCreate(authUser);
    const building = await this.prisma.building.findUnique({ where: { id: dto.buildingId } });
    if (!building) throw new NotFoundException('Building not found');

    const passwordMatches = await compare(dto.password, building.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Incorrect password');

    const relationType = RELATION_TYPES.find((t) => t === user.userType);

    // One active building per user (for now): joining replaces any previous membership.
    await this.prisma.$transaction([
      this.prisma.buildingUser.deleteMany({ where: { userId: user.id, buildingId: { not: building.id } } }),
      this.prisma.userRoleAssignment.deleteMany({ where: { userId: user.id, buildingId: { not: building.id } } }),
      this.prisma.buildingUser.upsert({
        where: { buildingId_userId: { buildingId: building.id, userId: user.id } },
        update: {},
        create: { buildingId: building.id, userId: user.id, relationType },
      }),
      this.prisma.userRoleAssignment.upsert({
        where: { userId_buildingId_role: { userId: user.id, buildingId: building.id, role: 'resident' } },
        update: {},
        create: { userId: user.id, buildingId: building.id, role: 'resident' },
      }),
    ]);

    return this.detail(building.id, user.id);
  }

  async leave(authUser: AuthUser) {
    const user = await this.usersService.findOrCreate(authUser);
    await this.prisma.$transaction([
      this.prisma.buildingUser.deleteMany({ where: { userId: user.id } }),
      this.prisma.userRoleAssignment.deleteMany({ where: { userId: user.id } }),
    ]);
    return { ok: true };
  }

  /** Everyone in the building with their unit and role, committee first, then by apartment. */
  async members(cognitoSub: string, buildingId: string) {
    await this.requireMember(cognitoSub, buildingId);
    const rows = await this.prisma.buildingUser.findMany({
      where: { buildingId },
      select: {
        apartment: true,
        floor: true,
        relationType: true,
        user: {
          select: {
            id: true,
            name: true,
            roles: { where: { buildingId }, select: { role: true } },
          },
        },
      },
    });
    const rank = (roles: { role: UserRole }[]) =>
      Math.min(...roles.map((r) => ROLE_ORDER.indexOf(r.role)), ROLE_ORDER.indexOf('resident'));
    return rows
      .map(({ user, ...unit }) => ({
        userId: user.id,
        name: user.name,
        role: ROLE_ORDER[rank(user.roles)],
        ...unit,
      }))
      .sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
          (a.apartment ?? Infinity) - (b.apartment ?? Infinity) ||
          (a.name ?? '').localeCompare(b.name ?? ''),
      );
  }

  /** Throws unless the Cognito user is a member of the building (or a global admin); returns the user. */
  async requireMember(cognitoSub: string, buildingId: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
      include: { memberships: { where: { buildingId }, select: { id: true } } },
    });
    if (!user || (!user.isAdmin && user.memberships.length === 0)) {
      throw new ForbiddenException('Not a member of this building');
    }
    const { memberships: _memberships, ...rest } = user;
    return rest;
  }
}
