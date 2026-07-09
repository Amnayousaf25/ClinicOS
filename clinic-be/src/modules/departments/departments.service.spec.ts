import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Department } from './schemas/department.schema';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDept = { _id: 'd1', name: 'Engineering', isActive: true };

  const mockModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getModelToken(Department.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return active departments', async () => {
      const chainMock = { lean: jest.fn().mockResolvedValue([mockDept]) };
      mockModel.find.mockReturnValue(chainMock);

      const result = await service.findAll('org1');
      expect(result).toEqual([mockDept]);
      expect(mockModel.find).toHaveBeenCalledWith({
        orgId: 'org1',
        isActive: true,
      });
    });
  });

  describe('create', () => {
    it('should create a department', async () => {
      mockModel.findOne.mockResolvedValue(null);
      mockModel.create.mockResolvedValue(mockDept);

      const dto = { name: 'Engineering' };
      const result = await service.create('org1', dto as any);
      expect(result).toEqual(mockDept);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        orgId: 'org1',
        name: 'Engineering',
      });
      expect(mockModel.create).toHaveBeenCalledWith({ orgId: 'org1', ...dto });
    });

    it('should throw BadRequestException for duplicate name', async () => {
      mockModel.findOne.mockResolvedValue(mockDept);

      await expect(
        service.create('org1', { name: 'Engineering' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return department', async () => {
      const updated = { ...mockDept, name: 'Updated' };
      mockModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.update('org1', 'd1', {
        name: 'Updated',
      } as any);
      expect(result).toEqual(updated);
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'd1', orgId: 'org1' },
        { name: 'Updated' },
        { new: true },
      );
    });

    it('should throw NotFoundException when department not found', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.update('org1', 'bad-id', { name: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete department', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue({
        ...mockDept,
        isActive: false,
      });

      const result = await service.remove('org1', 'd1');
      expect(result.isActive).toBe(false);
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'd1', orgId: 'org1' },
        { isActive: false },
        { new: true },
      );
    });

    it('should throw NotFoundException when department not found', async () => {
      mockModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(service.remove('org1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
