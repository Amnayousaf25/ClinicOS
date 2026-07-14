import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  ReminderLog,
  ReminderLogDocument,
} from 'src/modules/reminders/schemas/reminder-log.schema';

import { SmsService } from './sms.service';

/**
 * SMS webhook for incoming replies.
 * Handles YES/NO replies to confirm/cancel appointments, and custom queries.
 */
@ApiTags('SMS Webhook')
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ReminderLog.name)
    private logModel: Model<ReminderLogDocument>,
    private readonly smsService: SmsService,
  ) {}

  @Post('webhook')
  async handleIncomingReply(
    @Body()
    body: {
      from?: string;
      text?: string;
      phone?: string;
      message?: string;
    },
  ) {
    const from = body.from || body.phone || '';
    const text = (body.text || body.message || '').trim();
    this.logger.log(`Incoming SMS from ${from}: ${text}`);

    const normalizedPhone = from.replace(/^\+/, '');
    const phoneVariants = [from, normalizedPhone, `+${normalizedPhone}`].filter(
      Boolean,
    );

    const appointment = await this.appointmentModel
      .findOne({
        patientPhone: { $in: phoneVariants },
        status: {
          $in: [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Rescheduled],
        },
      })
      .sort({ date: 1, time: 1 })
      .exec();

    if (!appointment) {
      this.logger.warn(`No active appointment found for phone ${from}`);
      return { status: 'no_appointment' };
    }

    const upperText = text.toUpperCase();

    if (upperText !== 'YES' && upperText !== 'NO') {
      // Log the custom query in the ReminderLog
      try {
        await this.logModel.findOneAndUpdate(
          { appointmentId: appointment._id },
          { $set: { reply: text } },
          { sort: { sentAt: -1 } },
        );
      } catch (err: unknown) {
        this.logger.error(`Failed to update reply log: ${String(err)}`);
      }

      // Send auto-response back to the patient
      const autoResponse = `Thank you for your message. We have received your query and a clinic representative will contact you shortly.`;
      try {
        await this.smsService.sendSms(from, autoResponse);
      } catch (err: any) {
        this.logger.error(`Failed to send auto-response SMS to ${from}: ${err.message}`);
      }

      this.logger.log(`Custom query from ${from} logged and automated response sent.`);
      return { status: 'query_received', reply: text };
    }

    if (upperText === 'YES') {
      appointment.status = AppointmentStatus.Confirmed;
      await appointment.save();

      try {
        await this.logModel.findOneAndUpdate(
          { appointmentId: appointment._id },
          { $set: { reply: 'YES' } },
          { sort: { sentAt: -1 } },
        );
      } catch (err: unknown) {
        this.logger.error(`Failed to update reply log: ${String(err)}`);
      }

      this.logger.log(`Appointment confirmed via SMS reply`);
      return { status: 'confirmed' };
    } else {
      appointment.status = AppointmentStatus.Cancelled;
      await appointment.save();

      try {
        await this.logModel.findOneAndUpdate(
          { appointmentId: appointment._id },
          { $set: { reply: 'NO' } },
          { sort: { sentAt: -1 } },
        );
      } catch (err: unknown) {
        this.logger.error(`Failed to update reply log: ${String(err)}`);
      }

      this.logger.log(`Appointment cancelled via SMS reply`);
      return { status: 'cancelled' };
    }
  }
}
