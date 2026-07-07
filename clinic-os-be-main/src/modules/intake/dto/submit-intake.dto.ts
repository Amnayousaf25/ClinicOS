import {
  IsString,
  IsEmail,
  IsDateString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  Equals,
  IsEnum,
} from 'class-validator';
import { AppointmentType } from 'src/modules/appointments/schemas/appointment.schema';

export class SubmitIntakeDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  // If provided, the intake links to (and updates) this existing patient
  // rather than creating a new one.
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsDateString()
  dob: string;

  @IsString()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reasonForVisit: string;

  @IsBoolean()
  @Equals(true, { message: 'Consent must be given' })
  consent: boolean;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  insuranceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s()-]{7,20}$/, {
    message: 'Invalid emergency phone number format',
  })
  emergencyPhone?: string;
}
