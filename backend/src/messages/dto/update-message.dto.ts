import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
