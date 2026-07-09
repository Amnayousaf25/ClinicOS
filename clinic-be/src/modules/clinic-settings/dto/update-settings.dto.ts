import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class UpdateClinicSettingsDto {
  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDuration?: number;

  @IsOptional()
  @IsArray()
  workingDays?: number[];

  @IsOptional()
  @IsObject()
  workingHours?: { start: string; end: string };

  @IsOptional()
  @IsString()
  timeFormat?: string;

  @IsOptional()
  @IsObject()
  smsTemplates?: {
    confirmation: string;
    reminder24h: string;
    reminder2h: string;
  };

  @IsOptional()
  @IsObject()
  enabledReminders?: {
    confirmation: boolean;
    reminder24h: boolean;
    reminder2h: boolean;
  };
}
