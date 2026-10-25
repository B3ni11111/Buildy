import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IssueStatus } from '@prisma/client';
import { IssuesService, MAX_ISSUE_FILES } from './issues.service.js';
import { AddIssueUpdateDto, ChangeIssueStatusDto, CreateIssueDto, UpdateIssueDto } from './issues.dto.js';
import { MAX_UPLOAD_BYTES, type UploadedFileData } from '../uploads/uploads.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

const filesInterceptor = FilesInterceptor('files', MAX_ISSUE_FILES, {
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_ISSUE_FILES },
  // Multer defaults to latin1 for file names, which garbles Hebrew/Arabic names.
  defParamCharset: 'utf8',
} as Parameters<typeof FilesInterceptor>[2]);

@Controller('buildings/:buildingId/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Query('status', new ParseEnumPipe(IssueStatus, { optional: true })) status?: IssueStatus,
  ) {
    return this.issuesService.list(user.cognitoSub, buildingId, status);
  }

  @Post()
  @UseInterceptors(filesInterceptor)
  create(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: CreateIssueDto,
    @UploadedFiles() files: UploadedFileData[] | undefined,
  ) {
    return this.issuesService.create(user.cognitoSub, buildingId, dto, files);
  }
}

@Controller('issues')
export class IssueDetailController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.issuesService.get(user.cognitoSub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(user.cognitoSub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.issuesService.remove(user.cognitoSub, id);
  }

  /** Building management only; `text` is required. */
  @Post(':id/status')
  @UseInterceptors(filesInterceptor)
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeIssueStatusDto,
    @UploadedFiles() files: UploadedFileData[] | undefined,
  ) {
    return this.issuesService.changeStatus(user.cognitoSub, id, dto, files);
  }

  /** Management or the author, while the issue is in process: text and/or files, no status change. */
  @Post(':id/updates')
  @UseInterceptors(filesInterceptor)
  addUpdate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddIssueUpdateDto,
    @UploadedFiles() files: UploadedFileData[] | undefined,
  ) {
    return this.issuesService.addUpdate(user.cognitoSub, id, dto, files);
  }

  /** Takes back the author's newest update or resolve within 5 minutes; the note and files come back as a draft. */
  @Post(':id/updates/:updateId/undo')
  undo(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('updateId', ParseUUIDPipe) updateId: string,
  ) {
    return this.issuesService.undo(user.cognitoSub, id, updateId);
  }

  @Post(':id/ping')
  ping(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.issuesService.ping(user.cognitoSub, id);
  }
}

@Controller('issue-attachments')
export class IssueAttachmentsController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id/file')
  download(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.issuesService.attachmentFile(user.cognitoSub, id);
  }
}
