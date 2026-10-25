import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IssueStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';
import { effectiveAdmin } from '../auth/request-context.js';
import { assertAllowedFile, presignGet, removeUploads, saveUpload, type UploadedFileData } from '../uploads/uploads.js';
import { AddIssueUpdateDto, ChangeIssueStatusDto, CreateIssueDto, UpdateIssueDto } from './issues.dto.js';

export const MAX_ISSUE_FILES = 10;
/** The author may ping an issue once a week; it bumps the issue back up the list. */
export const PING_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
/** Statuses that still need building management's attention. */
const ACTIVE: IssueStatus[] = ['opened', 'in_process'];
/**
 * The only status changes: an opened issue is accepted (in process) or denied; an issue in process
 * is resolved. Denied and resolved are final — nothing about them can change any more.
 */
const TRANSITIONS: Partial<Record<IssueStatus, IssueStatus[]>> = {
  opened: ['in_process', 'denied'],
  in_process: ['resolved'],
};

/**
 * After posting an update or resolving, its author can take it back for this long. Undoing puts the
 * note and files back in the form as a draft; the draft is dropped once the same time has passed again.
 */
export const UNDO_WINDOW_MS = 5 * 60 * 1000;

const PERSON = { select: { id: true, name: true } } as const;
const ATTACHMENT_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploader: PERSON,
} as const;

const LIST_SELECT = {
  id: true,
  buildingId: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  statusChangedAt: true,
  lastPingedAt: true,
  author: PERSON,
  // The first few pictures of the report, so the list can show small previews (DETAIL_SELECT lists them all).
  attachments: {
    where: { updateId: null, mimeType: { startsWith: 'image/' } },
    take: 3,
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileName: true, mimeType: true },
  },
  _count: { select: { attachments: true, updates: { where: { undoneAt: null } } } },
} as const;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  // Files of the original report; status-change files sit under their update.
  attachments: { where: { updateId: null }, select: ATTACHMENT_SELECT, orderBy: { createdAt: 'asc' } },
  updates: {
    where: { undoneAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      text: true,
      createdAt: true,
      author: PERSON,
      attachments: { select: ATTACHMENT_SELECT, orderBy: { createdAt: 'asc' } },
    },
  },
} as const satisfies Prisma.IssueSelect;

type StoredFile = { src: string; fileName: string; mimeType: string; sizeBytes: number };

