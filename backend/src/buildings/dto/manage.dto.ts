import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
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

  /** Omit to keep the current join password. */
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

/** A member's own suggestion (apartment + owner/renter) — building management confirms it. */
export class MyRequestDto {
  @IsInt()
  @Min(1)
  @Max(32767)
  apartment!: number;

  @IsEnum(RelationType)
  relationType!: RelationType;
}
