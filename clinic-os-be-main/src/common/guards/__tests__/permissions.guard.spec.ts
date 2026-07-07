/**
 * PermissionsGuard Unit Tests
 *
 * Tests:
 * - No metadata → allow
 * - Superadmin bypass
 * - Permission check with mode: 'any'
 * - Permission check with mode: 'all'
 * - Missing permission → 403
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';
import {
  PERMISSIONS_METADATA_KEY,
  PERMISSIONS_MODE_METADATA_KEY,
} from '../../permissions/permissions.decorator';
import { PERMISSIONS } from '../../permissions/permission.constants';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createExecutionContext = (
    user: any,
    requiredPermissions?: string[],
    mode?: 'any' | 'all',
  ): { context: ExecutionContext; request: { user: any } } => {
    const request = { user };
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === PERMISSIONS_METADATA_KEY) return requiredPermissions;
        if (key === PERMISSIONS_MODE_METADATA_KEY) return mode ?? 'any';
        return undefined;
      });

    return { context: mockContext, request };
  };

  it('should allow if no permissions metadata', () => {
    const user = { id: 'user1', role: 'employee' };
    const { context } = createExecutionContext(user);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow superadmin bypass', () => {
    const user = { id: 'user1', role: 'superadmin' };
    const { context, request } = createExecutionContext(user, [
      PERMISSIONS.TEAM_VIEW,
    ]);
    expect(guard.canActivate(context)).toBe(true);
    expect(request.user.effectivePermissions).toBeDefined();
    expect(request.user.effectivePermissions[PERMISSIONS.TEAM_VIEW]).toBe(true);
  });

  it('should allow if user has required permission (mode: any)', () => {
    const user = {
      id: 'user1',
      role: 'manager',
      isActive: true,
      permissionOverrides: {},
    };
    const { context, request } = createExecutionContext(
      user,
      [PERMISSIONS.TEAM_VIEW, PERMISSIONS.REMINDERS_MANAGE],
      'any',
    );
    // Manager has TEAM_VIEW but not SCREENSHOTS_VIEW, so mode:any passes
    expect(guard.canActivate(context)).toBe(true);
    expect(request.user.effectivePermissions).toBeDefined();
    expect(request.user.effectivePermissions[PERMISSIONS.TEAM_VIEW]).toBe(true);
  });

  it('should deny if user lacks all permissions (mode: any)', () => {
    const user = {
      id: 'user1',
      role: 'employee',
      isActive: true,
      permissionOverrides: {},
    };
    const { context } = createExecutionContext(
      user,
      [PERMISSIONS.TEAM_VIEW, PERMISSIONS.REMINDERS_MANAGE],
      'any',
    );
    // Employee has neither, so mode:any fails
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow if user has all permissions (mode: all)', () => {
    const user = {
      id: 'user1',
      role: 'admin',
      isActive: true,
      permissionOverrides: {},
    };
    const { context } = createExecutionContext(
      user,
      [PERMISSIONS.TEAM_VIEW, PERMISSIONS.SETTINGS_MANAGE],
      'all',
    );
    // Admin has all, so mode:all passes
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny if user lacks any permission (mode: all)', () => {
    const user = {
      id: 'user1',
      role: 'manager',
      isActive: true,
      permissionOverrides: {},
    };
    const { context } = createExecutionContext(
      user,
      [PERMISSIONS.TEAM_VIEW, PERMISSIONS.REMINDERS_MANAGE],
      'all',
    );
    // Manager has TEAM_VIEW but not SCREENSHOTS_VIEW, so mode:all fails
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should respect permission overrides', () => {
    const user = {
      id: 'user1',
      role: 'employee',
      isActive: true,
      permissionOverrides: {
        [PERMISSIONS.TEAM_VIEW]: true, // Grant override
      },
    };
    const { context } = createExecutionContext(user, [PERMISSIONS.TEAM_VIEW]);
    // Override granted, so should pass
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny for deactivated user', () => {
    const user = {
      id: 'user1',
      role: 'admin',
      isActive: false,
      permissionOverrides: {},
    };
    const { context } = createExecutionContext(user, [PERMISSIONS.TEAM_VIEW]);
    // Deactivated user has no permissions
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny for pending invite', () => {
    const user = {
      id: 'user1',
      role: 'admin',
      isActive: true,
      invitationStatus: 'Pending',
      permissionOverrides: {},
    };
    const { context } = createExecutionContext(user, [PERMISSIONS.TEAM_VIEW]);
    // Pending invite has no permissions
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw if no user in request', () => {
    const { context } = createExecutionContext(null, [PERMISSIONS.TEAM_VIEW]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
