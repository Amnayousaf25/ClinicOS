import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { RESPONSE } from 'src/common/constants/response.constants';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  PERMISSIONS_METADATA_KEY,
  PERMISSIONS_MODE_METADATA_KEY,
} from 'src/common/permissions/permissions.decorator';
import { PERMISSIONS } from 'src/common/permissions';

describe('IntakeController', () => {
  let controller: IntakeController;

  const mockService = {
    getPublicAppointmentInfo: jest.fn(),
    submitForm: jest.fn(),
    getSubmission: jest.fn(),
    updateSubmission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntakeController],
      providers: [
        { provide: IntakeService, useValue: mockService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<IntakeController>(IntakeController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return appointment info response shape', async () => {
    mockService.getPublicAppointmentInfo.mockResolvedValue({
      appointmentId: 'a1',
    });

    const result = await controller.getPublicAppointmentInfo('a1');

    expect(result).toEqual({
      message: RESPONSE.INTAKE.INFO_FETCHED,
      data: { appointmentId: 'a1' },
    });
    expect(mockService.getPublicAppointmentInfo).toHaveBeenCalledWith('a1');
  });

  it('should pass ip address on submit', async () => {
    mockService.submitForm.mockResolvedValue({ success: true, formId: 'f1' });

    const result = await controller.submitForm(
      { appointmentId: 'a1', consent: true } as any,
      { ip: '127.0.0.1' } as any,
    );

    expect(result).toEqual({
      message: RESPONSE.INTAKE.SUBMITTED,
      data: { success: true, formId: 'f1' },
    });
    expect(mockService.submitForm).toHaveBeenCalledWith(
      { appointmentId: 'a1', consent: true },
      undefined,
      '127.0.0.1',
    );
  });

  it('should scope protected submission reads by org', async () => {
    mockService.getSubmission.mockResolvedValue({ _id: 'form-1' });

    const result = await controller.getSubmission('a1', 'org-1');

    expect(result).toEqual({
      message: RESPONSE.INTAKE.FORM_FETCHED,
      data: { _id: 'form-1' },
    });
    expect(mockService.getSubmission).toHaveBeenCalledWith('a1', 'org-1');
  });

  it('should have auth and permissions guards on getSubmission', () => {
    const handler =
      Object.getOwnPropertyDescriptor(
        IntakeController.prototype,
        'getSubmission',
      )?.value ?? (() => undefined);

    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as Array<
      new (...args: never[]) => unknown
    >;

    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(PermissionsGuard);
  });

  it('should require INTAKE_VIEW permission on getSubmission', () => {
    const handler =
      Object.getOwnPropertyDescriptor(
        IntakeController.prototype,
        'getSubmission',
      )?.value ?? (() => undefined);

    const requiredPermissions = Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      handler,
    ) as string[];
    const mode = Reflect.getMetadata(
      PERMISSIONS_MODE_METADATA_KEY,
      handler,
    ) as string;

    expect(requiredPermissions).toEqual([PERMISSIONS.INTAKE_VIEW]);
    expect(mode).toBe('any');
  });
});
