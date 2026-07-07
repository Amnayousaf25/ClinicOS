import { IsObject, IsOptional } from 'class-validator';

/**
 * DTO for org-level role default permission overrides.
 *
 * Shape:
 *   { roleDefaultOverrides: { admin: { 'team.view': true, ... }, manager: { ... } } }
 *
 * Superadmin is intentionally NOT a valid key here — that scope is reserved
 * for the platform and can't be modified by tenant admins. Unknown role keys
 * and unknown permission keys are filtered in the service layer.
 */
export class UpdateRoleDefaultsDto {
  @IsOptional()
  @IsObject()
  roleDefaultOverrides?: Record<string, Record<string, boolean>>;
}