/** When this issue was last put forward: its last ping, or when it was opened. */
const bumpedAt = (issue: { createdAt: Date; lastPingedAt: Date | null }) => issue.lastPingedAt ?? issue.createdAt;

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buildingsService: BuildingsService,
  ) {}

  /** Adds `pingedRecently` and, for the author of an active issue, when they may ping next. */
  private withPing<T extends { status: IssueStatus; createdAt: Date; lastPingedAt: Date | null; author: { id: string } | null }>(
    issue: T,
    viewerId: string,
  ) {
    const canPingAt =
      issue.author?.id === viewerId && ACTIVE.includes(issue.status)
        ? new Date(bumpedAt(issue).getTime() + PING_INTERVAL_MS)
        : null;
    return {
      ...issue,
      pingedRecently: !!issue.lastPingedAt && Date.now() - issue.lastPingedAt.getTime() < PING_INTERVAL_MS,
      canPingAt,
    };
  }

  /** Issues still needing attention first, then by last ping / opening, newest first. */
  async list(cognitoSub: string, buildingId: string, status?: IssueStatus) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    await this.purgeExpiredDrafts({ issue: { buildingId } });
    const issues = await this.prisma.issue.findMany({
      where: { buildingId, ...(status ? { status } : {}) },
      select: LIST_SELECT,
    });
    return issues
      .sort(
        (a, b) =>
          Number(ACTIVE.includes(b.status)) - Number(ACTIVE.includes(a.status)) ||
          bumpedAt(b).getTime() - bumpedAt(a).getTime(),
      )
      .map((issue) => this.withPing(issue, user.id));
  }

  async get(cognitoSub: string, issueId: string) {
    await this.purgeExpiredDrafts({ issueId });
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId }, select: DETAIL_SELECT });
    if (!issue) throw new NotFoundException('Issue not found');
    const user = await this.buildingsService.requireMember(cognitoSub, issue.buildingId);

    // Only the newest update can be taken back, and only by its author, inside the window.
    const last = issue.updates[issue.updates.length - 1];
    const undoable =
      last &&
      last.author?.id === user.id &&
      Date.now() - last.createdAt.getTime() < UNDO_WINDOW_MS &&
      (last.fromStatus === last.toStatus || (last.fromStatus === 'in_process' && last.toStatus === 'resolved'));
    const updates = issue.updates.map((update) => ({
      ...update,
      undoableUntil: undoable && update.id === last.id ? new Date(update.createdAt.getTime() + UNDO_WINDOW_MS) : null,
    }));

    // The viewer's own undone note and files, back in their form.
    const draft = await this.prisma.issueUpdate.findFirst({
      where: { issueId, authorId: user.id, undoneAt: { not: null } },
      orderBy: { undoneAt: 'desc' },
      select: {
        text: true,
        fromStatus: true,
        toStatus: true,
        undoneAt: true,
        attachments: { select: ATTACHMENT_SELECT, orderBy: { createdAt: 'asc' } },
      },
    });

    return { ...this.withPing(issue, user.id), updates, draft };
  }

  async create(cognitoSub: string, buildingId: string, dto: CreateIssueDto, files: UploadedFileData[] = []) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('A title is required');
    files.forEach(assertAllowedFile);
    const id = await this.withFiles(buildingId, files, async (stored) => {
      const issue = await this.prisma.issue.create({
        data: {
          buildingId,
          authorId: user.id,
          title,
          description: dto.description?.trim() || null,
          attachments: { create: stored.map((file) => ({ ...file, uploaderId: user.id })) },
        },
        select: { id: true },
      });
      return issue.id;
    });
    return this.get(cognitoSub, id);
  }

  /** The author edits their issue while it's still `opened`; admins any time. */
  async update(cognitoSub: string, issueId: string, dto: UpdateIssueDto) {
    const issue = await this.requireAuthorWhileOpen(cognitoSub, issueId);
    if (!ACTIVE.includes(issue.status)) throw new ForbiddenException('This issue is closed');
    await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });
    return this.get(cognitoSub, issueId);
  }

  async remove(cognitoSub: string, issueId: string) {
    await this.requireAuthorWhileOpen(cognitoSub, issueId);
    const attachments = await this.prisma.issueAttachment.findMany({ where: { issueId }, select: { src: true } });
    await this.prisma.issue.delete({ where: { id: issueId } });
    await removeUploads(attachments.map((a) => a.src));
    return { ok: true };
  }

  /** Building management moves the issue to another status, with a required note and optional files. */
  async changeStatus(cognitoSub: string, issueId: string, dto: ChangeIssueStatusDto, files: UploadedFileData[] = []) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId }, select: { buildingId: true, status: true } });
    if (!issue) throw new NotFoundException('Issue not found');
    const manager = await this.buildingsService.requireManager(cognitoSub, issue.buildingId);
    if (!TRANSITIONS[issue.status]?.includes(dto.status)) {
      throw new BadRequestException("This issue can't be moved to that status");
    }
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('A note is required when changing the status');
    files.forEach(assertAllowedFile);

    await this.withFiles(issue.buildingId, files, (stored) =>
      this.prisma.$transaction(async (tx) => {
        await tx.issue.update({ where: { id: issueId }, data: { status: dto.status, statusChangedAt: new Date() } });
        await tx.issueUpdate.create({
          data: {
            issueId,
            authorId: manager.id,
            fromStatus: issue.status,
            toStatus: dto.status,
            text,
            attachments: { create: stored.map((file) => ({ ...file, issueId, uploaderId: manager.id })) },
          },
        });
      }),
    );
    await this.discardDrafts(issueId, manager.id);
    return this.get(cognitoSub, issueId);
  }

  /**
   * More text and/or files on an issue that is in process, by building management or the author.
   * Kept in the history as an update without a status change.
   */
  async addUpdate(cognitoSub: string, issueId: string, dto: AddIssueUpdateDto, files: UploadedFileData[] = []) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { buildingId: true, status: true, author: { select: { id: true } } },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    const user = await this.buildingsService.requireMember(cognitoSub, issue.buildingId);
    const isAuthor = issue.author?.id === user.id;
    if (!isAuthor) await this.buildingsService.requireManager(cognitoSub, issue.buildingId);
    if (issue.status !== 'in_process') throw new BadRequestException('Updates can only be added while the issue is in process');
    const text = dto.text?.trim() ?? '';
    if (!text && files.length === 0) throw new BadRequestException('Add a message or a file');
    files.forEach(assertAllowedFile);

    await this.withFiles(issue.buildingId, files, (stored) =>
      this.prisma.issueUpdate.create({
        data: {
          issueId,
          authorId: user.id,
          fromStatus: 'in_process',
          toStatus: 'in_process',
          text,
          attachments: { create: stored.map((file) => ({ ...file, issueId, uploaderId: user.id })) },
        },
      }),
    );
    await this.discardDrafts(issueId, user.id);
    return this.get(cognitoSub, issueId);
  }

  /**
   * Takes back the newest update (or a resolve) within the undo window. The issue goes back to how it
   * was, and the note and files come back to its author as an editable draft (see `get`).
   * Accepting and denying are final and can't be undone.
   */
  async undo(cognitoSub: string, issueId: string, updateId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId }, select: { buildingId: true } });
    if (!issue) throw new NotFoundException('Issue not found');
    const user = await this.buildingsService.requireMember(cognitoSub, issue.buildingId);
    const update = await this.prisma.issueUpdate.findUnique({
      where: { id: updateId },
      select: { issueId: true, authorId: true, fromStatus: true, toStatus: true, createdAt: true, undoneAt: true },
    });
    if (!update || update.issueId !== issueId || update.undoneAt) throw new NotFoundException('Update not found');
    if (update.authorId !== user.id) throw new ForbiddenException('Only the author of an update can undo it');
    if (Date.now() - update.createdAt.getTime() >= UNDO_WINDOW_MS) throw new BadRequestException('The undo window has passed');
    const statusChange = update.fromStatus !== update.toStatus;
    if (statusChange && !(update.fromStatus === 'in_process' && update.toStatus === 'resolved')) {
      throw new BadRequestException("This change can't be undone");
    }
    const latest = await this.prisma.issueUpdate.findFirst({
      where: { issueId, undoneAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (latest?.id !== updateId) throw new BadRequestException('Only the latest update can be undone');

    await this.prisma.$transaction(async (tx) => {
      await tx.issueUpdate.update({ where: { id: updateId }, data: { undoneAt: new Date() } });
      if (statusChange) await tx.issue.update({ where: { id: issueId }, data: { status: update.fromStatus, statusChangedAt: new Date() } });
    });
    // Only the newest draft is kept.
    await this.discardDrafts(issueId, user.id, updateId);
    return this.get(cognitoSub, issueId);
  }

  /** Deletes undone updates (and their files) whose draft time ran out. */
  private async purgeExpiredDrafts(where: Prisma.IssueUpdateWhereInput) {
    await this.deleteUndone({ ...where, undoneAt: { lt: new Date(Date.now() - UNDO_WINDOW_MS) } });
  }

  /** The author sent something new, so their older undone drafts on this issue are done with. */
  private async discardDrafts(issueId: string, authorId: string, except?: string) {
    await this.deleteUndone({ issueId, authorId, undoneAt: { not: null }, ...(except ? { id: { not: except } } : {}) });
  }

  private async deleteUndone(where: Prisma.IssueUpdateWhereInput) {
    const rows = await this.prisma.issueUpdate.findMany({ where, select: { id: true, attachments: { select: { src: true } } } });
    if (rows.length === 0) return;
    await this.prisma.issueUpdate.deleteMany({ where: { id: { in: rows.map((row) => row.id) } } });
    await removeUploads(rows.flatMap((row) => row.attachments.map((a) => a.src)));
  }

  /** The author puts an active issue back at the top — once every 7 days. */
  async ping(cognitoSub: string, issueId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { status: true, createdAt: true, lastPingedAt: true, author: { select: { cognitoSub: true } } },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    if (issue.author?.cognitoSub !== cognitoSub) throw new ForbiddenException('Only the author can ping this issue');
    if (!ACTIVE.includes(issue.status)) throw new BadRequestException('Only open issues can be pinged');
    const canPingAt = new Date(bumpedAt(issue).getTime() + PING_INTERVAL_MS);
    if (canPingAt.getTime() > Date.now()) {
      throw new HttpException({ message: 'You can ping this issue once a week', canPingAt }, HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.prisma.issue.update({ where: { id: issueId }, data: { lastPingedAt: new Date() } });
    return this.get(cognitoSub, issueId);
  }

  /** Resolves an attachment the caller may read to its file on disk. */
  async attachmentFile(cognitoSub: string, attachmentId: string) {
    const attachment = await this.prisma.issueAttachment.findUnique({
      where: { id: attachmentId },
      select: { src: true, fileName: true, mimeType: true, issue: { select: { buildingId: true } } },
    });
    if (!attachment) throw new NotFoundException('File not found');
    await this.buildingsService.requireMember(cognitoSub, attachment.issue.buildingId);
    return presignGet(attachment.src, attachment.mimeType);
  }

  /** Stores the files, runs `write` with their metadata, and deletes them again if it fails. */
  private async withFiles<T>(buildingId: string, files: UploadedFileData[], write: (stored: StoredFile[]) => Promise<T>) {
    const stored: StoredFile[] = [];
    try {
      for (const file of files) {
        const src = await saveUpload(buildingId, file);
        stored.push({ src, fileName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size });
      }
      return await write(stored);
    } catch (err) {
      await removeUploads(stored.map((file) => file.src));
      throw err;
    }
  }

  private async requireAuthorWhileOpen(cognitoSub: string, issueId: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { status: true, author: { select: { cognitoSub: true } } },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    const user = await this.prisma.user.findUnique({ where: { cognitoSub }, select: { isAdmin: true } });
    if (effectiveAdmin(user)) return issue;
    // A former resident's issue (author null) can only be changed by an admin.
    if (issue.author?.cognitoSub !== cognitoSub) throw new ForbiddenException('Only the author or an admin can change this issue');
    if (issue.status !== 'opened') throw new ForbiddenException('This issue is already being handled');
    return issue;
  }
}
