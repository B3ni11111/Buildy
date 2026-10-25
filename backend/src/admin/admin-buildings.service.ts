import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocsService } from '../docs/docs.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';
import { ContactLinkDto, CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto.js';
import { normalizeContactLink } from '../buildings/contact-links.js';

const ADMIN_BUILDING_SELECT = {
  id: true,
  name: true,
  address: true,
  description: true,
  entryCode: true,
  createdAt: true,
  city: { select: { id: true, name: true } },
  contactLinks: { select: { id: true, type: true, link: true }, orderBy: { id: 'asc' } },
  _count: { select: { members: true, issues: true, docs: true } },
} as const;

@Injectable()
export class AdminBuildingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docsService: DocsService,
    private readonly buildingsService: BuildingsService,
  ) {}

  /** Every building; `joined` = the calling admin is a member of it (it shows on their own home screen). */
  async list(cognitoSub: string) {
    const buildings = await this.prisma.building.findMany({
      select: { ...ADMIN_BUILDING_SELECT, members: { where: { user: { cognitoSub } }, select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return buildings.map(({ members, ...building }) => ({ ...building, joined: members.length > 0 }));
  }

  /**
   * The admin joins a building from the console with the role they pick, so it appears in their own
   * building switcher (admin powers are global either way). A block on them there is lifted.
   */
  async join(cognitoSub: string, buildingId: string, role: UserRole) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
    await this.write(() =>
      this.prisma.$transaction([
        this.prisma.buildingBlock.deleteMany({ where: { buildingId, userId: admin.id } }),
        this.prisma.buildingUser.upsert({
          where: { buildingId_userId: { buildingId, userId: admin.id } },
          update: {},
          create: { buildingId, userId: admin.id },
        }),
        this.prisma.userRoleAssignment.deleteMany({ where: { buildingId, userId: admin.id } }),
        this.prisma.userRoleAssignment.create({ data: { buildingId, userId: admin.id, role } }),
      ]),
    );
    return { ok: true };
  }

  /** Admins create buildings without becoming members (residents from the wizard are added). */
  async create(dto: CreateBuildingDto) {
    const building = await this.buildingsService.createBuilding(dto);
    return this.prisma.building.findUniqueOrThrow({ where: { id: building.id }, select: ADMIN_BUILDING_SELECT });
  }

  async update(id: string, dto: UpdateBuildingDto) {
    return this.write(() => this.prisma.building.update({ where: { id }, data: dto, select: ADMIN_BUILDING_SELECT }));
  }

  async addContactLink(buildingId: string, dto: ContactLinkDto) {
    const link = normalizeContactLink(dto);
    return this.write(() =>
      this.prisma.contactLink.create({ data: { ...link, buildingId }, select: { id: true, type: true, link: true } }),
    );
  }

  async removeContactLink(id: number) {
    const { count } = await this.prisma.contactLink.deleteMany({ where: { id } });
    if (count === 0) throw new NotFoundException('Contact link not found');
    return { ok: true };
  }

  /** Each member holds one building role; setting it replaces whatever they had. */
  async setMemberRole(buildingId: string, userId: string, role: UserRole) {
    const member = await this.prisma.buildingUser.findUnique({
      where: { buildingId_userId: { buildingId, userId } },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Not a member of this building');
    await this.prisma.$transaction([
      this.prisma.userRoleAssignment.deleteMany({ where: { buildingId, userId } }),
      this.prisma.userRoleAssignment.create({ data: { buildingId, userId, role } }),
    ]);
    return { ok: true };
  }

  async removeMember(buildingId: string, userId: string) {
    const removed = await this.buildingsService.removeFromBuilding(buildingId, userId);
    if (removed === 0) throw new NotFoundException('Not a member of this building');
    return { ok: true };
  }

  /** Cascades to memberships, roles, contact links, docs and issues — and deletes the uploaded files. */
  async remove(id: string) {
    // The cascade removes the rows holding the keys, so read them first.
    const keys = await this.docsService.buildingFileKeys(id);
    await this.write(() => this.prisma.building.delete({ where: { id } }));
    await this.docsService.removeFiles(keys);
    return { ok: true };
  }

  private write<T>(op: () => Promise<T>) {
    return this.buildingsService.write(op);
  }
}
