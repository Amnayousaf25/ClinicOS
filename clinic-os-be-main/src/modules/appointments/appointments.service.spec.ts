import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import { AppointmentHistory } from './schemas/appointment-history.schema';
import { ServicesService } from 'src/modules/services/services.service';
import { RemindersService } from 'src/modules/reminders/reminders.service';

import { PatientsService } from 'src/modules/patients/patients.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockAppointmentModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockHistoryModel: any = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const mockServicesService = {
    findById: jest.fn(),
  };

  const mockRemindersService = {
    sendBookingConfirmation: jest.fn(),
    scheduleReminders: jest.fn(),
    cancelReminders: jest.fn(),
    sendManualBookingConfirmation: jest.fn(),
  };

  const mockPatientsService = {
    findOne: jest.fn(),
    findById: jest.fn(),
    createPatient: jest.fn(),
    updatePatient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
        {
          provide: getModelToken(AppointmentHistory.name),
          useValue: mockHistoryModel,
        },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: RemindersService, useValue: mockRemindersService },
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
    mockHistoryModel.create.mockResolvedValue({});
  });

  it('should allow valid status transition', async () => {
    const save = jest.fn().mockResolvedValue({
      _id: 'a1',
      orgId: '507f1f77bcf86cd799439011',
      patientPhone: '+10000000000',
      status: AppointmentStatus.Confirmed,
    });
    jest.spyOn(service, 'findById').mockResolvedValue({
      _id: 'a1',
      orgId: '507f1f77bcf86cd799439011',
      patientPhone: '+10000000000',
      status: AppointmentStatus.Pending,
      save,
    } as any);

    const result = await service.updateStatus(
      '507f1f77bcf86cd799439011',
      'a1',
      AppointmentStatus.Confirmed,
    );

    expect(save).toHaveBeenCalled();
    expect(result.status).toBe(AppointmentStatus.Confirmed);
  });

  it('should reject invalid status transition', async () => {
    jest.spyOn(service, 'findById').mockResolvedValue({
      _id: 'a1',
      status: AppointmentStatus.Arrived,
      save: jest.fn(),
    } as any);

    await expect(
      service.updateStatus(
        '507f1f77bcf86cd799439011',
        'a1',
        AppointmentStatus.Confirmed,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw conflict when slot already taken', async () => {
    mockAppointmentModel.findOne.mockResolvedValue({
      _id: 'a2',
      status: AppointmentStatus.Pending,
    });

    await expect(
      service.checkSlotAvailable(
        '507f1f77bcf86cd799439011',
        '2099-04-17',
        '10:00',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should allow slot when only cancelled appointment exists', async () => {
    mockAppointmentModel.findOne.mockResolvedValue(null);

    await expect(
      service.checkSlotAvailable(
        '507f1f77bcf86cd799439011',
        '2099-04-17',
        '10:00',
      ),
    ).resolves.toBeUndefined();

    expect(mockAppointmentModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2099-04-17',
        time: '10:00',
        status: { $nin: [AppointmentStatus.Cancelled] },
      }),
    );
  });
});
