import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  formatUtcDateKey,
  normalizeTimeKey,
  normalizeUtcDateKey,
  utcWeekdayKey,
} from 'src/common/utils/date.util';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  Provider,
  ProviderDocument,
} from 'src/modules/providers/schemas/provider.schema';
import { RemindersService } from '../reminders/reminders.service';
import { ServicesService } from 'src/modules/services/services.service';
import { ClinicSettingsService } from 'src/modules/clinic-settings/clinic-settings.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PatientsService } from 'src/modules/patients/patients.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Provider.name)
    private providerModel: Model<ProviderDocument>,
    private servicesService: ServicesService,
    private settingsService: ClinicSettingsService,
    private orgsService: OrganizationsService,
    private remindersService: RemindersService,
    private patientsService: PatientsService,
  ) {}

  async getServicesBySlug(orgSlug: string) {
    const org = await this.orgsService.findBySlug(orgSlug);
    return this.servicesService.findActiveByOrg(org._id);
  }

  async getTimeSlots(orgSlug: string, date: string, serviceId?: string) {
    const org = await this.orgsService.findBySlug(orgSlug);
    const settings = await this.settingsService.getOrCreate(org._id);

    const normalizedDate = normalizeUtcDateKey(date);
    if (!normalizedDate) {
      throw new BadRequestException('Invalid date');
    }

    const dayOfWeek = utcWeekdayKey(normalizedDate);
    if (!dayOfWeek) {
      throw new BadRequestException('Invalid date');
    }

    const dayConfig = settings.availability?.[dayOfWeek];

    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    const baseSlotDuration = settings.slotDuration || 30;
    let effectiveSlotDuration = baseSlotDuration;
    if (serviceId) {
      const selectedService = await this.servicesService.findById(
        org._id.toString(),
        serviceId,
      );
      if (selectedService.duration > 0) {
        effectiveSlotDuration = selectedService.duration;
      }
    }

    const slots: { time: string; available: boolean }[] = [];

    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const existingAppointments = await this.appointmentModel
      .find({
        orgId: org._id,
        date: normalizedDate,
        providerId: null,
        status: { $nin: [AppointmentStatus.Cancelled] },
      })
      .select('time')
      .lean();
    const bookedTimes = new Set(existingAppointments.map((a) => a.time));

    const blockedTimes = new Set(
      (settings.blockedSlots || [])
        .filter((s) => s.date === normalizedDate)
        .map((s) => s.time),
    );

    for (
      let m = startMinutes;
      m + effectiveSlotDuration <= endMinutes;
      m += baseSlotDuration
    ) {
      const hours = String(Math.floor(m / 60)).padStart(2, '0');
      const mins = String(m % 60).padStart(2, '0');
      const time = `${hours}:${mins}`;

      const available = !bookedTimes.has(time) && !blockedTimes.has(time);
      slots.push({ time, available });
    }

    return slots;
  }

  async createBooking(orgSlug: string, dto: CreateBookingDto) {
    const org = await this.orgsService.findBySlug(orgSlug);
    const orgId = org._id.toString();
    const service = await this.servicesService.findById(orgId, dto.serviceId);
    const settings = await this.settingsService.getOrCreate(org._id);

    const normalizedDate = normalizeUtcDateKey(dto.date);
    const normalizedTime = normalizeTimeKey(dto.time);
    if (!normalizedDate || !normalizedTime) {
      throw new BadRequestException('Invalid date or time format');
    }

    const dayOfWeek = utcWeekdayKey(normalizedDate);
    if (!dayOfWeek) {
      throw new BadRequestException('Invalid date');
    }

    const dayConfig = settings.availability?.[dayOfWeek];
    if (!dayConfig || !dayConfig.enabled) {
      throw new BadRequestException('Clinic is closed on the selected day');
    }

    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);
    const [slotH, slotM] = normalizedTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotMinutes = slotH * 60 + slotM;
    const baseSlotDuration = settings.slotDuration || 30;

    if (
      slotMinutes < startMinutes ||
      slotMinutes + service.duration > endMinutes ||
      (slotMinutes - startMinutes) % baseSlotDuration !== 0
    ) {
      throw new BadRequestException(
        'Selected time is outside clinic availability',
      );
    }

    const isBlocked = (settings.blockedSlots || []).some(
      (s) => s.date === normalizedDate && s.time === normalizedTime,
    );
    if (isBlocked) {
      throw new BadRequestException('Selected time slot is blocked');
    }

    const existing = await this.appointmentModel.findOne({
      orgId: org._id,
      date: normalizedDate,
      time: normalizedTime,
      providerId: null,
      status: { $nin: [AppointmentStatus.Cancelled] },
    });
    if (existing) {
      throw new ConflictException('Selected time slot is no longer available');
    }

    const today = formatUtcDateKey(new Date());
    if (normalizedDate < today) {
      throw new BadRequestException('Cannot book a past date');
    }

    const patientName = `${dto.firstName} ${dto.lastName}`;
    const bookingId = crypto.randomUUID();

    // Public booking has no auth and no disambiguation step. Match on
    // phone + name together — a single phone can legitimately belong to
    // multiple patients (parent booking for children, couples sharing a
    // number). If only the phone matches but the name differs, treat as a
    // new patient and assign a fresh MRN.
    const patient = await this.patientsService.findByPhoneAndNameOrCreate({
      orgId: org._id,
      phone: dto.phone,
      name: patientName,
      email: dto.email || '',
    });

    let providerId: Types.ObjectId | null = null;

    const appointment = await this.appointmentModel.create({
      orgId: org._id,
      patientId: patient._id,
      serviceId: service._id,
      providerId,
      date: normalizedDate,
      time: normalizedTime,
      status: AppointmentStatus.Pending,
      bookingId,
      createdBy: null,
    });

    await appointment.populate([
      { path: 'patientId', select: 'name phone email' },
      { path: 'serviceId', select: 'name' },
    ]);

    try {
      await this.remindersService.sendBookingConfirmation(appointment);
      await this.remindersService.scheduleReminders(appointment);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown reminder error';
      this.logger.warn(
        `Booking confirmation reminder failed for ${appointment.bookingId}: ${message}`,
      );
    }

    return {
      bookingId: appointment.bookingId,
      patientName,
      service: service.name,
      date: normalizedDate,
      time: normalizedTime,
      clinicName: settings.clinicName || org.name,
    };
  }

  async getBookingInfo(bookingId: string): Promise<any> {
    const apt = await this.appointmentModel
      .findOne({ bookingId })
      .populate('patientId', '_id name phone email mrn')
      .populate('serviceId', '_id name');
    if (!apt) throw new NotFoundException('Booking not found');

    const settings = await this.settingsService.getOrCreate(apt.orgId);

    return { ...apt, settings };
  }
}
