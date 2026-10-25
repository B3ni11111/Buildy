import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IssueStatus } from '@prisma/client';

/** Multipart fields of "Report an issue" (files come separately). */
export class CreateIssueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

/** A progress update while the issue is in process: text and/or files, no status change. */
export class AddIssueUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;
}

/** A status change by building management — the note is required. */
export class ChangeIssueStatusDto {
  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsString()
  @MaxLength(5000)
  text!: string;
}
