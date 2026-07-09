import {
  IsString,
  IsMongoId,
  IsEmail,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  serviceId: string;

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

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
