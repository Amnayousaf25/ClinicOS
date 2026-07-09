/**
 * DTO for getting user permissions
 *
 * Response includes:
 * - role: user's current role
 * - roleDefaults: permission defaults for that role
 * - permissionOverrides: user-specific override values
 * - effectivePermissions: computed combined permissions
 */

export class GetPermissionsDto {
  role: string;
  roleDefaults: Record<string, boolean>;
  permissionOverrides: Record<string, boolean>;
  effectivePermissions: Record<string, boolean>;
}
