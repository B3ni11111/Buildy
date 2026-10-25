import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';
import { presignGet, removeUploads, saveUpload, type UploadedFileData } from '../uploads/uploads.js';
import { effectiveAdmin } from '../auth/request-context.js';

export type { UploadedFileData };
export { MAX_UPLOAD_BYTES } from '../uploads/uploads.js';

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
    const src = await saveUpload(buildingId, file);

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
      await removeUploads([src]);
      throw err;
    }
  }

  /** A short-lived link to a doc's file, for members of its building only. */
  async file(cognitoSub: string, docId: string) {
    const doc = await this.prisma.doc.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.buildingsService.requireMember(cognitoSub, doc.buildingId);
    return presignGet(doc.src, doc.mimeType);
  }

  async rename(cognitoSub: string, docId: string, title: string) {
    await this.requireUploaderOrAdmin(cognitoSub, docId);
    return this.prisma.doc.update({ where: { id: docId }, data: { title: title.trim() }, select: DOC_SELECT });
  }

  async remove(cognitoSub: string, docId: string) {
    const doc = await this.requireUploaderOrAdmin(cognitoSub, docId);
    await this.prisma.doc.delete({ where: { id: docId } });
    await removeUploads([doc.src]);
    return { ok: true };
  }

  /** Storage keys of every file in a building (docs and issue attachments). Read before the cascade delete. */
  async buildingFileKeys(buildingId: string) {
    const [docs, attachments] = await Promise.all([
      this.prisma.doc.findMany({ where: { buildingId }, select: { src: true } }),
      this.prisma.issueAttachment.findMany({ where: { issue: { buildingId } }, select: { src: true } }),
    ]);
    return [...docs, ...attachments].map((row) => row.src);
  }

  /** Deletes the given files from storage, key by key. */
  async removeFiles(keys: string[]) {
    await removeUploads(keys);
  }

  private async requireUploaderOrAdmin(cognitoSub: string, docId: string) {
    const doc = await this.prisma.doc.findUnique({
      where: { id: docId },
      include: { uploader: { select: { cognitoSub: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    // A former resident's doc (uploader null) can only be changed by an admin.
    if (doc.uploader?.cognitoSub !== cognitoSub) {
      const user = await this.prisma.user.findUnique({ where: { cognitoSub }, select: { isAdmin: true } });
      if (!effectiveAdmin(user)) throw new ForbiddenException('Only the uploader or an admin can change this document');
    }
    return doc;
  }
}
