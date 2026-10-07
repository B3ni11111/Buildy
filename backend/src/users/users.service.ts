import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateOnboardingDto, UpdateProfileDto } from './dto/update-onboarding.dto.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { uploadPath, type UploadedFileData } from '../uploads/uploads.js';
import { effectiveAdmin } from '../auth/request-context.js';

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** Changes whenever a new picture is uploaded, so clients know to refetch it. */
export function avatarVersion(avatarSrc: string | null) {
  return avatarSrc ? (avatarSrc.split('/').pop() ?? null) : null;
}

/** What the frontend gets for the signed-in user (no Cognito ids or file paths). */
export function toCurrentUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phoneNum,
    isAdmin: user.isAdmin,
    language: user.language,
    picture: { google: user.googlePicture, version: avatarVersion(user.avatarSrc) },
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's row, created on first sign-in; keeps the Google photo URL current. */
  async findOrCreate(authUser: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { cognitoSub: authUser.cognitoSub } });
    if (existing) {
      if (authUser.picture && authUser.picture !== existing.googlePicture) {
        return this.prisma.user.update({ where: { id: existing.id }, data: { googlePicture: authUser.picture } });
      }
      return existing;
    }
    return this.prisma.user.upsert({
      where: { cognitoSub: authUser.cognitoSub },
      update: {},
      create: {
        cognitoSub: authUser.cognitoSub,
        email: authUser.email,
        name: authUser.name,
        googlePicture: authUser.picture,
      },
    });
  }

  async updateOnboarding(authUser: AuthUser, dto: UpdateOnboardingDto) {
    const user = await this.findOrCreate(authUser);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { name: dto.name, language: dto.language, onboardedAt: user.onboardedAt ?? new Date() },
    });
  }

  async updateProfile(authUser: AuthUser, dto: UpdateProfileDto) {
    const user = await this.findOrCreate(authUser);
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phoneNum: dto.phone.trim() || null } : {}),
      },
    });
  }

  async setAvatar(authUser: AuthUser, file: UploadedFileData | undefined) {
    const user = await this.findOrCreate(authUser);
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = AVATAR_TYPES[file.mimetype];
    if (!ext) throw new BadRequestException('Profile pictures must be PNG, JPEG, WebP or GIF');
    // New file name per upload, so clients see a new version and refetch.
    const key = `avatars/${user.id}-${randomUUID()}${ext}`;
    const path = uploadPath(key);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, file.buffer);
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { avatarSrc: key } });
    if (user.avatarSrc) await rm(uploadPath(user.avatarSrc), { force: true });
    return updated;
  }

  async removeAvatar(authUser: AuthUser) {
    const user = await this.findOrCreate(authUser);
    if (user.avatarSrc) await rm(uploadPath(user.avatarSrc), { force: true });
    return this.prisma.user.update({ where: { id: user.id }, data: { avatarSrc: null } });
  }

  /** A user's uploaded picture — for themselves, admins, or people sharing a building with them. */
  async avatarFile(authUser: AuthUser, userId: string) {
    const viewer = await this.findOrCreate(authUser);
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, avatarSrc: true } });
    if (!target?.avatarSrc) throw new NotFoundException('No profile picture');
    if (viewer.id !== target.id && !effectiveAdmin(viewer)) {
      const shared = await this.prisma.buildingUser.count({
        where: { userId: target.id, building: { members: { some: { userId: viewer.id } } } },
      });
      if (!shared) throw new ForbiddenException('Not allowed');
    }
    const ext = target.avatarSrc.slice(target.avatarSrc.lastIndexOf('.'));
    const mimeType = Object.keys(AVATAR_TYPES).find((type) => AVATAR_TYPES[type] === ext) ?? 'application/octet-stream';
    return { path: uploadPath(target.avatarSrc), mimeType };
  }

  /**
   * Deletes the account: personal data, memberships, roles, apartment links and the picture.
   * Their messages and documents stay, with the author set to null ("Former resident").
   * The Cognito login itself remains; signing in again starts a fresh, empty account.
   */
  async deleteAccount(authUser: AuthUser) {
    const user = await this.findOrCreate(authUser);
    await this.prisma.user.delete({ where: { id: user.id } });
    if (user.avatarSrc) await rm(uploadPath(user.avatarSrc), { force: true });
    return { ok: true };
  }
}
