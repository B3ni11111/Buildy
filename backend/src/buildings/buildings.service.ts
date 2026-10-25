import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService, avatarVersion } from '../users/users.service.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { effectiveAdmin, viewedRole } from '../auth/request-context.js';
import { ApartmentEntryDto, ResidentEntryDto, SetApartmentsDto, UpdateBuildingDetailsDto } from './dto/manage.dto.js';
import type { ContactLinkDto, CreateBuildingDto } from '../admin/dto/building.dto.js';
import { normalizeContactLink } from './contact-links.js';

const BUILDING_SUMMARY_SELECT = {
  id: true,
  name: true,
  address: true,
  city: { select: { id: true, name: true } },
} as const;

const APARTMENT_SELECT = {
  id: true,
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

const roleOf = (roles: { role: UserRole }[]) =>
  ROLE_ORDER[Math.min(...roles.map((r) => ROLE_ORDER.indexOf(r.role)), ROLE_ORDER.indexOf('resident'))];

@Injectable()
export class BuildingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /** Every building the user belongs to, each with their own role and apartments there. */
  async mine(authUser: AuthUser) {
    const user = await this.usersService.findOrCreate(authUser);
    const memberships = await this.prisma.buildingUser.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
      select: { buildingId: true },
    });
    return Promise.all(memberships.map((m) => this.detail(m.buildingId, user)));
  }

  /** Full view of a building for one of its members: details, their role and apartments. */
  private async detail(buildingId: string, viewer: { id: string; isAdmin: boolean }) {
    const userId = viewer.id;
    const isAdmin = effectiveAdmin(viewer);
    const building = await this.prisma.building.findUniqueOrThrow({
      where: { id: buildingId },
      select: {
        ...BUILDING_SUMMARY_SELECT,
        description: true,
        entryCode: true,
        contactLinks: { select: { id: true, type: true, link: true }, orderBy: { id: 'asc' } },
        _count: { select: { members: true } },
        roles: { where: { userId }, select: { role: true } },
        apartments: {
          where: { residents: { some: { userId } } },
          orderBy: { number: 'asc' },
          select: { ...APARTMENT_SELECT, residents: { where: { userId }, select: { relationType: true } } },
        },
      },
    });
    const { _count, roles, apartments, ...rest } = building;
    // An admin previewing a role ("view as") gets that role in every building.
    const role = viewedRole(viewer) ?? roleOf(roles);
    return {
      ...rest,
      memberCount: _count.members,
      myRole: role,
      canManage: isAdmin || MANAGEMENT_ROLES.includes(role),
      myApartments: apartments.map(({ residents, ...apartment }) => ({
        ...apartment,
        relationType: residents[0].relationType,
      })),
    };
  }

  /**
   * Creates a building with its contact links and, optionally, its first residents.
   * `creator` (when given) becomes a member with a management role — any user may create
   * a building, but nobody gets in unless its management adds them.
   */
  async createBuilding(
    dto: CreateBuildingDto,
    creator?: { userId: string; role: 'committee_head' | 'management_company' },
  ) {
    const { contactLinks = [], residents = [], payments, ...data } = dto;
    const links = contactLinks.map(normalizeContactLink);
    if (creator && residents.some((r) => r.userId === creator.userId)) {
      throw new BadRequestException('You are added as building management — remove yourself from the residents');
    }
    return this.write(() =>
      this.prisma.$transaction(async (tx) => {
        const building = await tx.building.create({ data: { ...data, contactLinks: { create: links } } });
        if (creator) {
          await tx.buildingUser.create({ data: { buildingId: building.id, userId: creator.userId } });
          await tx.userRoleAssignment.create({
            data: { buildingId: building.id, userId: creator.userId, role: creator.role },
          });
        }
        await this.insertResidents(tx, building.id, residents);
        // The wizard's payments step (apartments without their own fee follow its default fee).
        if (payments) await tx.buildingPaymentSettings.create({ data: { buildingId: building.id, ...payments } });
        return building;
      }),
    );
  }

  /** "Create a building" for any signed-in user: they become its committee head or management company. */
  async createAsMember(authUser: AuthUser, dto: CreateBuildingDto, role: 'committee_head' | 'management_company') {
    const user = await this.usersService.findOrCreate(authUser);
    const building = await this.createBuilding(dto, { userId: user.id, role });
    return this.detail(building.id, user);
  }

  /**
   * Name and picture for each pasted user ID, so management can check who they're adding.
   * With a building (management only) each user is also flagged as already a member or blocked.
   * Unknown IDs are simply missing from the result.
   */
  async previewUsers(authUser: AuthUser, ids: string[], buildingId?: string) {
    const viewer = await this.usersService.findOrCreate(authUser);
    if (buildingId) await this.requireManager(authUser.cognitoSub, buildingId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: {
        id: true,
        name: true,
        googlePicture: true,
        avatarSrc: true,
        ...(buildingId
          ? {
              memberships: { where: { buildingId }, select: { id: true } },
              blocks: { where: { buildingId }, select: { id: true } },
            }
          : {}),
      },
    });
    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      picture: { google: u.googlePicture, version: avatarVersion(u.avatarSrc) },
      isMe: u.id === viewer.id,
      alreadyMember: !!u.memberships?.length,
      blocked: !!u.blocks?.length,
    }));
  }

  /** Building management adds residents by their user IDs, each with their apartments — all or nothing. */
  async addMembers(cognitoSub: string, buildingId: string, residents: ResidentEntryDto[]) {
    await this.requireManager(cognitoSub, buildingId);
    await this.prisma.$transaction((tx) => this.insertResidents(tx, buildingId, residents));
    return { ok: true, added: residents.length };
  }

  /** Adds new members as residents with their apartments. Refuses unknown, duplicate, existing or blocked users. */
  private async insertResidents(tx: Prisma.TransactionClient, buildingId: string, residents: ResidentEntryDto[]) {
    if (!residents.length) return;
    const ids = residents.map((r) => r.userId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('The same person is listed twice');

    const found = await tx.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const unknown = ids.filter((id) => !found.some((u) => u.id === id));
    if (unknown.length) throw new NotFoundException({ message: 'Unknown user IDs', userIds: unknown });

    const members = await tx.buildingUser.findMany({ where: { buildingId, userId: { in: ids } }, select: { userId: true } });
    if (members.length) {
      throw new ConflictException({ message: 'Already members of this building', userIds: members.map((m) => m.userId) });
    }
    const blocked = await tx.buildingBlock.findMany({ where: { buildingId, userId: { in: ids } }, select: { userId: true } });
    if (blocked.length) {
      throw new ForbiddenException({ message: 'Blocked from this building — unblock first', userIds: blocked.map((b) => b.userId) });
    }

    for (const { userId, apartments } of residents) {
      await tx.buildingUser.create({ data: { buildingId, userId } });
      await tx.userRoleAssignment.create({ data: { buildingId, userId, role: 'resident' } });
      await this.writeApartments(tx, buildingId, userId, apartments);
    }
  }

  /** Links a member to these apartments (creating or updating each apartment's details). */
  private async writeApartments(
    tx: Prisma.TransactionClient,
    buildingId: string,
    userId: string,
    apartments: ApartmentEntryDto[],
    linkedAt = new Map<number, Date>(),
  ) {
    for (const entry of apartments) {
      const details = { floor: entry.floor, sqrm: entry.sqrm, paymentMethod: entry.paymentMethod };
      const apartment = await tx.apartment.upsert({
        where: { buildingId_number: { buildingId, number: entry.number } },
        // undefined = leave as is; null = clear
        update: details,
        create: { buildingId, number: entry.number, ...details },
      });
      await tx.apartmentResident.create({
        data: { apartmentId: apartment.id, userId, relationType: entry.relationType, linkedAt: linkedAt.get(entry.number) },
      });
    }
  }

  /** Maps Prisma's constraint errors to HTTP errors the UI can show. */
  async write<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') throw new ConflictException('A building with this address already exists in this city');
        if (err.code === 'P2003') throw new BadRequestException('Unknown city');
        if (err.code === 'P2025') throw new NotFoundException('Building not found');
      }
      throw err;
    }
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
      .map(({ user }) => {
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
          ...(manager ? { phone: user.phoneNum, isAdmin: user.isAdmin } : {}),
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

  /** Replaces a member's apartments in this building (technical info). */
  async setApartments(cognitoSub: string, buildingId: string, userId: string, dto: SetApartmentsDto) {
    await this.requireManager(cognitoSub, buildingId);
    await this.requireMembership(buildingId, userId);
    await this.prisma.$transaction(async (tx) => {
      // Apartments they keep keep their link date, so they don't lose their own payment history.
      const existing = await tx.apartmentResident.findMany({
        where: { userId, apartment: { buildingId } },
        select: { linkedAt: true, apartment: { select: { number: true } } },
      });
      const linkedAt = new Map(existing.map((link) => [link.apartment.number, link.linkedAt]));
      await tx.apartmentResident.deleteMany({ where: { userId, apartment: { buildingId } } });
      await this.writeApartments(tx, buildingId, userId, dto.apartments, linkedAt);
    });
    return { ok: true };
  }

  /** Remove (management can add them again) or block (can't be added again until unblocked). */
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

  /** Description and door code — name/address/city stay admin-only. */
  async updateDetails(cognitoSub: string, buildingId: string, dto: UpdateBuildingDetailsDto) {
    const manager = await this.requireManager(cognitoSub, buildingId);
    await this.prisma.building.update({ where: { id: buildingId }, data: dto });
    const isMember = await this.prisma.buildingUser.count({ where: { buildingId, userId: manager.id } });
    return isMember ? this.detail(buildingId, manager) : { ok: true };
  }

  /** Building management adds a contact link (WhatsApp group, phone, email) to their building. */
  async addContactLink(cognitoSub: string, buildingId: string, dto: ContactLinkDto) {
    await this.requireManager(cognitoSub, buildingId);
    return this.prisma.contactLink.create({
      data: { ...normalizeContactLink(dto), buildingId },
      select: { id: true, type: true, link: true },
    });
  }

  /** Only links of this building — a manager can't delete another building's link by id. */
  async removeContactLink(cognitoSub: string, buildingId: string, linkId: number) {
    await this.requireManager(cognitoSub, buildingId);
    const { count } = await this.prisma.contactLink.deleteMany({ where: { id: linkId, buildingId } });
    if (count === 0) throw new NotFoundException('Contact link not found');
    return { ok: true };
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

  /**
   * `asRequester`: `user` is the one making this request, so a previewed role ("view as") applies.
   * Pass false when checking someone else (e.g. the target of a removal) — their real role counts.
   */
  private async isManager(user: { id: string; isAdmin: boolean }, buildingId: string, asRequester = true) {
    const viewed = asRequester ? viewedRole(user) : null;
    if (viewed) return MANAGEMENT_ROLES.includes(viewed);
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
    if (target && (await this.isManager(target, buildingId, false))) {
      throw new ForbiddenException('Only an admin can remove building management or admins');
    }
  }
}

