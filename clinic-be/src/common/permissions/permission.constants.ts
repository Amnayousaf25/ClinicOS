/**
 * Permission Catalog — ClinicOS
 *
 * Single source of truth for permission keys.
 */

export const PERMISSIONS = {
  // Profile
  PROFILE_SELF_VIEW: 'profile.self.view',
  PROFILE_SELF_EDIT: 'profile.self.edit',
  PROFILE_OTHERS_VIEW: 'profile.others.view',

  // Team / Users Management
  TEAM_VIEW: 'team.view',
  TEAM_INVITE: 'team.invite',
  TEAM_EDIT: 'team.edit',
  TEAM_DELETE: 'team.delete',

  // Settings / Admin Controls
  SETTINGS_MANAGE: 'settings.manage',
  BILLING_MANAGE: 'billing.manage',
  ORG_MANAGE: 'org.manage',

  // Departments
  DEPARTMENTS_VIEW: 'departments.view',
  DEPARTMENTS_MANAGE: 'departments.manage',

  // Clinic-specific permissions
  APPOINTMENTS_READ: 'appointments.read',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  BOOKINGS_MANAGE: 'bookings.manage',
  REMINDERS_MANAGE: 'reminders.manage',
  INTAKE_VIEW: 'intake.view',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function isValidPermission(key: string): key is PermissionKey {
  return Object.values(PERMISSIONS).includes(key as PermissionKey);
}

export function getAllPermissionKeys(): PermissionKey[] {
  return Object.values(PERMISSIONS);
}
