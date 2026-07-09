import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId()
  serviceId?: string;
}

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId()
  serviceId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
