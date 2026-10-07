import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService, avatarVersion } from '../users/users.service.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { actingAsResident, effectiveAdmin } from '../auth/request-context.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';
import { MyRequestDto, SetApartmentsDto, UpdateBuildingDetailsDto } from './dto/manage.dto.js';

const BUILDING_SUMMARY_SELECT = {
  id: true,
  name: true,
  address: true,
  city: { select: { id: true, name: true } },
} as const;

const APARTMENT_SELECT = {
  number: true,
  floor: true,
  sqrm: true,
  monthlyPayment: true,
  paymentMethod: true,
} as const;

/**
 * Building roles, highest first. Committee head and management company are the same
 * level ("building management"); a member's role is their highest one.
 */
export const ROLE_ORDER: UserRole[] = ['committee_head', 'management_company', 'resident'];
const MANAGEMENT_ROLES: UserRole[] = ['committee_head', 'management_company'];

// Join-password guessing limit: 5 wrong tries per user per building per 15 minutes.
// In memory — fine for a single backend instance; resets when the backend restarts.
const JOIN_MAX_FAILURES = 5;
const JOIN_WINDOW_MS = 15 * 60 * 1000;

const roleOf = (roles: { role: UserRole }[]) =>
  ROLE_ORDER[Math.min(...roles.map((r) => ROLE_ORDER.indexOf(r.role)), ROLE_ORDER.indexOf('resident'))];

@Injectable()
export class BuildingsService {
  private readonly joinFailures = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  list() {
    return this.prisma.building.findMany({ select: BUILDING_SUMMARY_SELECT, orderBy: { name: 'asc' } });
  }

