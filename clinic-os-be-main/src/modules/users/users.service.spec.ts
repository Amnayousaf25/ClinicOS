import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { Organization } from 'src/modules/organizations/schemas/organization.schema';
import { EmailService } from 'src/modules/email/services/email-service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: 'u1',
    name: 'Test User',
    email: 'test@test.com',
    role: 'admin',
    password: 'hashed',
    invitationToken: 'token',
    deletedAt: null,
    isActive: true,
    save: jest.fn(),
  };

  const mockUserModel: any = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    collection: {
      indexes: jest.fn().mockResolvedValue([]),
      dropIndex: jest.fn().mockResolvedValue(undefined),
      createIndex: jest.fn().mockResolvedValue('index'),
    },
  };

  const mockOrgModel: any = {
    findById: jest.fn(),
  };

  const mockEmailService = {
    loadTemplate: jest.fn().mockReturnValue('<p>invite</p>'),
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Organization.name), useValue: mockOrgModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('inviteUser', () => {
    it('should create user with invitation token', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const createdUser = { _id: 'new-id', email: 'new@test.com' };
      mockUserModel.create.mockResolvedValue(createdUser);

      const dto = {
        email: 'new@test.com',
        name: 'New User',
        role: 'employee',
        employeeId: 'E001',
      };
      const result = await service.inviteUser('org1', 'admin', dto as any);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('invitationToken');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        orgId: 'org1',
        email: 'new@test.com',
        deletedAt: null,
      });
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@test.com',
        name: 'Dup',
        role: 'employee',
        employeeId: 'E002',
      };
      await expect(
        service.inviteUser('org1', 'admin', dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a soft-deleted email to be invited again', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        _id: 'new-id',
        email: 'test@test.com',
      });

      await service.inviteUser('org1', 'admin', {
        email: 'test@test.com',
        name: 'Re Invite',
        role: 'employee',
        employeeId: 'E003',
      } as any);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        orgId: 'org1',
        email: 'test@test.com',
        deletedAt: null,
      });
      expect(mockUserModel.create).toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('rebuilds stale user unique indexes as soft-delete-aware partial indexes', async () => {
      mockUserModel.collection.indexes.mockResolvedValue([
        { name: 'orgId_1_email_1', unique: true },
        { name: 'orgId_1_employeeId_1', unique: true },
      ]);

      await service.onModuleInit();

      expect(mockUserModel.collection.dropIndex).toHaveBeenCalledWith(
        'orgId_1_email_1',
      );
      expect(mockUserModel.collection.dropIndex).toHaveBeenCalledWith(
        'orgId_1_employeeId_1',
      );
      expect(mockUserModel.collection.createIndex).toHaveBeenCalledWith(
        { orgId: 1, email: 1 },
        {
          unique: true,
          partialFilterExpression: { deletedAt: null },
          name: 'orgId_1_email_1',
        },
      );
    });

    it('does not drop indexes that are already soft-delete-aware', async () => {
      mockUserModel.collection.indexes.mockResolvedValue([
        {
          name: 'orgId_1_email_1',
          unique: true,
          partialFilterExpression: { deletedAt: null },
        },
        {
          name: 'orgId_1_employeeId_1',
          unique: true,
          partialFilterExpression: { deletedAt: null },
        },
      ]);

      await service.onModuleInit();

      expect(mockUserModel.collection.dropIndex).not.toHaveBeenCalled();
      expect(mockUserModel.collection.createIndex).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return users with filters applied', async () => {
      const chainMock = {
        select: jest.fn().mockReturnValue({
          populate: jest
            .fn()
            .mockReturnValue({ lean: jest.fn().mockResolvedValue([mockUser]) }),
        }),
      };
      mockUserModel.find.mockReturnValue(chainMock);
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: 'owner-1' }),
        }),
      });

      const result = await service.findAll('org1', {
        department: 'dept1',
        role: 'admin',
      });

      expect(result).toEqual([{ ...mockUser, isOrgOwner: false }]);
      expect(mockUserModel.find).toHaveBeenCalledWith({
        orgId: 'org1',
        deletedAt: null,
        $or: [{ isActive: true }, { status: 'ACTIVE' }],
        department: 'dept1',
        role: 'admin',
      });
    });

    it('should return users without optional filters', async () => {
      const chainMock = {
        select: jest.fn().mockReturnValue({
          populate: jest
            .fn()
            .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        }),
      };
      mockUserModel.find.mockReturnValue(chainMock);
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: null }),
        }),
      });

      await service.findAll('org1', {});
      expect(mockUserModel.find).toHaveBeenCalledWith({
        orgId: 'org1',
        deletedAt: null,
        role: { $ne: 'superadmin' },
        $or: [{ isActive: true }, { status: 'ACTIVE' }],
      });
    });
  });

  describe('enforceHierarchy', () => {
    it('allows self-modification', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'actor-id',
        role: 'admin',
        orgId: 'org-1',
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-id', role: 'admin' },
          'actor-id',
        ),
      ).resolves.toBeUndefined();
      expect(mockOrgModel.findById).not.toHaveBeenCalled();
    });

    it('allows superadmin to modify org owner', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'target-id',
        role: 'admin',
        orgId: 'org-1',
      });
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: 'target-id' }),
        }),
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-id', role: 'superadmin' },
          'target-id',
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks non-superadmin from modifying org owner', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'target-id',
        role: 'admin',
        orgId: 'org-1',
      });
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: 'target-id' }),
        }),
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-id', role: 'admin', orgId: 'org-1' },
          'target-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to modify another non-owner admin', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'target-admin',
        role: 'admin',
        orgId: 'org-1',
      });
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: 'owner-id' }),
        }),
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-id', role: 'admin', orgId: 'org-1' },
          'target-admin',
        ),
      ).resolves.toBeUndefined();
    });

    it('blocks manager from modifying peer manager', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'target-manager',
        role: 'manager',
        orgId: 'org-1',
      });
      mockOrgModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ ownerId: 'owner-id' }),
        }),
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-manager', role: 'manager', orgId: 'org-1' },
          'target-manager',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks non-superadmin cross-org user modification', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: 'target-user',
        role: 'employee',
        orgId: 'org-2',
      });

      await expect(
        service.enforceHierarchy(
          { _id: 'actor-id', role: 'admin', orgId: 'org-1' },
          'target-user',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockOrgModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const chainMock = {
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };
      mockUserModel.findById.mockReturnValue(chainMock);

      const result = await service.findOne('u1');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException when user not found', async () => {
      const chainMock = {
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      };
      mockUserModel.findById.mockReturnValue(chainMock);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@test.com',
        deletedAt: null,
      });
    });

    it('should return null when not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findByInvitationToken', () => {
    it('should return user by invitation token', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const result = await service.findByInvitationToken('token');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        invitationToken: 'token',
      });
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updated = { ...mockUser, name: 'Updated' };
      const chainMock = { select: jest.fn().mockResolvedValue(updated) };
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainMock);

      const result = await service.update('u1', { name: 'Updated' });
      expect(result).toEqual(updated);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { $set: { name: 'Updated' } },
        { new: true },
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const chainMock = { select: jest.fn().mockResolvedValue(null) };
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainMock);

      await expect(service.update('bad-id', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions and return the user', async () => {
      const before = {
        role: 'employee',
        permissionOverrides: {},
      };
      const updated = {
        ...mockUser,
        permissionOverrides: { 'scores.self.view': true },
      };
      mockUserModel.findById.mockResolvedValue(before);
      const chainMock = { select: jest.fn().mockResolvedValue(before) };
      mockUserModel.findById.mockReturnValue(chainMock as any);
      const updateChainMock = { select: jest.fn().mockResolvedValue(updated) };
      mockUserModel.findByIdAndUpdate.mockReturnValue(updateChainMock);

      const result = await service.updatePermissions('u1', {
        permissionOverrides: { 'scores.self.view': true },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when user not found', async () => {
      const chainMock = { select: jest.fn().mockResolvedValue(null) };
      mockUserModel.findById.mockReturnValue(chainMock as any);

      await expect(service.updatePermissions('bad-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.softDelete('u1');
      expect(result.isActive).toBe(false);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { deletedAt: expect.any(Date), isActive: false },
        { new: true },
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.softDelete('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a recently deleted user', async () => {
      const deletedUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        isActive: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockUserModel.findById.mockResolvedValue(deletedUser);

      const result = await service.restore('u1');
      expect(result.isActive).toBe(true);
      expect(deletedUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.restore('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not deleted', async () => {
      mockUserModel.findById.mockResolvedValue({
        ...mockUser,
        deletedAt: null,
      });
      await expect(service.restore('u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when recovery window expired', async () => {
      const oldDeleted = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
        getTime: undefined,
      };
      oldDeleted.deletedAt.getTime = oldDeleted.deletedAt.getTime.bind(
        oldDeleted.deletedAt,
      );
      mockUserModel.findById.mockResolvedValue(oldDeleted);
      await expect(service.restore('u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportData', () => {
    it('should return user data', async () => {
      const chainMock = { lean: jest.fn().mockResolvedValue(mockUser) };
      mockUserModel.findById.mockReturnValue(chainMock);

      const result = await service.exportData('u1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const chainMock = { lean: jest.fn().mockResolvedValue(null) };
      mockUserModel.findById.mockReturnValue(chainMock);

      await expect(service.exportData('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
