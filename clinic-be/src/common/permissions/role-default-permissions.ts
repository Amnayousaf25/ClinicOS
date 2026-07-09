/**
 * Role Default Permissions — ClinicOS
 *
 * Permission resolution: roleDefaults[user.role] ⊕ user.permissionOverrides
 */

import { PERMISSIONS, PermissionKey } from './permission.constants';

export type RoleDefaults = Record<PermissionKey, boolean>;

const noAccessDefaults: RoleDefaults = Object.values(PERMISSIONS).reduce(
  (defaults, permission) => {
    defaults[permission] = false;
    return defaults;
  },
  {} as RoleDefaults,
);

const superadminDefaults: RoleDefaults = {
  [PERMISSIONS.PROFILE_SELF_VIEW]: true,
  [PERMISSIONS.PROFILE_SELF_EDIT]: true,
  [PERMISSIONS.PROFILE_OTHERS_VIEW]: true,
  [PERMISSIONS.TEAM_VIEW]: true,
  [PERMISSIONS.TEAM_INVITE]: true,
  [PERMISSIONS.TEAM_EDIT]: true,
  [PERMISSIONS.TEAM_DELETE]: true,
  [PERMISSIONS.SETTINGS_MANAGE]: true,
  [PERMISSIONS.BILLING_MANAGE]: true,
  [PERMISSIONS.ORG_MANAGE]: true,
  [PERMISSIONS.DEPARTMENTS_VIEW]: true,
  [PERMISSIONS.DEPARTMENTS_MANAGE]: true,
  [PERMISSIONS.APPOINTMENTS_READ]: true,
  [PERMISSIONS.APPOINTMENTS_MANAGE]: true,
  [PERMISSIONS.BOOKINGS_MANAGE]: true,
  [PERMISSIONS.REMINDERS_MANAGE]: true,
  [PERMISSIONS.INTAKE_VIEW]: true,
};

const adminDefaults: RoleDefaults = {
  ...superadminDefaults,
  [PERMISSIONS.ORG_MANAGE]: false,
};

const managerDefaults: RoleDefaults = {
  [PERMISSIONS.PROFILE_SELF_VIEW]: true,
  [PERMISSIONS.PROFILE_SELF_EDIT]: true,
  [PERMISSIONS.PROFILE_OTHERS_VIEW]: true,
  [PERMISSIONS.TEAM_VIEW]: true,
  [PERMISSIONS.TEAM_INVITE]: true,
  [PERMISSIONS.TEAM_EDIT]: true,
  [PERMISSIONS.TEAM_DELETE]: true,
  [PERMISSIONS.SETTINGS_MANAGE]: false,
  [PERMISSIONS.BILLING_MANAGE]: false,
  [PERMISSIONS.ORG_MANAGE]: false,
  [PERMISSIONS.DEPARTMENTS_VIEW]: true,
  [PERMISSIONS.DEPARTMENTS_MANAGE]: false,
  [PERMISSIONS.APPOINTMENTS_READ]: true,
  [PERMISSIONS.APPOINTMENTS_MANAGE]: true,
  [PERMISSIONS.BOOKINGS_MANAGE]: true,
  [PERMISSIONS.REMINDERS_MANAGE]: false,
  [PERMISSIONS.INTAKE_VIEW]: true,
};

/** Staff: view and manage appointments only (per ClinicOS PDF) */
const staffDefaults: RoleDefaults = {
  [PERMISSIONS.PROFILE_SELF_VIEW]: true,
  [PERMISSIONS.PROFILE_SELF_EDIT]: true,
  [PERMISSIONS.PROFILE_OTHERS_VIEW]: false,
  [PERMISSIONS.TEAM_VIEW]: false,
  [PERMISSIONS.TEAM_INVITE]: false,
  [PERMISSIONS.TEAM_EDIT]: false,
  [PERMISSIONS.TEAM_DELETE]: false,
  [PERMISSIONS.SETTINGS_MANAGE]: false,
  [PERMISSIONS.BILLING_MANAGE]: false,
  [PERMISSIONS.ORG_MANAGE]: false,
  [PERMISSIONS.DEPARTMENTS_VIEW]: false,
  [PERMISSIONS.DEPARTMENTS_MANAGE]: false,
  [PERMISSIONS.APPOINTMENTS_READ]: true,
  [PERMISSIONS.APPOINTMENTS_MANAGE]: true,
  [PERMISSIONS.BOOKINGS_MANAGE]: false,
  [PERMISSIONS.REMINDERS_MANAGE]: false,
  [PERMISSIONS.INTAKE_VIEW]: true,
};

const employeeDefaults: RoleDefaults = {
  ...staffDefaults,
};

export const roleDefaultPermissions: Record<string, RoleDefaults> = {
  superadmin: superadminDefaults,
  admin: adminDefaults,
  manager: managerDefaults,
  employee: employeeDefaults,
  staff: staffDefaults,
};

export function getRoleDefaults(role: string): RoleDefaults {
  const normalizedRole = role.trim().toLowerCase();
  return roleDefaultPermissions[normalizedRole] ?? noAccessDefaults;
}
