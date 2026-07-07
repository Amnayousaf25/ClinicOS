/**
 * @Permissions Decorator
 *
 * Marks a controller handler as requiring specific permissions.
 * Used by PermissionsGuard for authorization checks.
 *
 * Usage:
 * @Permissions('team.view', 'team.edit', { mode: 'any' })
 * handleUpdateTeam() { ... }
 *
 * Mode 'any' (default): User must have at least one permission
 * Mode 'all': User must have all permissions
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_METADATA_KEY = 'permissions';
export const PERMISSIONS_MODE_METADATA_KEY = 'permissions_mode';

export interface PermissionsOptions {
  mode?: 'any' | 'all';
}

type PermissionsDecoratorTarget = object | (new (...args: never[]) => unknown);

function isPermissionsOptions(value: unknown): value is PermissionsOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mode' in value &&
    (((value as PermissionsOptions).mode ?? 'any') === 'any' ||
      ((value as PermissionsOptions).mode ?? 'any') === 'all')
  );
}

/**
 * Decorator to specify required permissions for a handler
 *
 * @param permissions List of permission keys needed
 * @param options Optional config (mode: 'any' | 'all')
 */
export function Permissions(
  ...args: Array<string | PermissionsOptions>
): MethodDecorator & ClassDecorator {
  let permissions: string[] = [];
  let options: PermissionsOptions = { mode: 'any' };

  if (args.length > 0) {
    const lastArg = args[args.length - 1];

    if (isPermissionsOptions(lastArg)) {
      permissions = args.slice(0, -1) as string[];
      options = lastArg;
    } else {
      permissions = args as string[];
    }
  }

  return (
    target: PermissionsDecoratorTarget,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey && descriptor) {
      SetMetadata(PERMISSIONS_METADATA_KEY, permissions)(
        target,
        propertyKey,
        descriptor,
      );
      SetMetadata(PERMISSIONS_MODE_METADATA_KEY, options.mode ?? 'any')(
        target,
        propertyKey,
        descriptor,
      );
      return;
    }

    const classTarget = target as new (...args: never[]) => unknown;
    SetMetadata(PERMISSIONS_METADATA_KEY, permissions)(classTarget);
    SetMetadata(
      PERMISSIONS_MODE_METADATA_KEY,
      options.mode ?? 'any',
    )(classTarget);
  };
}
