import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { addUtcMinutes, parseUtcDateTimeKey } from 'src/common/utils/date.util';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import { ClinicSettingsService } from 'src/modules/clinic-settings/clinic-settings.service';
import { SmsService } from 'src/modules/sms/sms.service';
import { UpdateReminderConfigDto } from './dto/update-config.dto';
import {
  ReminderConfig,
  ReminderConfigDocument,
  ReminderType,
} from './schemas/reminder-config.schema';
import {
  ReminderLog,
  ReminderLogDocument,
  ReminderLogStatus,
} from './schemas/reminder-log.schema';

/**
 * Pull the patient identity off an appointment. Reads the populated
 * `patientId` document — appointments stop storing flat
 * `patientName/Phone/Email` snapshots, so all reminder templates and
 * SMS sends go through this helper. Callers must `.populate('patientId')`
 * before invoking; we fall back to empty strings rather than crashing.
 */
function patientIdentity(apt: AppointmentDocument): {
  name: string;
  phone: string;
  email: string;
} {
  const ref = apt.patientId as unknown as
    | { name?: string; phone?: string; email?: string }
    | null
    | string;
  if (!ref || typeof ref !== 'object') {
    return { name: '', phone: '', email: '' };
  }
  return {
    name: ref.name || '',
    phone: ref.phone || '',
    email: ref.email || '',
  };
}

