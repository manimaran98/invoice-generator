import { IsString } from 'class-validator';

export class SwitchOrgDto {
  @IsString()
  organizationId!: string;
}
