import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../types/user.types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsMongoId()
  department?: string | null;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
