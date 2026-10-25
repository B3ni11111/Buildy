import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ContactType, UserRole } from '@prisma/client';
import { ResidentEntryDto } from '../../buildings/dto/manage.dto.js';
import { PaymentSettingsDto } from '../../payments/payments.dto.js';

export class CreateBuildingDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  cityId!: number;

  @IsString()
  @MinLength(1)
  address!: string;

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

  /** First residents, added by their user IDs (the wizard's bulk list). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ResidentEntryDto)
  residents?: ResidentEntryDto[];

  /** The wizard's payments step; without it, management sets payments up later from the tile. */
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  payments?: PaymentSettingsDto;
}

/** "Create a building" by a regular user, who picks their own management role. */
export class CreateMyBuildingDto extends CreateBuildingDto {
  @IsIn(['committee_head', 'management_company'])
  role!: 'committee_head' | 'management_company';
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
