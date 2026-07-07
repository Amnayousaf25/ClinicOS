import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from 'src/modules/users/users.service';
import { UserRole } from 'src/modules/users/types/user.types';
import { Organization } from 'src/modules/organizations/schemas/organization.schema';
import { User } from 'src/modules/users/schemas/user.schema';
import { Otp } from './schemas/otp.schema';
import { EmailService } from 'src/modules/email/services/email-service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: { toString: () => 'user-id-1' },
    email: 'test@test.com',
    name: 'Test User',
    password: 'hashed-password',
    role: UserRole.Admin,
    invitationStatus: 'pending',
    invitationToken: 'invite-token',
    isActive: true,
    deletedAt: null,
    save: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByInvitationToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockOrgModel = {
    findById: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockOtpModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockEmailService = {
    sendMail: jest.fn(),
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(Organization.name), useValue: mockOrgModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Otp.name), useValue: mockOtpModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    // ── Negative-state user gates (regressions found by manual QA) ──
    // These cases were previously absent from the suite — happy-path users
    // got tokens, wrong-password users got 401, but deactivated and
    // soft-deleted users with VALID credentials slipped through and
    // received tokens.

    it('should reject login for a deactivated user even with valid credentials', async () => {
      const deactivated = { ...mockUser, isActive: false, deletedAt: null };
      mockUsersService.findByEmail.mockResolvedValue(deactivated);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(/deactivated/i);
    });

    it('should reject login for a soft-deleted user with the "removed" message', async () => {
      const removed = {
        ...mockUser,
        isActive: false,
        deletedAt: new Date(),
      };
      mockUsersService.findByEmail.mockResolvedValue(removed);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(/removed/i);
    });

    it('should prefer the "removed" message over "deactivated" when both flags are set', async () => {
      // softDelete sets BOTH deletedAt and isActive=false. The check order
      // in the service must guarantee the more accurate "removed" message
      // wins so users aren't misled into thinking reactivation is possible.
      const removed = {
        ...mockUser,
        isActive: false,
        deletedAt: new Date(),
      };
      mockUsersService.findByEmail.mockResolvedValue(removed);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(/removed/i);
    });

    it('should NOT reveal account state when password is wrong (no enumeration via deactivated path)', async () => {
      // Wrong credentials must return the same 401/"Invalid credentials"
      // shape regardless of whether the account is active, deactivated,
      // or removed — otherwise an attacker can enumerate which emails
      // are registered, deactivated, or removed by varying the password.
      const deactivated = { ...mockUser, isActive: false, deletedAt: null };
      mockUsersService.findByEmail.mockResolvedValue(deactivated);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(/invalid credentials/i);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        email: 'test@test.com',
        sub: 'user-id-1',
      });
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.verify).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found after token verification', async () => {
      mockJwtService.verify.mockReturnValue({
        email: 'gone@test.com',
        sub: 'user-id-1',
      });
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should return success object', () => {
      const result = service.logout();
      expect(result).toEqual({ success: true });
    });
  });

  describe('validateInviteToken', () => {
    it('should return email and name for valid token', async () => {
      mockUsersService.findByInvitationToken.mockResolvedValue(mockUser);

      const result = await service.validateInviteToken('invite-token');

      expect(result).toEqual({ email: mockUser.email, name: mockUser.name });
      expect(mockUsersService.findByInvitationToken).toHaveBeenCalledWith(
        'invite-token',
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUsersService.findByInvitationToken.mockResolvedValue(null);

      await expect(service.validateInviteToken('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptInvite', () => {
    it('should accept invitation and return tokens', async () => {
      const invitedUser = {
        ...mockUser,
        email: 'invited@test.com',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockUsersService.findByInvitationToken.mockResolvedValue(invitedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const dto = {
        token: 'invite-token',
        email: 'invited@test.com',
        password: 'newpass123',
      };
      const result = await service.acceptInvite(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(invitedUser.save).toHaveBeenCalled();
      expect(invitedUser.password).toBe('new-hashed-password');
      expect(invitedUser.invitationStatus).toBe('accepted');
      expect(invitedUser.isActive).toBe(true);
    });

    it('should throw BadRequestException when token not found', async () => {
      mockUsersService.findByInvitationToken.mockResolvedValue(null);

      const dto = { token: 'bad-token', email: 'a@b.com', password: 'pass123' };
      await expect(service.acceptInvite(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when email does not match', async () => {
      mockUsersService.findByInvitationToken.mockResolvedValue(mockUser);

      const dto = {
        token: 'invite-token',
        email: 'wrong@test.com',
        password: 'pass123',
      };
      await expect(service.acceptInvite(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
