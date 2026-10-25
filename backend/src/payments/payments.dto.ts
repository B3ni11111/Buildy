import { IsEnum, IsIn, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { PaymentMethod, PaymentsOpenMode } from '@prisma/client';

export const FEE_SCOPES = ['once', 'permanent'] as const;
export type FeeScope = (typeof FEE_SCOPES)[number];

/** Changing an apartment's monthly fee: this month only, or from now on. */
export class ChangeFeeDto {
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  amount!: number;

  /** `once` = only this month's charge; `permanent` = also the standing fee that future months copy. */
  @IsIn(FEE_SCOPES)
  scope!: FeeScope;
}

/** A building's payments setup (the "Create a building" step, and the tile's settings). */
export class PaymentSettingsDto {
  @IsEnum(PaymentsOpenMode)
  openMode!: PaymentsOpenMode;

  /** Day of the month (1-28) an automatic month opens. */
  @IsInt()
  @Min(1)
  @Max(28)
  openDay!: number;

  /** The fee of every apartment that has no fee of its own. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  defaultFee?: number | null;

  @IsOptional()
  @IsEnum(PaymentMethod)
  defaultMethod?: PaymentMethod | null;
}

/** Management marking one apartment paid; the method defaults to the apartment's own. */
export class MarkPaidDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

/** An owner choosing who pays the apartment's fee; null = back to the owner. */
export class SetPayerDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  userId!: string | null;
}
