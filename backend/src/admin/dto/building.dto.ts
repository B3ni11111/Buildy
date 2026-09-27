import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ContactType, UserRole } from '@prisma/client';

export class CreateBuildingDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  cityId!: number;

  @IsString()
  @MinLength(1)
  address!: string;

  /** Shared join password, stored hashed. */
  @IsString()
  @MinLength(4)
  password!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  entryCode?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactLinkDto)
  contactLinks?: ContactLinkDto[];
}

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  address?: string;

  /** Omit to keep the current password. */
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  entryCode?: string | null;
}

export class ContactLinkDto {
  @IsEnum(ContactType)
  type!: ContactType;

  /** WhatsApp: an https invite link; phone: a number; email: an address. Checked per type in the service. */
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  link!: string;
}

export class SetMemberRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
