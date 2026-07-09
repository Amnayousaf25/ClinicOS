import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmsService } from './sms.service';
import { LifetimeService } from './lifetime.service';
import { TelnyxService } from './telnyx.service';
import { SmsController } from './sms.controller';
import {
  Appointment,
  AppointmentSchema,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  ReminderLog,
  ReminderLogSchema,
} from 'src/modules/reminders/schemas/reminder-log.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ReminderLog.name, schema: ReminderLogSchema },
    ]),
  ],
  controllers: [SmsController],
  providers: [LifetimeService, TelnyxService, SmsService],
  exports: [SmsService],
})
export class SmsModule {}
