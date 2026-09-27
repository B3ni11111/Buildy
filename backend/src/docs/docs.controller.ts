import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DocsService, MAX_UPLOAD_BYTES, type UploadedFileData } from './docs.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

class UploadDocDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

class RenameDocDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}

const uploadInterceptor = FileInterceptor('file', {
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  // Multer defaults to latin1 for file names, which garbles Hebrew/Arabic names.
  defParamCharset: 'utf8',
} as Parameters<typeof FileInterceptor>[1]);

@Controller('buildings/:buildingId/docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.docsService.list(user.cognitoSub, buildingId);
  }

  @Post()
  @UseInterceptors(uploadInterceptor)
  upload(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @UploadedFile() file: UploadedFileData | undefined,
    @Body() dto: UploadDocDto,
  ) {
    return this.docsService.upload(user.cognitoSub, buildingId, file, dto.title);
  }
}

@Controller('docs')
export class DocDetailController {
  constructor(private readonly docsService: DocsService) {}

  @Get(':id/file')
  async download(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { path, fileName, mimeType } = await this.docsService.file(user.cognitoSub, id);
    res.type(mimeType);
    // Browsers must use the stored (allow-listed) type, never guess one from the content.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(path, fileName);
  }

  @Patch(':id')
  rename(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RenameDocDto) {
    return this.docsService.rename(user.cognitoSub, id, dto.title);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.docsService.remove(user.cognitoSub, id);
  }
}
