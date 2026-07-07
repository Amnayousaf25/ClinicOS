/**
 * Permission Resolver Unit Tests
 *
 * Tests:
 * - Role defaults returned correctly for each role
 * - Override merge logic (overrides win)
 * - Early-exit conditions (deactivated, pending)
 * - Permission check helpers (hasPermission, hasAnyPermission, hasAllPermissions)
 */

import {
  resolveEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionReport,
  IUserForPermissions,
} from '../permission-resolver';
import { PERMISSIONS } from '../permission.constants';

describe('PermissionResolver', () => {
  describe('resolveEffectivePermissions', () => {
    it('should return all permissions as true for superadmin', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'superadmin',
        isActive: true,
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(result[PERMISSIONS.TEAM_VIEW]).toBe(true);
      expect(result[PERMISSIONS.APPOINTMENTS_READ]).toBe(true);
      expect(result[PERMISSIONS.REMINDERS_MANAGE]).toBe(true);
    });

    it('should return admin permissions for admin role', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'admin',
        isActive: true,
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(result[PERMISSIONS.TEAM_VIEW]).toBe(true);
      expect(result[PERMISSIONS.SETTINGS_MANAGE]).toBe(true);
    });

    it('should return manager permissions for manager role', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'manager',
        isActive: true,
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(result[PERMISSIONS.TEAM_VIEW]).toBe(true);
      expect(result[PERMISSIONS.APPOINTMENTS_MANAGE]).toBe(true);
      expect(result[PERMISSIONS.REMINDERS_MANAGE]).toBe(false); // Manager cannot manage reminders
    });

    it('should return employee permissions for employee role', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(result[PERMISSIONS.PROFILE_SELF_VIEW]).toBe(true);
      expect(result[PERMISSIONS.TEAM_VIEW]).toBe(false);
      expect(result[PERMISSIONS.APPOINTMENTS_READ]).toBe(true); // Staff/Employee can read appointments
    });

    it('should apply permission overrides (overrides win)', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {
          [PERMISSIONS.TEAM_VIEW]: true, // Grant override
          [PERMISSIONS.PROFILE_SELF_VIEW]: false, // Revoke override
        },
      };
      const result = resolveEffectivePermissions(user);
      expect(result[PERMISSIONS.TEAM_VIEW]).toBe(true); // Override granted
      expect(result[PERMISSIONS.PROFILE_SELF_VIEW]).toBe(false); // Override revoked
    });

    it('should return empty permissions for deactivated user', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'admin',
        isActive: false,
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(Object.values(result).every((v) => v === false)).toBe(true);
    });

    it('should return empty permissions for pending invite', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'super admin',
        isActive: true,
        invitationStatus: 'Pending',
        permissionOverrides: {},
      };
      const result = resolveEffectivePermissions(user);
      expect(Object.values(result).every((v) => v === false)).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'admin',
        isActive: true,
        permissionOverrides: {},
      };
      expect(hasPermission(user, PERMISSIONS.TEAM_VIEW)).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {},
      };
      expect(hasPermission(user, PERMISSIONS.TEAM_VIEW)).toBe(false);
    });

    it('should respect permission override', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {
          [PERMISSIONS.TEAM_VIEW]: true,
        },
      };
      expect(hasPermission(user, PERMISSIONS.TEAM_VIEW)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'manager',
        isActive: true,
        permissionOverrides: {},
      };
      const result = hasAnyPermission(user, [
        PERMISSIONS.REMINDERS_MANAGE, // false (manager denied)
        PERMISSIONS.TEAM_VIEW, // true (manager granted)
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user lacks all permissions', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {},
      };
      const result = hasAnyPermission(user, [
        PERMISSIONS.TEAM_VIEW, // false
        PERMISSIONS.REMINDERS_MANAGE, // false
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'admin',
        isActive: true,
        permissionOverrides: {},
      };
      const result = hasAllPermissions(user, [
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.SETTINGS_MANAGE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'manager',
        isActive: true,
        permissionOverrides: {},
      };
      const result = hasAllPermissions(user, [
        PERMISSIONS.TEAM_VIEW, // true
        PERMISSIONS.REMINDERS_MANAGE, // false (manager denied)
      ]);
      expect(result).toBe(false);
    });
  });

  describe('getPermissionReport', () => {
    it('should return detailed permission report', () => {
      const user: IUserForPermissions = {
        id: 'user1',
        role: 'employee',
        isActive: true,
        permissionOverrides: {
          [PERMISSIONS.TEAM_VIEW]: true, // grant
          [PERMISSIONS.PROFILE_SELF_VIEW]: false, // revoke
        },
      };
      const report = getPermissionReport(user);
      expect(report.userId).toBe('user1');
      expect(report.role).toBe('employee');
      expect(report.grantedByOverride).toContain(PERMISSIONS.TEAM_VIEW);
      expect(report.revokedByOverride).toContain(PERMISSIONS.PROFILE_SELF_VIEW);
    });
  });
});