  /** Every building the user belongs to, each with their own role and apartments there. */
  async mine(authUser: AuthUser) {
    const user = await this.usersService.findOrCreate(authUser);
    const memberships = await this.prisma.buildingUser.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
      select: { buildingId: true },
    });
    return Promise.all(memberships.map((m) => this.detail(m.buildingId, user.id, effectiveAdmin(user))));
  }

  /** Full view of a building for one of its members: details, their role, apartments and pending request. */
  private async detail(buildingId: string, userId: string, isAdmin: boolean) {
    const building = await this.prisma.building.findUniqueOrThrow({
      where: { id: buildingId },
      select: {
        ...BUILDING_SUMMARY_SELECT,
        description: true,
        entryCode: true,
        contactLinks: { select: { id: true, type: true, link: true }, orderBy: { id: 'asc' } },
        _count: { select: { members: true } },
        members: { where: { userId }, select: { requestedApartment: true, requestedRelation: true } },
        roles: { where: { userId }, select: { role: true } },
        apartments: {
          where: { residents: { some: { userId } } },
          orderBy: { number: 'asc' },
          select: { ...APARTMENT_SELECT, residents: { where: { userId }, select: { relationType: true } } },
        },
      },
    });
    const { _count, members, roles, apartments, ...rest } = building;
    // "View as resident" shows the lowest level everywhere.
    const role = actingAsResident() ? 'resident' : roleOf(roles);
    const request = members[0];
    return {
      ...rest,
      memberCount: _count.members,
      myRole: role,
      canManage: isAdmin || MANAGEMENT_ROLES.includes(role),
      myApartments: apartments.map(({ residents, ...apartment }) => ({
        ...apartment,
        relationType: residents[0].relationType,
      })),
      myRequest:
        request && (request.requestedApartment != null || request.requestedRelation)
          ? { apartment: request.requestedApartment, relationType: request.requestedRelation }
          : null,
    };
  }

  async join(authUser: AuthUser, dto: JoinBuildingDto) {
    const user = await this.usersService.findOrCreate(authUser);
    const building = await this.prisma.building.findUnique({ where: { id: dto.buildingId } });
    if (!building) throw new NotFoundException('Building not found');

    const blocked = await this.prisma.buildingBlock.findUnique({
      where: { buildingId_userId: { buildingId: building.id, userId: user.id } },
    });
    if (blocked) throw new ForbiddenException('You have been blocked from this building');

    const key = `${user.id}:${building.id}`;
    const failures = this.joinFailures.get(key);
    if (failures && failures.resetAt > Date.now() && failures.count >= JOIN_MAX_FAILURES) {
      throw new HttpException('Too many wrong passwords. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (!(await compare(dto.password, building.passwordHash))) {
      const current = failures && failures.resetAt > Date.now() ? failures : { count: 0, resetAt: Date.now() + JOIN_WINDOW_MS };
      this.joinFailures.set(key, { ...current, count: current.count + 1 });
      throw new UnauthorizedException('Incorrect password');
    }
    this.joinFailures.delete(key);

    // Joining adds a building (memberships in other buildings stay). The apartment and
    // owner/renter are only a suggestion until building management confirms them.
    await this.prisma.$transaction(async (tx) => {
      await tx.buildingUser.upsert({
        where: { buildingId_userId: { buildingId: building.id, userId: user.id } },
        update: {},
        create: {
          buildingId: building.id,
          userId: user.id,
          requestedApartment: dto.apartment ?? null,
          requestedRelation: dto.relationType ?? null,
        },
      });
      // Only a first-time member gets `resident` — re-joining must not add a second role
      // next to e.g. committee_head.
      const hasRole = await tx.userRoleAssignment.count({ where: { userId: user.id, buildingId: building.id } });
      if (!hasRole) {
        await tx.userRoleAssignment.create({ data: { userId: user.id, buildingId: building.id, role: 'resident' } });
      }
    });
    return this.detail(building.id, user.id, effectiveAdmin(user));
  }

  /** A member suggests (or updates) their apartment + owner/renter, e.g. from "Finish setting up". */
  async setMyRequest(authUser: AuthUser, buildingId: string, dto: MyRequestDto) {
    const user = await this.usersService.findOrCreate(authUser);
    await this.requireMembership(buildingId, user.id);
    await this.prisma.buildingUser.update({
      where: { buildingId_userId: { buildingId, userId: user.id } },
      data: { requestedApartment: dto.apartment, requestedRelation: dto.relationType },
    });
    return this.detail(buildingId, user.id, effectiveAdmin(user));
  }

  async leave(authUser: AuthUser, buildingId: string) {
    const user = await this.usersService.findOrCreate(authUser);
    await this.removeFromBuilding(buildingId, user.id);
    return { ok: true };
  }

  /** Drops a user's membership, roles and apartment links in one building. */
  async removeFromBuilding(buildingId: string, userId: string) {
    const [, , { count }] = await this.prisma.$transaction([
      this.prisma.userRoleAssignment.deleteMany({ where: { buildingId, userId } }),
      this.prisma.apartmentResident.deleteMany({ where: { userId, apartment: { buildingId } } }),
      this.prisma.buildingUser.deleteMany({ where: { buildingId, userId } }),
    ]);
    return count;
  }

  /**
   * Everyone in the building, building management first, then by apartment.
   * Phone numbers, pending requests and apartment money details only for management/admin.
   */
  async members(cognitoSub: string, buildingId: string) {
    const viewer = await this.requireMember(cognitoSub, buildingId);
    const manager = await this.isManager(viewer, buildingId);
    const rows = await this.prisma.buildingUser.findMany({
      where: { buildingId },
      select: {
        requestedApartment: true,
        requestedRelation: true,
        user: {
          select: {
            id: true,
            name: true,
            phoneNum: true,
            isAdmin: true,
            googlePicture: true,
            avatarSrc: true,
            roles: { where: { buildingId }, select: { role: true } },
            apartments: {
              where: { apartment: { buildingId } },
              select: { relationType: true, apartment: { select: APARTMENT_SELECT } },
            },
          },
        },
      },
    });
    return rows
      .map(({ user, requestedApartment, requestedRelation }) => {
        const apartments = user.apartments
          .map(({ relationType, apartment }) =>
            manager
              ? { ...apartment, relationType }
              : { number: apartment.number, floor: apartment.floor, relationType },
          )
          .sort((a, b) => a.number - b.number);
        return {
          userId: user.id,
          name: user.name,
          role: roleOf(user.roles),
          apartments,
          picture: { google: user.googlePicture, version: avatarVersion(user.avatarSrc) },
          ...(manager
            ? {
                phone: user.phoneNum,
                isAdmin: user.isAdmin,
                request:
                  requestedApartment != null || requestedRelation
                    ? { apartment: requestedApartment, relationType: requestedRelation }
                    : null,
              }
            : {}),
        };
      })
      .sort(
        (a, b) =>
          ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
          (a.apartments[0]?.number ?? Infinity) - (b.apartments[0]?.number ?? Infinity) ||
          (a.name ?? '').localeCompare(b.name ?? ''),
      );
  }

  // ---- Building management (committee head / management company of this building, or admin) ----

  /** Replaces a member's apartments in this building (technical info). Clears their join request. */
  async setApartments(cognitoSub: string, buildingId: string, userId: string, dto: SetApartmentsDto) {
    await this.requireManager(cognitoSub, buildingId);
    await this.requireMembership(buildingId, userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.apartmentResident.deleteMany({ where: { userId, apartment: { buildingId } } });
      for (const entry of dto.apartments) {
        const details = { floor: entry.floor, sqrm: entry.sqrm, paymentMethod: entry.paymentMethod };
        const apartment = await tx.apartment.upsert({
          where: { buildingId_number: { buildingId, number: entry.number } },
          // undefined = leave as is; null = clear
          update: details,
          create: { buildingId, number: entry.number, ...details },
        });
        await tx.apartmentResident.create({
          data: { apartmentId: apartment.id, userId, relationType: entry.relationType },
        });
      }
      await tx.buildingUser.update({
        where: { buildingId_userId: { buildingId, userId } },
        data: { requestedApartment: null, requestedRelation: null },
      });
    });
    return { ok: true };
  }

  /** Remove (can rejoin with the password) or block (can't rejoin until unblocked). */
  async removeMember(cognitoSub: string, buildingId: string, userId: string, block: boolean) {
    const manager = await this.requireManager(cognitoSub, buildingId);
    await this.requireCanActOn(manager, buildingId, userId);
    const removed = await this.removeFromBuilding(buildingId, userId);
    if (!removed && !block) throw new NotFoundException('Not a member of this building');
    if (block) {
      await this.prisma.buildingBlock.upsert({
        where: { buildingId_userId: { buildingId, userId } },
        update: {},
        create: { buildingId, userId, blockedById: manager.id },
      });
    }
    return { ok: true };
  }

  async listBlocks(cognitoSub: string, buildingId: string) {
    await this.requireManager(cognitoSub, buildingId);
    const blocks = await this.prisma.buildingBlock.findMany({
      where: { buildingId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        blockedBy: { select: { name: true } },
      },
    });
    return blocks.map(({ user, blockedBy, createdAt }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      blockedBy: blockedBy?.name ?? null,
      createdAt,
    }));
  }

  async unblock(cognitoSub: string, buildingId: string, userId: string) {
    await this.requireManager(cognitoSub, buildingId);
    const { count } = await this.prisma.buildingBlock.deleteMany({ where: { buildingId, userId } });
    if (!count) throw new NotFoundException('Not blocked');
    return { ok: true };
  }

  /** Description, door code and join password — name/address/city stay admin-only. */
  async updateDetails(cognitoSub: string, buildingId: string, dto: UpdateBuildingDetailsDto) {
    const manager = await this.requireManager(cognitoSub, buildingId);
    const { password, ...data } = dto;
    await this.prisma.building.update({
      where: { id: buildingId },
      data: { ...data, ...(password ? { passwordHash: await hash(password, 10) } : {}) },
    });
    const isMember = await this.prisma.buildingUser.count({ where: { buildingId, userId: manager.id } });
    return isMember ? this.detail(buildingId, manager.id, effectiveAdmin(manager)) : { ok: true };
  }

  // ---- Access checks ----

  /** Throws unless the Cognito user is a member of the building (or a global admin); returns the user. */
  async requireMember(cognitoSub: string, buildingId: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub },
      include: { memberships: { where: { buildingId }, select: { id: true } } },
    });
    if (!user || (!effectiveAdmin(user) && user.memberships.length === 0)) {
      throw new ForbiddenException('Not a member of this building');
    }
    const { memberships: _memberships, ...rest } = user;
    return rest;
  }

  /** Throws unless the user is building management here (committee head / management company) or an admin. */
  async requireManager(cognitoSub: string, buildingId: string) {
    const user = await this.prisma.user.findUnique({ where: { cognitoSub } });
    if (!user || !(await this.isManager(user, buildingId))) {
      throw new ForbiddenException('Only building management can do this');
    }
    return user;
  }

  private async isManager(user: { id: string; isAdmin: boolean }, buildingId: string) {
    if (actingAsResident()) return false;
    if (user.isAdmin) return true;
    const count = await this.prisma.userRoleAssignment.count({
      where: { userId: user.id, buildingId, role: { in: MANAGEMENT_ROLES } },
    });
    return count > 0;
  }

  private async requireMembership(buildingId: string, userId: string) {
    const member = await this.prisma.buildingUser.findUnique({ where: { buildingId_userId: { buildingId, userId } } });
    if (!member) throw new NotFoundException('Not a member of this building');
  }

  /** Building management can't remove/block themselves, admins, or other building management — only admins can. */
  private async requireCanActOn(actor: { id: string; isAdmin: boolean }, buildingId: string, userId: string) {
    if (effectiveAdmin(actor)) return;
    if (actor.id === userId) throw new ForbiddenException('Use "Leave building" instead');
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, isAdmin: true } });
    if (target && (await this.isManager(target, buildingId))) {
      throw new ForbiddenException('Only an admin can remove building management or admins');
    }
  }
}

