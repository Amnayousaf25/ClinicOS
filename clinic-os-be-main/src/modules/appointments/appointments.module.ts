import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import {
  AppointmentHistory,
  AppointmentHistorySchema,
} from './schemas/appointment-history.schema';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { ServicesModule } from 'src/modules/services/services.module';
import { RemindersModule } from 'src/modules/reminders/reminders.module';
import { PatientsModule } from 'src/modules/patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AppointmentHistory.name, schema: AppointmentHistorySchema },
    ]),
    ServicesModule,
    RemindersModule,
    PatientsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
