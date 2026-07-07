/**
 * Permission Resolver
 *
 * Computes effective permissions for a user by merging:
 * 1. Role defaults (code-defined)
 * 2. User permission overrides (admin-editable)
 *
 * Early-exit conditions:
 * - Deactivated user (isActive: false) → no permissions
 * - Pending invite (invitationStatus: 'Pending') → no permissions
 */

import { getRoleDefaults } from './role-default-permissions';

/**
 * Interface for user data needed by permission resolver
 */
export interface IUserForPermissions {
  id: string;
  role: string;
  isActive?: boolean;
  invitationStatus?: string;
  permissionOverrides?: Record<string, boolean>;
  /**
   * Org-level role default overrides, typically populated from
   * Organization.roleDefaultOverrides on the request path. Merged between
   * code defaults and user overrides.
   */
  orgRoleDefaults?: Record<string, Record<string, boolean>>;
}

/**
 * Resolve effective permissions for a user
 *
 * @param user User object with role, status, and overrides
 * @returns Record<string, boolean> of effective permissions
 *
 * Formula:
 * effective = roleDefaults ⊕ permissionOverrides
 * (Override values always win)
 */
export function resolveEffectivePermissions(
  user: IUserForPermissions,
): Record<string, boolean> {
  // Early exit: deactivated user has no permissions
  if (user.isActive === false) {
    return {};
  }

  // Early exit: pending invite has no permissions.
  // InvitationStatus enum value is lowercase ('pending' | 'accepted').
  if (
    typeof user.invitationStatus === 'string' &&
    user.invitationStatus.toLowerCase() === 'pending'
  ) {
    return {};
  }

  // Code-defined role defaults (the baseline)
  const roleDefaults = getRoleDefaults(user.role);

  // Org-level override for this user's role, if any
  const orgRoleOverride = user.orgRoleDefaults?.[user.role] ?? {};

  // Precedence: code < org role override < user override
  const effective = {
    ...roleDefaults,
    ...orgRoleOverride,
    ...user.permissionOverrides,
  };

  return effective;
}

/**
 * Check if user has a specific permission
 *
 * @param user User object
 * @param permissionKey Permission key (e.g., 'team.view')
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(
  user: IUserForPermissions,
  permissionKey: string,
): boolean {
  const effective = resolveEffectivePermissions(user);
  return effective[permissionKey] === true;
}

/**
 * Check if user has any of the given permissions
 *
 * @param user User object
 * @param permissionKeys Array of permission keys
 * @returns true if user has any permission in the list
 */
export function hasAnyPermission(
  user: IUserForPermissions,
  permissionKeys: string[],
): boolean {
  return permissionKeys.some((key) => hasPermission(user, key));
}

/**
 * Check if user has all of the given permissions
 *
 * @param user User object
 * @param permissionKeys Array of permission keys
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
  user: IUserForPermissions,
  permissionKeys: string[],
): boolean {
  return permissionKeys.every((key) => hasPermission(user, key));
}

/**
 * Get detailed permission report for a user
 * Useful for debugging, logging, and UI display
 */
export function getPermissionReport(user: IUserForPermissions) {
  const roleDefaults = getRoleDefaults(user.role);
  const effective = resolveEffectivePermissions(user);

  return {
    userId: user.id,
    role: user.role,
    isActive: user.isActive ?? true,
    invitationStatus: user.invitationStatus ?? 'Active',
    roleDefaults,
    permissionOverrides: user.permissionOverrides ?? {},
    effectivePermissions: effective,
    deniedByDefault: Object.entries(roleDefaults)
      .filter((entry) => !entry[1])
      .map(([k]) => k),
    grantedByOverride: Object.entries(user.permissionOverrides ?? {})
      .filter((entry) => entry[1] === true)
      .map(([k]) => k),
    revokedByOverride: Object.entries(user.permissionOverrides ?? {})
      .filter((entry) => entry[1] === false)
      .map(([k]) => k),
  };
}
