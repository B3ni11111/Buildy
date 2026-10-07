import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateOnboardingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  language!: string;
}

/** Private info the user edits themselves (technical info is set by building management). */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /** Optional; visible only to building management and admins. Empty string clears it. */
  @IsOptional()
  @IsString()
  @Matches(/^$|^\+?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number' })
  phone?: string;
}
