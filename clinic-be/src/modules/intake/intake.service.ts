import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { IntakeForm, IntakeFormDocument } from './schemas/intake-form.schema';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  AppointmentType,
  IntakeStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  AppointmentHistory,
  AppointmentHistoryAction,
  AppointmentHistoryActor,
  AppointmentHistoryDocument,
} from 'src/modules/appointments/schemas/appointment-history.schema';
import { ClinicSettingsService } from 'src/modules/clinic-settings/clinic-settings.service';
import { ServicesService } from 'src/modules/services/services.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { PatientsService } from 'src/modules/patients/patients.service';
import { SubmitIntakeDto } from './dto/submit-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';

@Injectable()
export class IntakeService implements OnModuleInit {
  private readonly logger = new Logger(IntakeService.name);

  constructor(
    @InjectModel(IntakeForm.name)
    private intakeModel: Model<IntakeFormDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(AppointmentHistory.name)
    private historyModel: Model<AppointmentHistoryDocument>,
    private settingsService: ClinicSettingsService,
    private servicesService: ServicesService,
    private providersService: ProvidersService,
    private patientsService: PatientsService,
  ) {}

  async onModuleInit() {
    try {
      await this.intakeModel.collection.dropIndex('bookingId_1');
      this.logger.log(
        'Successfully dropped stale bookingId_1 index on intakeforms collection',
      );
    } catch (err: any) {
      if (err.codeName !== 'IndexNotFound' && err.code !== 27) {
        this.logger.warn(`Failed to drop bookingId_1 index: ${err.message}`);
      }
    }
  }

  private async findAppointment(
    appointmentId: string,
  ): Promise<AppointmentDocument> {
    const apt = await this.appointmentModel
      .findById(appointmentId)
      .populate('patientId', '_id name phone email mrn')
      .populate('serviceId', '_id name');
    if (!apt) throw new NotFoundException('Appointment not found');
    return apt;
  }

  private async findScopedAppointment(
    orgId: string,
    appointmentId: string,
  ): Promise<AppointmentDocument> {
    const apt = await this.appointmentModel
      .findOne({
        _id: appointmentId,
        orgId: new Types.ObjectId(orgId),
      })
      .populate('patientId', '_id name phone email mrn')
      .populate('serviceId', '_id name');
    if (!apt) throw new NotFoundException('Appointment not found');
    return apt;
  }

