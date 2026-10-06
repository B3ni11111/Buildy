import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

/** The subset of multer's file object we use (memory storage). */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const DOC_SELECT = {
  id: true,
  buildingId: true,
  title: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  uploadDate: true,
  uploader: { select: { id: true, name: true } },
} as const;

@Injectable()
export class DocsService {
  private readonly uploadsDir = resolve(process.env.UPLOADS_DIR ?? 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly buildingsService: BuildingsService,
  ) {}

  async list(cognitoSub: string, buildingId: string) {
    await this.buildingsService.requireMember(cognitoSub, buildingId);
    return this.prisma.doc.findMany({ where: { buildingId }, select: DOC_SELECT, orderBy: { uploadDate: 'desc' } });
  }

  async upload(cognitoSub: string, buildingId: string, file: UploadedFileData | undefined, title?: string) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('This file type is not supported');

    // Storage key is generated here — the client's file name is only kept as metadata.
    const ext = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
    const src = `${buildingId}/${randomUUID()}${ext}`;
    const path = this.pathFor(src);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, file.buffer);

    const fallbackTitle = file.originalname.replace(/\.[^.]+$/, '');
    try {
      return await this.prisma.doc.create({
        data: {
          buildingId,
          uploaderId: user.id,
          title: title?.trim() || fallbackTitle,
          src,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
        select: DOC_SELECT,
      });
    } catch (err) {
      await rm(path, { force: true });
      throw err;
    }
  }

  /** Resolves a doc the caller may read to its file on disk. */
  async file(cognitoSub: string, docId: string) {
    const doc = await this.prisma.doc.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.buildingsService.requireMember(cognitoSub, doc.buildingId);
    return { path: this.pathFor(doc.src), fileName: doc.fileName, mimeType: doc.mimeType };
  }

  async rename(cognitoSub: string, docId: string, title: string) {
    await this.requireUploaderOrAdmin(cognitoSub, docId);
    return this.prisma.doc.update({ where: { id: docId }, data: { title: title.trim() }, select: DOC_SELECT });
  }

  async remove(cognitoSub: string, docId: string) {
    const doc = await this.requireUploaderOrAdmin(cognitoSub, docId);
    await this.prisma.doc.delete({ where: { id: docId } });
    await rm(this.pathFor(doc.src), { force: true });
    return { ok: true };
  }

  /** Removes every uploaded file of a building (its DB rows go via the building's cascade delete). */
  async removeBuildingFiles(buildingId: string) {
    await rm(this.pathFor(buildingId), { recursive: true, force: true });
  }

  private async requireUploaderOrAdmin(cognitoSub: string, docId: string) {
    const doc = await this.prisma.doc.findUnique({
      where: { id: docId },
      include: { uploader: { select: { cognitoSub: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.uploader.cognitoSub !== cognitoSub) {
      const user = await this.prisma.user.findUnique({ where: { cognitoSub }, select: { isAdmin: true } });
      if (!user?.isAdmin) throw new ForbiddenException('Only the uploader or an admin can change this document');
    }
    return doc;
  }

  /** Absolute path for a storage key, refusing anything that escapes the uploads dir. */
  private pathFor(src: string) {
    const path = resolve(this.uploadsDir, src);
    if (!path.startsWith(this.uploadsDir + sep)) throw new BadRequestException('Invalid document path');
    return path;
  }
}
