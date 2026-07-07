import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { IntakeService } from './intake.service';
import { IntakeForm } from './schemas/intake-form.schema';
import {
  Appointment,
  AppointmentStatus,
  IntakeStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import { AppointmentHistory } from 'src/modules/appointments/schemas/appointment-history.schema';
import { ClinicSettingsService } from 'src/modules/clinic-settings/clinic-settings.service';
import { ServicesService } from 'src/modules/services/services.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { PatientsService } from 'src/modules/patients/patients.service';

describe('IntakeService', () => {
  let service: IntakeService;

  const mockIntakeModel: any = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  };
  const mockAppointmentModel: any = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const mockHistoryModel: any = {
    create: jest.fn().mockResolvedValue({}),
  };
  const mockSettingsService = { getOrCreate: jest.fn() };
  const mockServicesService = { findById: jest.fn() };
  const mockProvidersService = { findById: jest.fn() };
  const mockPatientsService = {
    upsertFromIntake: jest
      .fn()
      .mockResolvedValue({ _id: new Types.ObjectId() }),
    createPatient: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    updatePatient: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  };

  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const makeAppointment = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(),
    orgId: new Types.ObjectId(),
    patientId: null,
    serviceName: 'Consultation',
    date: today,
    time: '10:00',
    status: AppointmentStatus.Confirmed,
    intakeStatus: IntakeStatus.NotSent,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  const baseDto = {
    name: 'Jane Doe',
    dob: '1990-01-01',
    phone: '+14155552671',
    email: 'jane@example.com',
    reasonForVisit: 'Consultation about symptoms',
    consent: true,
  };

  const mockFindAppointment = (appointment: unknown) => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) => resolve(appointment),
      catch: jest.fn(),
    };
    mockAppointmentModel.findById.mockReturnValue(query);
    return query;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntakeService,
        { provide: getModelToken(IntakeForm.name), useValue: mockIntakeModel },
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
        {
          provide: getModelToken(AppointmentHistory.name),
          useValue: mockHistoryModel,
        },
        { provide: ClinicSettingsService, useValue: mockSettingsService },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: ProvidersService, useValue: mockProvidersService },
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    service = module.get<IntakeService>(IntakeService);
    jest.clearAllMocks();
    mockIntakeModel.create.mockResolvedValue({ _id: 'form-1' });
    mockIntakeModel.findOne.mockResolvedValue(null);
    mockHistoryModel.create.mockResolvedValue({});
    mockPatientsService.upsertFromIntake.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    mockPatientsService.createPatient.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    mockPatientsService.updatePatient.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
  });

  it('throws NotFound when appointmentId is given but not found', async () => {
    mockFindAppointment(null);

    await expect(
      service.submitForm({
        ...baseDto,
        appointmentId: '507f1f77bcf86cd799439099',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects intake on cancelled appointments', async () => {
    mockFindAppointment(
      makeAppointment({ status: AppointmentStatus.Cancelled }),
    );

    await expect(
      service.submitForm({
        ...baseDto,
        appointmentId: '507f1f77bcf86cd799439099',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Same-day rule for auto-arrived ──────────────────────────────────────

  it('auto-transitions to arrived when intake is submitted on the appointment date', async () => {
    const apt = makeAppointment({ date: today });
    mockFindAppointment(apt);

    await service.submitForm({
      ...baseDto,
      appointmentId: String(apt._id),
    } as any);

    expect(apt.status).toBe(AppointmentStatus.Arrived);
    expect(apt.intakeStatus).toBe(IntakeStatus.Confirmed);
    expect(mockHistoryModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toStatus: AppointmentStatus.Arrived,
        reason: 'Intake form submitted',
      }),
    );
  });

  it('does NOT auto-arrive when intake is submitted before the appointment date', async () => {
    const apt = makeAppointment({
      date: futureDate,
      status: AppointmentStatus.Confirmed,
    });
    mockFindAppointment(apt);

    await service.submitForm({
      ...baseDto,
      appointmentId: String(apt._id),
    } as any);

    expect(apt.status).toBe(AppointmentStatus.Confirmed); // unchanged
    expect(apt.intakeStatus).toBe(IntakeStatus.Confirmed);
    expect(mockHistoryModel.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'Intake form submitted' }),
    );
  });

  it('rejects DOB in the future', async () => {
    mockFindAppointment(makeAppointment());

    await expect(
      service.submitForm({
        ...baseDto,
        dob: '2999-01-01',
        appointmentId: '507f1f77bcf86cd799439099',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('replaces stale intake rows when appointment is still pending intake', async () => {
    const apt = makeAppointment({
      status: AppointmentStatus.Pending,
      intakeStatus: IntakeStatus.Pending,
    });
    mockFindAppointment(apt);

    await service.submitForm({
      ...baseDto,
      appointmentId: String(apt._id),
    } as any);

    expect(mockIntakeModel.deleteOne).toHaveBeenCalledWith({
      appointmentId: apt._id,
    });
    expect(mockIntakeModel.create).toHaveBeenCalled();
    expect(apt.intakeStatus).toBe(IntakeStatus.Confirmed);
  });
});
