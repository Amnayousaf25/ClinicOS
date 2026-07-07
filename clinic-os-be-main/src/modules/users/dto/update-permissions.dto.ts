import { IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating user permission overrides.
 * Payload shape: { permissionOverrides: { 'team.view': true, 'activity.view.self': false } }
 */
export class UpdatePermissionsDto {
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  permissionOverrides?: Record<string, boolean>;
}
