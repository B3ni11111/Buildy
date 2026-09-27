import { IsString, IsUUID, MinLength } from 'class-validator';

export class JoinBuildingDto {
  @IsUUID()
  buildingId!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
