import {
  IsOptional,
  IsBoolean,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateReminderConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(320)
  message?: string;
}
