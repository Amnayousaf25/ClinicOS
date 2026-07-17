import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReminderConfig,
  ReminderConfigSchema,
} from './schemas/reminder-config.schema';
import { ReminderLog, ReminderLogSchema } from './schemas/reminder-log.schema';
import {
  Appointment,
  AppointmentSchema,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  AppointmentHistory,
  AppointmentHistorySchema,
} from 'src/modules/appointments/schemas/appointment-history.schema';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { RemindersScheduler } from './reminders.scheduler';
import { ClinicSettingsModule } from 'src/modules/clinic-settings/clinic-settings.module';
import { SmsModule } from 'src/modules/sms/sms.module';
import { EmailModule } from 'src/modules/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReminderConfig.name, schema: ReminderConfigSchema },
      { name: ReminderLog.name, schema: ReminderLogSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AppointmentHistory.name, schema: AppointmentHistorySchema },
    ]),
    ClinicSettingsModule,
    SmsModule,
    EmailModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersScheduler],
  exports: [RemindersService],
})
export class RemindersModule {}