const DEFAULT_CONFIGS = [
  {
    type: ReminderType.BookingConfirmation,
    label: 'Booking Confirmation',
    message:
      'Hi {name}, your appointment at {clinic_name} is confirmed for {date} at {time}.',
  },
  {
    type: ReminderType.TwentyFourHour,
    label: '24-Hour Reminder',
    message:
      'Hi {name}, reminder: your appointment at {clinic_name} is tomorrow at {time}. Reply YES to confirm or NO to cancel.',
  },
  {
    type: ReminderType.TwoHour,
    label: '2-Hour Reminder',
    message:
      'Hi {name}, your appointment at {clinic_name} is in 2 hours at {time}. See you soon!',
  },
];

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  constructor(
    @InjectModel(ReminderConfig.name)
    private configModel: Model<ReminderConfigDocument>,
    @InjectModel(ReminderLog.name)
    private logModel: Model<ReminderLogDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private settingsService: ClinicSettingsService,
    private smsService: SmsService,
  ) {}

  // ─── Config CRUD ─────────────────────────────────────────────────────────

  async getConfigs(orgId: string) {
    const oid = new Types.ObjectId(orgId);
    const configs = await this.configModel.find({ orgId: oid });
    if (configs.length === 0) return this.seedDefaultConfigs(orgId);
    return configs;
  }

  private async seedDefaultConfigs(orgId: string) {
    const oid = new Types.ObjectId(orgId);
    await this.configModel.bulkWrite(
      DEFAULT_CONFIGS.map((c) => ({
        updateOne: {
          filter: { orgId: oid, type: c.type },
          update: {
            $setOnInsert: {
              orgId: oid,
              type: c.type,
              label: c.label,
              enabled: true,
              message: c.message,
            },
          },
          upsert: true,
        },
      })),
    );
    return this.configModel.find({ orgId: oid });
  }

  async updateConfig(orgId: string, id: string, dto: UpdateReminderConfigDto) {
    const config = await this.configModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!config) throw new NotFoundException('Reminder config not found');
    if (dto.enabled !== undefined) config.enabled = dto.enabled;
    if (dto.message !== undefined) config.message = dto.message;
    return config.save();
  }

  // ─── Log ─────────────────────────────────────────────────────────────────

  async getLog(orgId: string, query: { page?: number; limit?: number }) {
    const oid = new Types.ObjectId(orgId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.logModel
        .find({ orgId: oid })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit),
      this.logModel.countDocuments({ orgId: oid }),
    ]);

    const mappedData = data.map((log) => {
      let mappedType = log.messageType;
      if (log.messageType === ReminderType.BookingConfirmation) {
        mappedType = 'confirmation';
      } else if (log.messageType === ReminderType.TwentyFourHour) {
        mappedType = '24h';
      } else if (log.messageType === ReminderType.TwoHour) {
        mappedType = '2h';
      }

      let mappedStatus = 'failed';
      if (
        log.status === ReminderLogStatus.Delivered ||
        (log.status as string) === 'delivered'
      ) {
        mappedStatus = 'sent';
      } else if (
        log.status === ReminderLogStatus.Scheduled ||
        log.status === ReminderLogStatus.Pending ||
        (log.status as string) === 'scheduled' ||
        (log.status as string) === 'pending'
      ) {
        mappedStatus = 'scheduled';
      }

      return {
        _id: log._id.toString(),
        appointmentId: log.appointmentId.toString(),
        patientName: log.patientName,
        patientPhone: log.phone,
        type: mappedType,
        body: log.messageBody,
        status: mappedStatus,
        scheduledFor: log.scheduledFor ? log.scheduledFor.toISOString() : undefined,
        sentAt: log.sentAt ? log.sentAt.toISOString() : undefined,
        reply: (log as any).reply || undefined,
      };
    });

    return { data: mappedData, total };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async getConfig(orgId: string, type: ReminderType) {
    const configs = await this.getConfigs(orgId);
    return configs.find((c) => c.type === type) ?? null;
  }

  private renderBody(
    template: string,
    apt: AppointmentDocument,
    clinic: string,
  ) {
    const { name } = patientIdentity(apt);
    return template
      .replace(/{name}/g, name)
      .replace(/{date}/g, apt.date)
      .replace(/{time}/g, apt.time)
      .replace(/{clinic_name}/g, clinic);
  }

  private async incReminderCount(apt: AppointmentDocument) {
    await this.appointmentModel.updateOne(
      { _id: apt._id },
      { $inc: { remindersSent: 1 } },
    );
  }

  // ─── Booking Confirmation (immediate) ────────────────────────────────────

  async sendBookingConfirmation(apt: AppointmentDocument) {
    const orgId = apt.orgId.toString();
    const config = await this.getConfig(
      orgId,
      ReminderType.BookingConfirmation,
    );
    if (!config?.enabled) return;

    const existing = await this.logModel.findOne({
      appointmentId: apt._id,
      messageType: ReminderType.BookingConfirmation,
      status: {
        $in: [ReminderLogStatus.Delivered, ReminderLogStatus.Scheduled],
      },
    });
    if (existing) return;

    const settings = await this.settingsService.getOrCreate(apt.orgId);
    const body = this.renderBody(
      config.message,
      apt,
      settings.clinicName || 'the clinic',
    );
    const id1 = patientIdentity(apt);
    const result = await this.smsService.sendSms(id1.phone, body);

    await this.logModel.updateOne(
      {
        orgId: apt.orgId,
        appointmentId: apt._id,
        messageType: ReminderType.BookingConfirmation,
      },
      {
        $set: {
          patientName: id1.name,
          phone: id1.phone,
          sentAt: new Date(),
          status: result.success
            ? ReminderLogStatus.Delivered
            : ReminderLogStatus.Failed,
          messageId: result.sid || null,
          messageBody: body,
          errorMessage: result.error || null,
        },
        $setOnInsert: {
          orgId: apt.orgId,
          appointmentId: apt._id,
          messageType: ReminderType.BookingConfirmation,
        },
      },
      { upsert: true },
    );
    if (result.success) {
      await this.incReminderCount(apt);
    }
    await this.appointmentModel.updateOne(
      { _id: apt._id, 'smsReminders.type': 'confirmation' },
      { $set: { 'smsReminders.$.sent': result.success } },
    );
  }

  async sendManualBookingConfirmation(orgId: string, appointmentId: string) {
    const apt = await this.appointmentModel
      .findOne({
        _id: appointmentId,
        orgId: new Types.ObjectId(orgId),
      })
      .populate('patientId', '_id name phone email mrn');
    if (!apt) throw new NotFoundException('Appointment not found');

    const config = await this.getConfig(
      orgId,
      ReminderType.BookingConfirmation,
    );
    if (!config?.enabled) return apt;

    const settings = await this.settingsService.getOrCreate(apt.orgId);
    const body = this.renderBody(
      config.message,
      apt,
      settings.clinicName || 'the clinic',
    );
    const id2 = patientIdentity(apt);
    const result = await this.smsService.sendSms(id2.phone, body);

    await this.logModel.updateOne(
      {
        orgId: apt.orgId,
        appointmentId: apt._id,
        messageType: ReminderType.BookingConfirmation,
      },
      {
        $set: {
          patientName: id2.name,
          phone: id2.phone,
          sentAt: new Date(),
          status: result.success
            ? ReminderLogStatus.Delivered
            : ReminderLogStatus.Failed,
          messageId: result.sid || null,
          messageBody: body,
          errorMessage: result.error || null,
        },
        $setOnInsert: {
          orgId: apt.orgId,
          appointmentId: apt._id,
          messageType: ReminderType.BookingConfirmation,
        },
      },
      { upsert: true },
    );
    if (result.success) {
      await this.incReminderCount(apt);
    }
    await this.appointmentModel.updateOne(
      { _id: apt._id, 'smsReminders.type': 'confirmation' },
      { $set: { 'smsReminders.$.sent': result.success } },
    );
    return (await this.appointmentModel.findById(apt._id)) || apt;
  }

  // ─── Schedule 24h & 2h reminders (called on create / reschedule) ─────────

  async scheduleReminders(apt: AppointmentDocument) {
    const aptTime = parseUtcDateTimeKey(apt.date, apt.time);
    if (!aptTime) return;

    const settings = await this.settingsService.getOrCreate(apt.orgId);
    const clinic = settings.clinicName || 'the clinic';

    await this.scheduleOne(
      apt,
      ReminderType.TwentyFourHour,
      new Date(aptTime.getTime() - 24 * 60 * 60 * 1000),
      clinic,
    );
    await this.scheduleOne(
      apt,
      ReminderType.TwoHour,
      new Date(aptTime.getTime() - 2 * 60 * 60 * 1000),
      clinic,
    );
  }

  private async scheduleOne(
    apt: AppointmentDocument,
    type: ReminderType,
    sendAt: Date,
    clinic: string,
  ) {
    if (sendAt.getTime() <= Date.now()) return; // already past

    const config = await this.getConfig(apt.orgId.toString(), type);
    if (!config?.enabled) return;

    // Dedup
    const existing = await this.logModel.findOne({
      appointmentId: apt._id,
      messageType: type,
      status: {
        $in: [ReminderLogStatus.Delivered, ReminderLogStatus.Scheduled],
      },
    });
    if (existing) return;

    const body = this.renderBody(config.message, apt, clinic);
    const id3 = patientIdentity(apt);
    const result = await this.smsService.scheduleSms(id3.phone, body, sendAt);

    await this.logModel.updateOne(
      { orgId: apt.orgId, appointmentId: apt._id, messageType: type },
      {
        $set: {
          patientName: id3.name,
          phone: id3.phone,
          sentAt: new Date(),
          status: result.scheduled
            ? ReminderLogStatus.Scheduled
            : ReminderLogStatus.Pending,
          messageBody: body,
          scheduledMessageId: result.scheduled ? result.sid : null,
          scheduledFor: sendAt,
          messageId: null,
          errorMessage: null,
        },
        $setOnInsert: {
          orgId: apt.orgId,
          appointmentId: apt._id,
          messageType: type,
        },
      },
      { upsert: true },
    );

    this.logger.log(
      `${result.scheduled ? 'Scheduled' : 'Queued'} ${type} for apt ${apt._id.toString()} at ${sendAt.toISOString()}`,
    );
  }

  // ─── Cancel reminders (called on appointment cancel / reschedule) ────────

  async cancelReminders(appointmentId: string) {
    const logs = await this.logModel.find({
      appointmentId: new Types.ObjectId(appointmentId),
      status: { $in: [ReminderLogStatus.Scheduled, ReminderLogStatus.Pending] },
    });

    for (const log of logs) {
      if (log.scheduledMessageId) {
        await this.smsService.cancelScheduledSms(log.scheduledMessageId);
      }
      log.status = ReminderLogStatus.Cancelled;
      log.scheduledMessageId = null as any;
      await log.save();
      this.logger.log(
        `Cancelled ${log.messageType} for apt ${log.appointmentId.toString()}`,
      );
    }
  }

  // ─── Cron: send due pending reminders (PK numbers, outside window) ──────

  async processScheduledReminders() {
    const now = new Date();
    const due = await this.logModel.find({
      status: ReminderLogStatus.Pending,
      scheduledFor: { $lte: now },
    });

    if (due.length > 0) {
      this.logger.log(`Sending ${due.length} due reminder(s)`);

      for (const log of due) {
        const apt = await this.appointmentModel.findById(log.appointmentId);
        if (
          !apt ||
          apt.status === AppointmentStatus.Cancelled ||
          apt.status === AppointmentStatus.NoShow
        ) {
          log.status = ReminderLogStatus.Cancelled;
          await log.save();
          continue;
        }

        const result = await this.smsService.sendSms(log.phone, log.messageBody);
        log.sentAt = new Date();
        log.status = result.success
          ? ReminderLogStatus.Delivered
          : ReminderLogStatus.Failed;
        log.messageId = result.sid || '';
        log.errorMessage = result.error || '';
        await log.save();
        if (result.success) await this.incReminderCount(apt);

        const reminderTypeMap: Record<string, string> = {
          [ReminderType.TwentyFourHour]: '24h',
          [ReminderType.TwoHour]: '2h',
          [ReminderType.BookingConfirmation]: 'confirmation',
        };
        const typeKey = reminderTypeMap[log.messageType];
        if (typeKey) {
          await this.appointmentModel.updateOne(
            { _id: apt._id, 'smsReminders.type': typeKey },
            { $set: { 'smsReminders.$.sent': result.success } },
          );
        }
      }
    }

    // Promote successfully scheduled Telnyx reminders whose time has passed to Delivered (successful sent status)
    const scheduledDue = await this.logModel.find({
      status: ReminderLogStatus.Scheduled,
      scheduledFor: { $lte: now },
    });

    if (scheduledDue.length > 0) {
      this.logger.log(`Promoting ${scheduledDue.length} passed scheduled reminder(s) to Delivered`);
      for (const log of scheduledDue) {
        log.status = ReminderLogStatus.Delivered;
        await log.save();

        const apt = await this.appointmentModel.findById(log.appointmentId);
        if (apt) {
          await this.incReminderCount(apt);

          const reminderTypeMap: Record<string, string> = {
            [ReminderType.TwentyFourHour]: '24h',
            [ReminderType.TwoHour]: '2h',
            [ReminderType.BookingConfirmation]: 'confirmation',
          };
          const typeKey = reminderTypeMap[log.messageType];
          if (typeKey) {
            await this.appointmentModel.updateOne(
              { _id: apt._id, 'smsReminders.type': typeKey },
              { $set: { 'smsReminders.$.sent': true } },
            );
          }
        }
      }
    }
  }

  // ─── Cron: promote pending → scheduled when entering 5-day window ───────

  async scheduleUpcomingReminders() {
    const now = new Date();
    const fiveDays = addUtcMinutes(now, 5 * 24 * 60);

    const pending = await this.logModel.find({
      status: ReminderLogStatus.Pending,
      scheduledFor: { $gt: now, $lte: fiveDays },
      scheduledMessageId: null,
    });

    if (pending.length === 0) return;
    this.logger.log(
      `Promoting ${pending.length} reminder(s) to Telnyx scheduled`,
    );

    for (const log of pending) {
      const result = await this.smsService.scheduleSms(
        log.phone,
        log.messageBody,
        log.scheduledFor,
      );
      if (result.scheduled && result.sid) {
        log.status = ReminderLogStatus.Scheduled;
        log.scheduledMessageId = result.sid;
        await log.save();
      }
    }
  }
}
