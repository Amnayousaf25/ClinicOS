import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../types/user.types';

export class InviteUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  employeeId: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsMongoId()
  @IsOptional()
  externalId?: string;

  @IsMongoId()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;
}
