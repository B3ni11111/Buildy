import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}
