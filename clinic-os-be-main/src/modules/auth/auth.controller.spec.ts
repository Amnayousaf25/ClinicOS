import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RESPONSE } from 'src/common/constants/response.constants';

describe('AuthController', () => {
  let controller: AuthController;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'u1',
      name: 'Test',
      email: 'test@test.com',
      role: 'admin',
    },
  };

  const mockService = {
    login: jest.fn(),
    changePassword: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    validateInviteToken: jest.fn(),
    acceptInvite: jest.fn(),
    forgotPassword: jest.fn(),
    verifyForgotPasswordOtp: jest.fn(),
    verifyResetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuthenticatedUser (/auth/me)', () => {
    const baseUser = {
      id: 'u1',
      email: 'test@test.com',
      name: 'Test',
      role: 'admin',
      orgId: 'org-1',
      isActive: true,
      deletedAt: null,
      invitationStatus: 'accepted',
      permissionOverrides: {},
      orgRoleDefaults: {},
    };

    it('returns user payload when account is active', () => {
      const result = controller.getAuthenticatedUser({
        user: baseUser,
      } as any);
      expect(result.data.user.email).toBe('test@test.com');
    });

    it('throws UnauthorizedException when user has been soft-deleted mid-session', () => {
      const removed = { ...baseUser, deletedAt: new Date() };
      expect(() =>
        controller.getAuthenticatedUser({ user: removed } as any),
      ).toThrow(/removed/i);
    });

    it('throws UnauthorizedException when user is deactivated mid-session', () => {
      const deactivated = { ...baseUser, isActive: false };
      expect(() =>
        controller.getAuthenticatedUser({ user: deactivated } as any),
      ).toThrow(/deactivated/i);
    });

    it('reports "removed" not "deactivated" when both flags are set', () => {
      const both = { ...baseUser, isActive: false, deletedAt: new Date() };
      expect(() =>
        controller.getAuthenticatedUser({ user: both } as any),
      ).toThrow(/removed/i);
    });
  });

  describe('login', () => {
    it('should return correct response format on success', async () => {
      mockService.login.mockResolvedValue(mockTokens);
      const dto = { email: 'test@test.com', password: 'password123' };
      const result = await controller.login(dto);
      expect(result).toEqual({
        message: RESPONSE.AUTH.LOGIN_SUCCESS,
        data: mockTokens,
      });
      expect(mockService.login).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      mockService.login.mockRejectedValue(new Error('Invalid credentials'));
      await expect(
        controller.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should return success message', async () => {
      mockService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });
      const req = { user: { id: 'u1' } };
      const dto = { currentPassword: 'old123', newPassword: 'newPass123' };
      const result = await controller.changePassword(req, dto);
      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockService.changePassword).toHaveBeenCalledWith('u1', dto);
    });

    it('should propagate service errors', async () => {
      const req = { user: { id: 'u1' } };
      const dto = { currentPassword: 'wrongOld123', newPassword: 'newPass123' };
      mockService.changePassword.mockRejectedValue(
        new UnauthorizedException('Invalid current password'),
      );

      await expect(controller.changePassword(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockService.changePassword).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('refresh', () => {
    it('should return correct response format on success', async () => {
      mockService.refreshToken.mockResolvedValue(mockTokens);
      const dto = { refreshToken: 'valid-refresh-token' };
      const result = await controller.refresh(dto);
      expect(result).toEqual({
        message: RESPONSE.AUTH.TOKEN_REFRESHED,
        data: mockTokens,
      });
      expect(mockService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
    });

    it('should propagate service errors', async () => {
      mockService.refreshToken.mockRejectedValue(new Error('Invalid token'));
      await expect(
        controller.refresh({ refreshToken: 'bad' }),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should return correct response format', () => {
      mockService.logout.mockReturnValue({ success: true });
      const result = controller.logout();
      expect(result).toEqual({ message: RESPONSE.AUTH.LOGOUT_SUCCESS });
      expect(mockService.logout).toHaveBeenCalled();
    });
  });

  describe('validateInvite', () => {
    it('should return correct response format on success', async () => {
      const inviteData = { email: 'user@test.com', name: 'User' };
      mockService.validateInviteToken.mockResolvedValue(inviteData);
      const result = await controller.validateInvite('valid-token');
      expect(result).toEqual({
        message: RESPONSE.AUTH.INVITE_VALID,
        data: inviteData,
      });
      expect(mockService.validateInviteToken).toHaveBeenCalledWith(
        'valid-token',
      );
    });

    it('should propagate service errors', async () => {
      mockService.validateInviteToken.mockRejectedValue(
        new Error('Invalid invitation'),
      );
      await expect(controller.validateInvite('bad-token')).rejects.toThrow();
    });
  });

  describe('acceptInvite', () => {
    it('should return correct response format on success', async () => {
      mockService.acceptInvite.mockResolvedValue(mockTokens);
      const dto = {
        token: 'invite-token',
        email: 'user@test.com',
        password: 'newpass123',
      };
      const result = await controller.acceptInvite(dto);
      expect(result).toEqual({
        message: RESPONSE.AUTH.INVITE_ACCEPTED,
        data: mockTokens,
      });
      expect(mockService.acceptInvite).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      mockService.acceptInvite.mockRejectedValue(
        new Error('Invalid invitation'),
      );
      const dto = { token: 'bad', email: 'a@b.com', password: 'pass123' };
      await expect(controller.acceptInvite(dto)).rejects.toThrow();
    });
  });
});
