import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  addUtcDays,
  formatUtcDateKey,
  normalizeTimeKey,
  normalizeUtcDateKey,
} from 'src/common/utils/date.util';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from './schemas/appointment.schema';
import {
  AppointmentHistory,
  AppointmentHistoryAction,
  AppointmentHistoryActor,
  AppointmentHistoryDocument,
} from './schemas/appointment-history.schema';
import { ServicesService } from 'src/modules/services/services.service';
import { RemindersService } from 'src/modules/reminders/reminders.service';
import { PatientsService } from 'src/modules/patients/patients.service';
import { PatientDocument } from 'src/modules/patients/schemas/patient.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { CancelDto } from './dto/cancel.dto';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.Pending]: [
    AppointmentStatus.Confirmed,
    AppointmentStatus.Cancelled,
    AppointmentStatus.Arrived,
    AppointmentStatus.NoShow,
    AppointmentStatus.Rescheduled,
  ],
  [AppointmentStatus.Confirmed]: [
    AppointmentStatus.Arrived,
    AppointmentStatus.Cancelled,
    AppointmentStatus.NoShow,
    AppointmentStatus.Rescheduled,
  ],
  [AppointmentStatus.Arrived]: [],
  [AppointmentStatus.Cancelled]: [],
  [AppointmentStatus.NoShow]: [],
  [AppointmentStatus.Rescheduled]: [
    AppointmentStatus.Pending,
    AppointmentStatus.Confirmed,
    AppointmentStatus.Cancelled,
  ],
};

// Patient/service/provider refs are auto-populated by a schema-level
// `pre('find' | 'findOne')` hook (see appointment.schema.ts). Read paths
// here just use plain `find`/`findOne`; create + save paths refetch via
// `findById` so the hook resolves the refs.

