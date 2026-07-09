import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { OrgPlan } from '../types/organization.types';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(OrgPlan)
  plan?: OrgPlan;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsers?: number;
}
