import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { RESPONSE } from 'src/common/constants/response.constants';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;

  const mockDept = { _id: 'd1', name: 'Engineering', isActive: true };

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [{ provide: DepartmentsService, useValue: mockService }],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return correct response format', async () => {
      mockService.findAll.mockResolvedValue([mockDept]);
      const result = await controller.findAll('org1');
      expect(result).toEqual({
        message: RESPONSE.DEPARTMENTS.FETCHED,
        data: [mockDept],
      });
      expect(mockService.findAll).toHaveBeenCalledWith('org1');
    });
  });

  describe('create', () => {
    it('should return correct response format', async () => {
      mockService.create.mockResolvedValue(mockDept);
      const dto = { name: 'Engineering' };
      const result = await controller.create('org1', dto as any);
      expect(result).toEqual({
        message: RESPONSE.DEPARTMENTS.CREATED,
        data: mockDept,
      });
      expect(mockService.create).toHaveBeenCalledWith('org1', dto);
    });

    it('should propagate service errors', async () => {
      mockService.create.mockRejectedValue(new Error('Duplicate'));
      await expect(
        controller.create('org1', { name: 'Dup' } as any),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should return correct response format', async () => {
      const updated = { ...mockDept, name: 'Updated' };
      mockService.update.mockResolvedValue(updated);
      const result = await controller.update('org1', 'd1', {
        name: 'Updated',
      } as any);
      expect(result).toEqual({
        message: RESPONSE.DEPARTMENTS.UPDATED,
        data: updated,
      });
      expect(mockService.update).toHaveBeenCalledWith('org1', 'd1', {
        name: 'Updated',
      });
    });
  });

  describe('remove', () => {
    it('should return correct response format', async () => {
      mockService.remove.mockResolvedValue(undefined);
      const result = await controller.remove('org1', 'd1');
      expect(result).toEqual({ message: RESPONSE.DEPARTMENTS.DELETED });
      expect(mockService.remove).toHaveBeenCalledWith('org1', 'd1');
    });
  });
});