type ChangeContext = {
  actor?: AppointmentHistoryActor;
  changedBy?: string;
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(AppointmentHistory.name)
    private historyModel: Model<AppointmentHistoryDocument>,
    private servicesService: ServicesService,
    private remindersService: RemindersService,
    private patientsService: PatientsService,
  ) {}

  async findAll(
    orgId: string,
    query: { period?: string; date?: string; status?: string },
  ): Promise<AppointmentDocument[]> {
    const oid = new Types.ObjectId(orgId);
    const filter: any = { orgId: oid };

    if (query.date) {
      const normalizedDate = normalizeUtcDateKey(query.date);
      if (!normalizedDate) {
        throw new BadRequestException('Invalid date');
      }
      filter.date = normalizedDate;
    } else if (query.period === 'today') {
      filter.date = formatUtcDateKey(new Date());
    } else if (query.period === 'week') {
      const today = new Date();
      const weekEnd = addUtcDays(today, 7);
      filter.date = {
        $gte: formatUtcDateKey(today),
        $lte: formatUtcDateKey(weekEnd),
      };
    }

    if (query.status) {
      filter.status = query.status;
    }

    return this.appointmentModel.find(filter).sort({ date: 1, time: 1 }).exec();
  }

  async findById(orgId: string, id: string): Promise<AppointmentDocument> {
    const apt = await this.appointmentModel.findOne({
      _id: id,
      orgId: new Types.ObjectId(orgId),
    });
    if (!apt) throw new NotFoundException('Appointment not found');
    return apt;
  }

  async findByBookingId(bookingId: string): Promise<AppointmentDocument> {
    const apt = await this.appointmentModel.findOne({ bookingId });
    if (!apt) throw new NotFoundException('Booking not found');
    return apt;
  }

  async create(
    orgId: string,
    dto: CreateAppointmentDto,
    createdBy?: string,
  ): Promise<AppointmentDocument> {
    const oid = new Types.ObjectId(orgId);

    if (!dto.serviceId) {
      throw new BadRequestException('serviceId is required');
    }
    const service = await this.servicesService.findById(orgId, dto.serviceId);

    let providerObjectId: Types.ObjectId | null = null;
    if (dto.providerId) {
      if (!Types.ObjectId.isValid(dto.providerId)) {
        throw new BadRequestException('Invalid providerId');
      }
      providerObjectId = new Types.ObjectId(dto.providerId);
    }

    const normalizedDate = normalizeUtcDateKey(dto.date);
    const normalizedTime = normalizeTimeKey(dto.time);
    if (!normalizedDate || !normalizedTime) {
      throw new BadRequestException('Invalid date or time format');
    }

    await this.checkSlotAvailable(orgId, normalizedDate, normalizedTime, providerObjectId);

    let patient: PatientDocument;
    if (dto.patientId) {
      patient = await this.patientsService.updatePatient(oid, dto.patientId, {
        name: dto.patientName,
        phone: dto.patientPhone,
        email: dto.patientEmail,
        dob: dto.dob,
      });
    } else {
      patient = await this.patientsService.createPatient({
        orgId: oid,
        name: dto.patientName,
        phone: dto.patientPhone,
        email: dto.patientEmail || '',
        dob: dto.dob,
      });
    }

    const appointment = await this.appointmentModel.create({
      orgId: oid,
      patientId: patient._id,
      serviceId: service._id,
      providerId: providerObjectId,
      date: normalizedDate,
      time: normalizedTime,
      notes: dto.notes || '',
      status: AppointmentStatus.Pending,
      bookingId: crypto.randomUUID(),
      createdBy: createdBy ? new Types.ObjectId(createdBy) : null,
    });

    // Refetch via findOne so the schema-level pre-find hook resolves
    // patient/service/provider refs — keeps the response shape
    // identical to GET /appointments.
    const populated = await this.appointmentModel.findById(appointment._id);
    if (!populated) throw new NotFoundException('Appointment not found');

    await this.writeHistory(populated, {
      action: AppointmentHistoryAction.Created,
      toDate: appointment.date,
      toTime: appointment.time,
      toStatus: appointment.status,
      actor: createdBy
        ? AppointmentHistoryActor.Staff
        : AppointmentHistoryActor.Patient,
      changedBy: createdBy,
    });

    // Fire confirmation SMS + schedule 24h/2h reminders (non-blocking)
    try {
      await this.remindersService.sendBookingConfirmation(populated);
      await this.remindersService.scheduleReminders(populated);
    } catch {
      // Log but don't fail — SMS is non-critical
    }

    return populated;
  }

  async updateStatus(
    orgId: string,
    id: string,
    newStatus: AppointmentStatus,
    ctx: ChangeContext = {},
  ): Promise<AppointmentDocument> {
    const apt = await this.findById(orgId, id);
    const allowed = VALID_TRANSITIONS[apt.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${apt.status}' to '${newStatus}'`,
      );
    }
    const fromStatus = apt.status;
    apt.status = newStatus;
    const saved = await apt.save();

    await this.writeHistory(saved, {
      action: AppointmentHistoryAction.StatusChanged,
      fromStatus,
      toStatus: newStatus,
      actor: ctx.actor ?? AppointmentHistoryActor.Staff,
      changedBy: ctx.changedBy,
    });
    // Refetch so the schema's pre-find hook resolves the refs.
    const populated = await this.appointmentModel.findById(saved._id);
    return populated ?? saved;
  }

  async reschedule(
    orgId: string,
    id: string,
    dto: RescheduleDto,
    ctx: ChangeContext = {},
  ): Promise<AppointmentDocument> {
    const apt = await this.findById(orgId, id);
    if (
      [
        AppointmentStatus.Cancelled,
        AppointmentStatus.NoShow,
        AppointmentStatus.Arrived,
      ].includes(apt.status)
    ) {
      throw new BadRequestException(
        `Cannot reschedule a ${apt.status} appointment`,
      );
    }

    const normalizedDate = normalizeUtcDateKey(dto.date);
    const normalizedTime = normalizeTimeKey(dto.time);
    if (!normalizedDate || !normalizedTime) {
      throw new BadRequestException('Invalid date or time format');
    }

    if (apt.date === normalizedDate && apt.time === normalizedTime) {
      throw new BadRequestException('New slot is the same as the current slot');
    }

    await this.checkSlotAvailable(orgId, normalizedDate, normalizedTime, apt.providerId, id);

    // Cancel old reminders before updating
    try {
      await this.remindersService.cancelReminders(id);
    } catch {
      /* non-critical */
    }

    const fromDate = apt.date;
    const fromTime = apt.time;
    const fromStatus = apt.status;

    apt.date = normalizedDate;
    apt.time = normalizedTime;
    apt.status = AppointmentStatus.Rescheduled;
    apt.rescheduleCount = (apt.rescheduleCount || 0) + 1;
    apt.lastRescheduledAt = new Date();
    const saved = await apt.save();

    await this.writeHistory(saved, {
      action: AppointmentHistoryAction.Rescheduled,
      fromDate,
      fromTime,
      toDate: saved.date,
      toTime: saved.time,
      fromStatus,
      toStatus: saved.status,
      reason: dto.reason,
      actor: ctx.actor ?? AppointmentHistoryActor.Staff,
      changedBy: ctx.changedBy,
    });

    // Schedule new reminders for the new time + send rescheduled notification
    try {
      await this.remindersService.sendRescheduleNotification(saved);
      await this.remindersService.scheduleReminders(saved);
    } catch {
      /* non-critical */
    }

    return saved;
  }

  async reconfirm(
    orgId: string,
    id: string,
    ctx: ChangeContext = {},
  ): Promise<AppointmentDocument> {
    const apt = await this.findById(orgId, id);
    if (apt.status !== AppointmentStatus.Rescheduled) {
      throw new BadRequestException(
        `Only a rescheduled appointment can be reconfirmed (current: ${apt.status})`,
      );
    }
    const fromStatus = apt.status;
    apt.status = AppointmentStatus.Confirmed;
    const saved = await apt.save();

    await this.writeHistory(saved, {
      action: AppointmentHistoryAction.StatusChanged,
      fromStatus,
      toStatus: saved.status,
      actor: ctx.actor ?? AppointmentHistoryActor.Patient,
      changedBy: ctx.changedBy,
    });

    // Send confirmation email + SMS on reconfirmation
    try {
      await this.remindersService.sendBookingConfirmation(saved);
    } catch {
      /* non-blocking */
    }

    return saved;
  }

  async cancel(
    orgId: string,
    id: string,
    dto: CancelDto = {},
    ctx: ChangeContext = {},
  ): Promise<AppointmentDocument> {
    const apt = await this.findById(orgId, id);
    if (apt.status === AppointmentStatus.Cancelled) {
      return apt;
    }

    // Cancel any pending/scheduled reminders
    try {
      await this.remindersService.cancelReminders(id);
    } catch {
      /* non-critical */
    }

    const fromStatus = apt.status;
    apt.status = AppointmentStatus.Cancelled;
    apt.cancelledAt = new Date();
    apt.cancelReason = dto.reason || '';
    const saved = await apt.save();

    await this.writeHistory(saved, {
      action: AppointmentHistoryAction.Cancelled,
      fromStatus,
      toStatus: saved.status,
      reason: dto.reason,
      actor: ctx.actor ?? AppointmentHistoryActor.Staff,
      changedBy: ctx.changedBy,
    });

    try {
      await this.remindersService.sendCancellationNotification(saved);
    } catch {
      /* non-critical */
    }

    return saved;
  }

  async sendConfirmationSms(
    orgId: string,
    id: string,
  ): Promise<AppointmentDocument> {
    await this.findById(orgId, id);
    return this.remindersService.sendManualBookingConfirmation(orgId, id);
  }

  async getStats(orgId: string, period?: string) {
    const oid = new Types.ObjectId(orgId);
    const filter: any = { orgId: oid };

    if (period === 'today') {
      filter.date = formatUtcDateKey(new Date());
    } else if (period === 'week') {
      const today = new Date();
      const weekEnd = addUtcDays(today, 7);
      filter.date = {
        $gte: formatUtcDateKey(today),
        $lte: formatUtcDateKey(weekEnd),
      };
    }

    const appointments = await this.appointmentModel.find(filter).exec();

    const historyFilter: any = { orgId: oid };
    if (filter.date) {
      historyFilter.changedAt =
        typeof filter.date === 'string'
          ? {
              $gte: new Date(`${filter.date}T00:00:00.000Z`),
              $lt: new Date(`${filter.date}T23:59:59.999Z`),
            }
          : {
              $gte: new Date(`${filter.date.$gte}T00:00:00.000Z`),
              $lte: new Date(`${filter.date.$lte}T23:59:59.999Z`),
            };
    }

    const historyAgg = await this.historyModel.aggregate<{
      _id: AppointmentHistoryAction;
      count: number;
    }>([
      { $match: historyFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]);

    const actionCounts = historyAgg.reduce<
      Partial<Record<AppointmentHistoryAction, number>>
    >((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    return {
      total: appointments.length,
      confirmed: appointments.filter(
        (a) =>
          a.status === AppointmentStatus.Confirmed ||
          a.status === AppointmentStatus.Arrived,
      ).length,
      pending: appointments.filter(
        (a) => a.status === AppointmentStatus.Pending,
      ).length,
      rescheduled: appointments.filter(
        (a) => a.status === AppointmentStatus.Rescheduled,
      ).length,
      noShow: appointments.filter((a) => a.status === AppointmentStatus.NoShow)
        .length,
      cancelled: appointments.filter(
        (a) => a.status === AppointmentStatus.Cancelled,
      ).length,
      events: {
        rescheduled: actionCounts[AppointmentHistoryAction.Rescheduled] || 0,
        cancelled: actionCounts[AppointmentHistoryAction.Cancelled] || 0,
        created: actionCounts[AppointmentHistoryAction.Created] || 0,
        statusChanged:
          actionCounts[AppointmentHistoryAction.StatusChanged] || 0,
      },
    };
  }

  async getAppointmentHistory(orgId: string, id: string) {
    await this.findById(orgId, id);
    return this.historyModel
      .find({ appointmentId: new Types.ObjectId(id) })
      .sort({ changedAt: -1 })
      .exec();
  }

  async getPatientHistoryByPhone(orgId: string, phone: string) {
    const oid = new Types.ObjectId(orgId);
    const patient = await this.patientsService.findByPhone(oid, phone);
    const aptFilter: Record<string, unknown> = { orgId: oid };
    if (patient) {
      aptFilter.patientId = patient._id;
    } else {
      // No patient row yet — return empty result
      return {
        patientPhone: phone,
        totals: { rescheduled: 0, cancelled: 0, appointments: 0 },
        appointments: [],
        events: [],
      };
    }
    const [events, appointments] = await Promise.all([
      this.historyModel
        .find({ orgId: oid, patientPhone: phone })
        .sort({ changedAt: -1 })
        .exec(),
      this.appointmentModel
        .find(aptFilter)
        .select('_id date time status rescheduleCount lastRescheduledAt')
        .exec(),
    ]);

    const totals = events.reduce(
      (acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      patientPhone: phone,
      totals: {
        rescheduled: totals[AppointmentHistoryAction.Rescheduled] || 0,
        cancelled: totals[AppointmentHistoryAction.Cancelled] || 0,
        appointments: appointments.length,
      },
      appointments,
      events,
    };
  }

  async checkSlotAvailable(
    orgId: string,
    date: string,
    time: string,
    providerId?: string | Types.ObjectId | null,
    excludeId?: string,
  ): Promise<void> {
    const filter: any = {
      orgId: new Types.ObjectId(orgId),
      date,
      time,
      status: { $nin: [AppointmentStatus.Cancelled] },
    };
    if (providerId) {
      filter.providerId = typeof providerId === 'string' ? new Types.ObjectId(providerId) : providerId;
    } else {
      filter.providerId = null;
    }
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.appointmentModel.findOne(filter);
    if (existing) {
      throw new ConflictException('Selected time slot is no longer available');
    }
  }

  private async writeHistory(
    apt: AppointmentDocument,
    entry: {
      action: AppointmentHistoryAction;
      fromDate?: string;
      fromTime?: string;
      toDate?: string;
      toTime?: string;
      fromStatus?: AppointmentStatus;
      toStatus?: AppointmentStatus;
      reason?: string;
      actor: AppointmentHistoryActor;
      changedBy?: string;
    },
  ): Promise<void> {
    try {
      const patientPhone = (apt.patientId as any)?.phone || '';
      await this.historyModel.create({
        appointmentId: apt._id,
        orgId: apt.orgId,
        patientPhone,
        action: entry.action,
        fromDate: entry.fromDate ?? null,
        fromTime: entry.fromTime ?? null,
        toDate: entry.toDate ?? null,
        toTime: entry.toTime ?? null,
        fromStatus: entry.fromStatus ?? null,
        toStatus: entry.toStatus ?? null,
        reason: entry.reason || '',
        actor: entry.actor,
        changedBy: entry.changedBy ? new Types.ObjectId(entry.changedBy) : null,
      });
    } catch {
      /* audit write should never break the request */
    }
  }
}
