import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateInsuranceProviderDto {
  @IsString()
  name: string;
}

export class UpdateInsuranceProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
