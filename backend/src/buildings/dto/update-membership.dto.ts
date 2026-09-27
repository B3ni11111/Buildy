import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaymentMethod, RelationType } from '@prisma/client';

// What a resident may edit about their own unit. monthlyPayment is left out on
// purpose — that's set by the building admin, not the resident.
export class UpdateMembershipDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(32767)
  apartment?: number | null;

  @IsOptional()
  @IsInt()
  @Min(-10)
  @Max(300)
  floor?: number | null;

  @IsOptional()
  @IsEnum(RelationType)
  relationType?: RelationType | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  sqrm?: number | null;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;
}
