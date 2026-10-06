import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocsService } from '../docs/docs.service.js';
import { ContactLinkDto, CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto.js';

const ADMIN_BUILDING_SELECT = {
  id: true,
  name: true,
  address: true,
  description: true,
  entryCode: true,
  createdAt: true,
  city: { select: { id: true, name: true } },
  contactLinks: { select: { id: true, type: true, link: true }, orderBy: { id: 'asc' } },
  _count: { select: { members: true, messages: true, docs: true } },
} as const;

/** Validates a contact link for its type and returns the cleaned value. */
function normalizeContactLink({ type, link }: ContactLinkDto): ContactLinkDto {
  const value = link.trim();
  if (type === 'whatsapp') {
    let url: URL | null = null;
    try {
      url = new URL(value);
    } catch {
      // not a URL — rejected below
    }
    if (url?.protocol !== 'https:') throw new BadRequestException('WhatsApp link must be an https:// invite link');
  } else if (type === 'phone') {
    if (!/^\+?[\d\s\-()]{6,20}$/.test(value)) throw new BadRequestException('Invalid phone number');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new BadRequestException('Invalid email address');
  }
  return { type, link: value };
}

@Injectable()
export class AdminBuildingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docsService: DocsService,
  ) {}

  list() {
    return this.prisma.building.findMany({ select: ADMIN_BUILDING_SELECT, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateBuildingDto) {
    const { password, contactLinks = [], ...data } = dto;
    const links = contactLinks.map(normalizeContactLink);
    return this.write(async () =>
      this.prisma.building.create({
        data: { ...data, passwordHash: await hash(password, 10), contactLinks: { create: links } },
        select: ADMIN_BUILDING_SELECT,
      }),
    );
  }

  async update(id: string, dto: UpdateBuildingDto) {
    const { password, ...data } = dto;
    return this.write(async () =>
      this.prisma.building.update({
        where: { id },
        data: { ...data, ...(password ? { passwordHash: await hash(password, 10) } : {}) },
        select: ADMIN_BUILDING_SELECT,
      }),
    );
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
    const [, { count }] = await this.prisma.$transaction([
      this.prisma.userRoleAssignment.deleteMany({ where: { buildingId, userId } }),
      this.prisma.buildingUser.deleteMany({ where: { buildingId, userId } }),
    ]);
    if (count === 0) throw new NotFoundException('Not a member of this building');
    return { ok: true };
  }

  /** Cascades to memberships, roles, contact links, docs and messages — and deletes the uploaded files. */
  async remove(id: string) {
    await this.write(() => this.prisma.building.delete({ where: { id } }));
    await this.docsService.removeBuildingFiles(id);
    return { ok: true };
  }

  /** Maps Prisma's constraint errors to HTTP errors the UI can show. */
  private async write<T>(op: () => Promise<T>): Promise<T> {
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
}
