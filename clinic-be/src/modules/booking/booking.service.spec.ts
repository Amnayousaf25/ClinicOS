import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  Appointment,
  AppointmentStatus,
} from 'src/modules/appointments/schemas/appointment.schema';
import { RemindersService } from '../reminders/reminders.service';
import { ServicesService } from 'src/modules/services/services.service';
import { ClinicSettingsService } from 'src/modules/clinic-settings/clinic-settings.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';

import { Provider } from 'src/modules/providers/schemas/provider.schema';
import { PatientsService } from 'src/modules/patients/patients.service';

describe('BookingService', () => {
  let service: BookingService;

  const mockAppointmentModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockProviderModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockServicesService = {
    findById: jest.fn(),
    findActiveByOrg: jest.fn(),
  };

  const mockSettingsService = {
    getOrCreate: jest.fn(),
  };

  const mockOrgsService = {
    findBySlug: jest.fn(),
  };

  const mockRemindersService = {
    sendBookingConfirmation: jest.fn(),
  };

  const mockPatientsService = {
    findOne: jest.fn(),
    findByPhoneAndNameOrCreate: jest.fn().mockResolvedValue({ _id: 'p-1' }),
  };

  const baseSettings = {
    slotDuration: 30,
    clinicName: 'Clinic',
    availability: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: true, start: '09:00', end: '17:00' },
      sunday: { enabled: true, start: '09:00', end: '17:00' },
    },
    blockedSlots: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: ClinicSettingsService, useValue: mockSettingsService },
        { provide: OrganizationsService, useValue: mockOrgsService },
        { provide: RemindersService, useValue: mockRemindersService },
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    jest.clearAllMocks();

    mockOrgsService.findBySlug.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Clinic Org',
    });
    mockServicesService.findById.mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      name: 'Consultation',
      duration: 30,
    });

    const findChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    mockAppointmentModel.find.mockReturnValue(findChain);
    mockAppointmentModel.findOne.mockResolvedValue(null);
    mockAppointmentModel.create.mockResolvedValue({
      _id: 'a1',
      bookingId: 'b-1',
      populate: jest.fn().mockReturnThis(),
    });
  });

  it('should send booking confirmation after creating a booking', async () => {
    mockSettingsService.getOrCreate.mockResolvedValue(baseSettings);

    await service.createBooking('clinic', {
      serviceId: '507f1f77bcf86cd799439012',
      date: '2099-04-17',
      time: '10:00',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+14155552671',
    } as any);

    expect(mockRemindersService.sendBookingConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'b-1' }),
    );
  });

  it('should throw for invalid date in getTimeSlots', async () => {
    mockSettingsService.getOrCreate.mockResolvedValue(baseSettings);

    await expect(service.getTimeSlots('clinic', '2026-99-99')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when clinic is closed for selected day', async () => {
    mockSettingsService.getOrCreate.mockResolvedValue({
      ...baseSettings,
      availability: {},
    });

    await expect(
      service.createBooking('clinic', {
        serviceId: '507f1f77bcf86cd799439012',
        date: '2099-04-17',
        time: '10:00',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+14155552671',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when selected slot is blocked', async () => {
    mockSettingsService.getOrCreate.mockResolvedValue({
      ...baseSettings,
      blockedSlots: [{ date: '2099-04-17', time: '10:00' }],
    });

    await expect(
      service.createBooking('clinic', {
        serviceId: '507f1f77bcf86cd799439012',
        date: '2099-04-17',
        time: '10:00',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+14155552671',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw conflict when selected slot is already booked', async () => {
    mockSettingsService.getOrCreate.mockResolvedValue(baseSettings);
    mockAppointmentModel.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      status: AppointmentStatus.Confirmed,
    });

    await expect(
      service.createBooking('clinic', {
        serviceId: '507f1f77bcf86cd799439012',
        date: '2099-04-17',
        time: '10:00',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+14155552671',
      } as any),
    ).rejects.toThrow(ConflictException);
  });
});
