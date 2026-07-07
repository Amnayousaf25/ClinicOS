import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RESPONSE } from 'src/common/constants/response.constants';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    _id: 'u1',
    name: 'Test User',
    email: 'test@test.com',
    role: 'admin',
  };

  const mockService = {
    inviteUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updatePermissions: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    exportData: jest.fn(),
    enforceHierarchy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('invite', () => {
    it('should return correct response format', async () => {
      const inviteResult = { userId: 'u1', invitationToken: 'token123' };
      mockService.inviteUser.mockResolvedValue(inviteResult);
      const dto = {
        email: 'new@test.com',
        name: 'New',
        role: 'employee',
        employeeId: 'E001',
      };
      const inviteReq = { user: { role: 'admin' } };
      const result = await controller.invite(
        'org1',
        inviteReq as any,
        dto as any,
      );
      expect(result).toEqual({
        message: RESPONSE.USERS.INVITED,
        data: inviteResult,
      });
      expect(mockService.inviteUser).toHaveBeenCalledWith('org1', 'admin', dto);
    });
  });

  describe('findAll', () => {
    it('should return correct response format', async () => {
      mockService.findAll.mockResolvedValue([mockUser]);
      const result = await controller.findAll('org1', 'dept1', 'admin');
      expect(result).toEqual({
        message: RESPONSE.USERS.FETCHED,
        data: [mockUser],
      });
      expect(mockService.findAll).toHaveBeenCalledWith('org1', {
        department: 'dept1',
        role: 'admin',
      });
    });

    it('should pass undefined filters when not provided', async () => {
      mockService.findAll.mockResolvedValue([]);
      await controller.findAll('org1', undefined, undefined);
      expect(mockService.findAll).toHaveBeenCalledWith('org1', {
        department: undefined,
        role: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('should return correct response format', async () => {
      mockService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOne('u1');
      expect(result).toEqual({
        message: RESPONSE.USERS.FETCHED,
        data: mockUser,
      });
      expect(mockService.findOne).toHaveBeenCalledWith('u1');
    });

    it('should propagate service errors', async () => {
      mockService.findOne.mockRejectedValue(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should return correct response format', async () => {
      const updated = { ...mockUser, name: 'Updated' };
      mockService.update.mockResolvedValue(updated);
      mockService.enforceHierarchy = jest.fn().mockResolvedValue(undefined);
      const dto = { name: 'Updated' };
      const updateReq = { user: { role: 'admin', _id: 'admin1' } };
      const result = await controller.update(
        'u1',
        updateReq as any,
        dto as any,
      );
      expect(result).toEqual({
        message: RESPONSE.USERS.UPDATED,
        data: updated,
      });
      expect(mockService.update).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('updatePermissions', () => {
    it('should return correct response format', async () => {
      const updated = {
        ...mockUser,
        permissionOverrides: { 'scores.self.view': true },
      };
      mockService.updatePermissions.mockResolvedValue(updated);
      const dto = {
        permissionOverrides: { 'scores.self.view': true },
      };
      const req = { user: { _id: { toString: () => 'admin1' } } };
      const result = await controller.updatePermissions(
        'u1',
        req as any,
        dto as any,
      );
      expect(result).toEqual({
        message: RESPONSE.USERS.UPDATED,
        data: updated,
      });
      expect(mockService.updatePermissions).toHaveBeenCalledWith(
        'u1',
        dto,
        'admin1',
      );
    });
  });

  describe('remove', () => {
    it('should return correct response format', async () => {
      mockService.softDelete.mockResolvedValue(undefined);
      mockService.enforceHierarchy = jest.fn().mockResolvedValue(undefined);
      const adminReq = {
        user: { _id: { toString: () => 'admin1' }, role: 'admin' },
      };
      const result = await controller.remove('u1', adminReq as any);
      expect(result).toEqual({ message: RESPONSE.USERS.DELETED });
      expect(mockService.softDelete).toHaveBeenCalledWith('u1');
    });
  });

  describe('restore', () => {
    it('should return correct response format', async () => {
      mockService.restore.mockResolvedValue(mockUser);
      const result = await controller.restore('u1');
      expect(result).toEqual({
        message: RESPONSE.USERS.RESTORED,
        data: mockUser,
      });
      expect(mockService.restore).toHaveBeenCalledWith('u1');
    });
  });

  describe('export', () => {
    it('should return correct response format', async () => {
      mockService.exportData.mockResolvedValue(mockUser);
      const result = await controller.export('u1');
      expect(result).toEqual({
        message: RESPONSE.USERS.EXPORTED,
        data: mockUser,
      });
      expect(mockService.exportData).toHaveBeenCalledWith('u1');
    });
  });
});
