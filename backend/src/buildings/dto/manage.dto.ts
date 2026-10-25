import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod, RelationType } from '@prisma/client';

export class ApartmentEntryDto {
  @IsInt()
  @Min(1)
  @Max(32767)
  number!: number;

  @IsEnum(RelationType)
  relationType!: RelationType;

  @IsOptional()
  @IsInt()
  @Min(-10)
  @Max(300)
  floor?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  sqrm?: number | null;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;
}

/** The member's full list of apartments in this building (replaces what they had). */
export class SetApartmentsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ApartmentEntryDto)
  apartments!: ApartmentEntryDto[];
}

/** What building management may change; name/address/city stay admin-only. */
export class UpdateBuildingDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  entryCode?: string | null;
}

/** One person management adds by their user ID, with at least one apartment. */
export class ResidentEntryDto {
  @IsUUID()
  userId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ApartmentEntryDto)
  apartments!: ApartmentEntryDto[];
}

/** Bulk add: everyone from one pasted list at once. */
export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ResidentEntryDto)
  residents!: ResidentEntryDto[];
}

/** IDs pulled out of the pasted text; with `buildingId` (management only) flags existing/blocked members. */
export class PreviewUsersDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @IsOptional()
  @IsUUID()
  buildingId?: string;
}
