import { IsString } from 'class-validator';

export class UpdateOnboardingDto {
  @IsString()
  name!: string;

  @IsString()
  language!: string;

  @IsString()
  userType!: string;
}
