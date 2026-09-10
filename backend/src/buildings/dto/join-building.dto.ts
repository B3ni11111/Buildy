import { IsString, MinLength } from 'class-validator';

export class JoinBuildingDto {
  @IsString()
  buildingId!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
