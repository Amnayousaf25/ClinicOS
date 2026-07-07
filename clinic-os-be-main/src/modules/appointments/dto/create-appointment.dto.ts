import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateAppointmentDto {
  // If provided, the appointment is linked to this existing patient and the
  // patientName/Phone/Email fields are treated as patches (only applied if
  // they differ from the patient's current values).
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  patientName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid phone number format' })
  patientPhone?: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  // Optional date-of-birth for the patient. When supplied (either while
  // creating a new patient or updating an existing one), it's persisted
  // on the Patient record so age is always derivable.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dob must be in YYYY-MM-DD format',
  })
  dob?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'time must be in HH:mm format',
  })
  time: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  service?: string;
}
