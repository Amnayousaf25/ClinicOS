/**
 * PermissionsGuard
 *
 * Evaluates permissions for a protected endpoint.
 *
 * 1. No @Permissions metadata → allow (public endpoint)
 * 2. superadmin → always allow
 * 3. Otherwise → resolve effective permissions and check
 *
 * Mode 'any': pass if user has ANY of the required permissions (default)
 * Mode 'all': pass if user has ALL of the required permissions
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_METADATA_KEY,
  PERMISSIONS_MODE_METADATA_KEY,
} from '../permissions/permissions.decorator';
import { resolveEffectivePermissions } from '../permissions/permission-resolver';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('PermissionsGuard: No user in request');
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'superadmin') {
      // Resolve the full permission set for superadmin too so downstream
      // services that read `req.user.effectivePermissions` see
      // superadmin-role defaults (every key true) instead of undefined.
      user.effectivePermissions = resolveEffectivePermissions(user);
      return true;
    }

    const effective = resolveEffectivePermissions(user);

    // Downstream services (IntegrationService, etc.) expect to read
    // the resolved permission set from the attached user object —
    // without this the guard's work gets thrown away and every
    // `req.user.effectivePermissions` read returns undefined.
    user.effectivePermissions = effective;

    const mode =
      this.reflector.getAllAndOverride<'any' | 'all'>(
        PERMISSIONS_MODE_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'any';

    const hasRequired =
      mode === 'all'
        ? requiredPermissions.every((perm) => effective[perm] === true)
        : requiredPermissions.some((perm) => effective[perm] === true);

    if (!hasRequired) {
      this.logger.warn(
        `PermissionsGuard: Denied ${user.id} for ${requiredPermissions.join(',')} (mode: ${mode})`,
      );
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
