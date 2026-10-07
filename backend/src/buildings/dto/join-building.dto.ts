import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { RelationType } from '@prisma/client';

export class JoinBuildingDto {
  @IsUUID()
  buildingId!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  /** Suggestion only — building management confirms the real apartment. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32767)
  apartment?: number;

  /** Suggestion only — owner or renter (stored as `tenant`). */
  @IsOptional()
  @IsEnum(RelationType)
  relationType?: RelationType;
}
