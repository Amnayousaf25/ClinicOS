import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateFirstAdminDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  employeeId: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}