  private async persistSubmission(
    apt: AppointmentDocument,
    dto: SubmitIntakeDto,
    ipAddress?: string,
  ) {
    if (dto.dob > new Date().toISOString().split('T')[0]) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    if (apt.status === AppointmentStatus.Cancelled) {
      throw new BadRequestException(
        'Cannot submit intake for a cancelled appointment',
      );
    }

    if (
      apt.intakeStatus === IntakeStatus.Confirmed ||
      apt.intakeStatus === IntakeStatus.Submitted
    ) {
      throw new ConflictException(
        'Intake form already submitted for this booking',
      );
    }

    // If we still have an IntakeForm row but the appointment isn't in
    // Submitted state, the previous attempt didn't fully commit (e.g.
    // SMS or status update failed after the form was created). Treat
    // this as an idempotent retry rather than a hard conflict — drop
    // the stale row so the create below succeeds.
    await this.intakeModel.deleteOne({ appointmentId: apt._id });

    let patient;
    if (apt.patientId) {
      // Appointment already linked to a patient — update their record
      // with whatever the intake form has changed.
      patient = await this.patientsService.updatePatient(
        apt.orgId,
        apt.patientId,
        {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          dob: dto.dob,
          address: dto.address,
          insuranceProvider: dto.insuranceProvider,
          insuranceNumber: dto.insuranceNumber,
          allergies: dto.allergies,
          medications: dto.medications,
          emergencyContact: dto.emergencyContact,
          emergencyPhone: dto.emergencyPhone,
        },
      );
    } else if (dto.patientId) {
      patient = await this.patientsService.updatePatient(
        apt.orgId,
        dto.patientId,
        {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          dob: dto.dob,
          address: dto.address,
          insuranceProvider: dto.insuranceProvider,
          insuranceNumber: dto.insuranceNumber,
          allergies: dto.allergies,
          medications: dto.medications,
          emergencyContact: dto.emergencyContact,
          emergencyPhone: dto.emergencyPhone,
        },
      );
    } else {
      patient = await this.patientsService.createPatient({
        orgId: apt.orgId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        dob: dto.dob,
        address: dto.address,
        insuranceProvider: dto.insuranceProvider,
        insuranceNumber: dto.insuranceNumber,
        allergies: dto.allergies,
        medications: dto.medications,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
      });
    }

    let form: IntakeFormDocument;
    try {
      form = await this.intakeModel.create({
        orgId: apt.orgId,
        appointmentId: apt._id,
        patientId: patient._id,
        name: dto.name,
        dob: dto.dob,
        phone: dto.phone,
        email: dto.email,
        address: dto.address || '',
        reasonForVisit: dto.reasonForVisit,
        consent: dto.consent,
        insuranceProvider: dto.insuranceProvider || '',
        insuranceNumber: dto.insuranceNumber || '',
        allergies: dto.allergies || '',
        medications: dto.medications || '',
        emergencyContact: dto.emergencyContact || '',
        emergencyPhone: dto.emergencyPhone || '',
        submittedAt: new Date(),
        ipAddress: ipAddress || null,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException(
          'Intake form already submitted for this booking',
        );
      }
      throw error;
    }

    apt.patientId = patient._id as Types.ObjectId;
    apt.intakeStatus = IntakeStatus.Submitted;

    // Automatically transition to IntakeSubmitted whenever the patient
    // submits the intake form — regardless of whether it is the same day.
    // Staff can then manually mark the patient as Arrived when they walk in.
    const previousStatus = apt.status;
    if (
      apt.status === AppointmentStatus.Pending ||
      apt.status === AppointmentStatus.Confirmed ||
      apt.status === AppointmentStatus.Rescheduled
    ) {
      apt.status = AppointmentStatus.IntakeSubmitted;
    }

    await apt.save();

    if (previousStatus !== apt.status) {
      try {
        const intakePatient = apt.patientId as unknown as {
          phone?: string;
        } | null;
        await this.historyModel.create({
          appointmentId: apt._id,
          orgId: apt.orgId,
          patientPhone:
            intakePatient && typeof intakePatient === 'object'
              ? intakePatient.phone || ''
              : '',
          action: AppointmentHistoryAction.StatusChanged,
          fromStatus: previousStatus,
          toStatus: apt.status,
          reason: 'Intake form submitted',
          actor: AppointmentHistoryActor.Patient,
          changedBy: null,
        });
      } catch {
        /* audit failure is non-critical */
      }
    }

    return form;
  }

  private async ensureStaffAppointment(
    orgId: string,
    dto: SubmitIntakeDto,
  ): Promise<AppointmentDocument> {
    if (dto.appointmentId) {
      return this.findScopedAppointment(orgId, dto.appointmentId);
    }

    if (!orgId) {
      throw new BadRequestException(
        'appointmentId is required for public intake submission',
      );
    }

    if (!dto.serviceId) {
      throw new BadRequestException('serviceId is required for walk-ins');
    }

    const oid = new Types.ObjectId(orgId);
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toISOString().slice(11, 16);

    const service = await this.servicesService.findById(orgId, dto.serviceId);

    let providerObjectId: Types.ObjectId | null = null;
    if (dto.providerId) {
      const provider = await this.providersService.findById(
        orgId,
        dto.providerId,
      );
      providerObjectId = provider._id;
    }

    // Walk-in patient: link to existing if dto.patientId provided
    // (staff picked from search), otherwise create new with fresh MRN.
    const patient = dto.patientId
      ? await this.patientsService.updatePatient(oid, dto.patientId, {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
        })
      : await this.patientsService.createPatient({
          orgId: oid,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
        });

    return this.appointmentModel.create({
      orgId: oid,
      patientId: patient._id,
      serviceId: service._id,
      providerId: providerObjectId,
      date,
      time,
      status: AppointmentStatus.Arrived,
      appointmentType: AppointmentType.WalkIn,
      intakeStatus: IntakeStatus.NotSent,
      bookingId: crypto.randomUUID(),
      notes: '',
    });
  }

  async getPublicAppointmentInfo(appointmentId: string) {
    const apt = await this.findAppointment(appointmentId);

    const settings = await this.settingsService.getOrCreate(apt.orgId);

    const publicPatient = apt.patientId as unknown as { name?: string } | null;
    const publicService = apt.serviceId as unknown as { name?: string } | null;
    return {
      appointmentId: String(apt._id),
      patientName: publicPatient?.name || '',
      service: publicService?.name || '',
      date: apt.date,
      time: apt.time,
      clinicName: settings.clinicName || '',
      intakeFormSubmitted:
        apt.intakeStatus === IntakeStatus.Confirmed ||
        apt.intakeStatus === IntakeStatus.Submitted,
      insuranceProviders: (settings as any).insuranceProviders || [],
    };
  }

  async submitForm(dto: SubmitIntakeDto, orgId?: string, ipAddress?: string) {
    const apt = dto.appointmentId
      ? await this.findAppointment(dto.appointmentId)
      : await this.ensureStaffAppointment(orgId || '', dto);
    return this.persistSubmission(apt, dto, ipAddress);
  }

  async getSubmission(appointmentId: string, orgId: string | Types.ObjectId) {
    const scopedOrgId =
      typeof orgId === 'string' ? new Types.ObjectId(orgId) : orgId;
    const form = await this.intakeModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
      orgId: scopedOrgId,
    });
    if (!form) throw new NotFoundException('Intake form not found');
    return form;
  }

  async updateSubmission(
    appointmentId: string,
    orgId: string | Types.ObjectId,
    dto: UpdateIntakeDto,
  ) {
    const scopedOrgId =
      typeof orgId === 'string' ? new Types.ObjectId(orgId) : orgId;
    const form = await this.intakeModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
      orgId: scopedOrgId,
    });
    if (!form) throw new NotFoundException('Intake form not found');

    if (dto.dob && dto.dob > new Date().toISOString().split('T')[0]) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    Object.assign(form, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.dob !== undefined ? { dob: dto.dob } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.reasonForVisit !== undefined
        ? { reasonForVisit: dto.reasonForVisit }
        : {}),
      ...(dto.consent !== undefined ? { consent: dto.consent } : {}),
      ...(dto.insuranceProvider !== undefined
        ? { insuranceProvider: dto.insuranceProvider }
        : {}),
    });
    await form.save();

    // Push patient-level changes through to the Patient record, so the
    // canonical profile stays in sync when staff corrects the intake.
    const appointment = await this.appointmentModel.findOne({
      _id: form.appointmentId,
      orgId: scopedOrgId,
    });
    if (appointment?.patientId) {
      await this.patientsService.updatePatient(
        scopedOrgId,
        appointment.patientId,
        {
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
        },
      );
    }

    return form;
  }
}
