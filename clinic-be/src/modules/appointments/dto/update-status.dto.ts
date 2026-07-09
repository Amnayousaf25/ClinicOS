import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../schemas/appointment.schema';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
