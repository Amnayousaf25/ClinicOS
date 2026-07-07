/**
 * Endpoint permission-coverage test.
 *
 * Walks every controller in src/modules/* and asserts that every @Get/@Post/
 * @Patch/@Put/@Delete handler has either a @Permissions() decoration (class or
 * method level) or is explicitly listed in ALLOWED_PUBLIC_METHODS below.
 *
 * This is a regression trap: a new endpoint added without a permission decision
 * fails the build.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PERMISSIONS_METADATA_KEY } from './permissions.decorator';

const MODULES_DIR = path.resolve(__dirname, '../../modules');
const HTTP_METHOD_DECORATORS = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

// Endpoints that intentionally have no @Permissions decoration.
// Add with a comment explaining why. Cross-cutting concerns that predate the
// permission migration and are out of scope go here.
const ALLOWED_PUBLIC_METHODS = new Set<string>([
  // Auth endpoints that issue or validate auth state directly.
  'AuthController.login',
  // Auth self-service endpoint — JWT-protected and limited to the authenticated user,
  // so it intentionally has no additional @Permissions() requirement.
  'AuthController.changePassword',
  'AuthController.refresh',
  'AuthController.logout',
  'AuthController.getAuthenticatedUser',
  'AuthController.validateInvite',
  'AuthController.acceptInvite',

  // Legacy user module — separate module still on @Roles/RolesGuard, out of scope.
  'UserController.create',
  'UserController.findAll',
  'UserController.findAllUsers',
  'UserController.findOne',
  'UserController.changeEmail',
  'UserController.update',
  'UserController.remove',

  // Chat — not in migration scope (product-gated across all authenticated users).
  'ChatController.initiateChat',
  'ChatController.getUserRooms',
  'ChatController.getRoomById',
  'ChatController.getOrCreateRoom',
  'ChatController.getRoomMessages',
  'ChatController.sendMessage',
  'ChatController.markAsRead',
  'ChatController.markAllAsReadIfLastRead',
  'ChatController.getUnreadCount',
  'ChatController.deleteRoom',

  // Media — user-owned uploads, auth-gated not permission-gated.
  'MediaController.uploadFile',
  'MediaController.deleteFile',
  'MediaController.generatePresignedUrl',

  // Notifications — each user reads/marks their own; auth-gated by JWT only.
  'NotificationsController.getUserNotifications',
  'NotificationsController.markAllNotificationsAsRead',
  'NotificationsController.getUnreadCount',

  // Booking — public endpoints, no auth required.
  'BookingController.getServices',
  'BookingController.getTimeSlots',
  'BookingController.createBooking',
  'BookingController.getBookingInfo',

  // Intake — public endpoints for patient form submission
  'IntakeController.getBookingInfo',
  'IntakeController.submitForm',

  // SMS webhook — public endpoint for Twilio incoming replies
  'SmsController.handleIncomingReply',
]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (
      entry.name.endsWith('.controller.ts') &&
      !entry.name.endsWith('.spec.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

type Endpoint = {
  key: string; // ControllerName.methodName
  file: string;
  hasClassLevelPermissions: boolean;
  hasMethodLevelPermissions: boolean;
};

function parseControllerFile(filePath: string): Endpoint[] {
  const source = fs.readFileSync(filePath, 'utf8');
  const classMatch = source.match(/export\s+class\s+(\w+)/);
  if (!classMatch) return [];
  const className = classMatch[1];

  // Class-level @Permissions — decorators above `export class X`.
  const classHeadMatch = source.match(
    new RegExp(`([\\s\\S]*?)export\\s+class\\s+${className}`),
  );
  const classHead = classHeadMatch?.[1] ?? '';
  const hasClassLevelPermissions = /@Permissions\s*\(/.test(classHead);

  // Only scan the class body (past `{`) to avoid hitting imports.
  const classBodyStart = source.indexOf('{', classMatch.index ?? 0);
  const body = classBodyStart >= 0 ? source.slice(classBodyStart) : source;

  const endpoints: Endpoint[] = [];

  // Anchor on an HTTP method decorator; slurp subsequent decorators; capture
  // the method name. Uses balanced paren-agnostic lazy match up to `async name(`
  // or `name(` at the same brace depth.
  const httpDecoratorAlt = HTTP_METHOD_DECORATORS.join('|');
  const methodPattern = new RegExp(
    `@(?:${httpDecoratorAlt})\\s*\\([^)]*\\)` + // HTTP decorator
      `((?:\\s*@\\w+(?:\\s*\\([^()]*(?:\\([^()]*\\)[^()]*)*\\))?)*)` + // other decorators
      `\\s*(?:public\\s+|private\\s+|protected\\s+)?(?:async\\s+)?(\\w+)\\s*\\(`,
    'g',
  );

  const matches = [...body.matchAll(methodPattern)];

  for (const match of matches) {
    const trailingDecorators = match[1] ?? '';
    const methodName = match[2];
    if (!methodName || methodName === 'constructor') continue;

    const hasMethodLevelPermissions = /@Permissions\s*\(/.test(
      trailingDecorators,
    );

    endpoints.push({
      key: `${className}.${methodName}`,
      file: filePath,
      hasClassLevelPermissions,
      hasMethodLevelPermissions,
    });
  }

  return endpoints;
}

describe('Permission coverage', () => {
  it('every HTTP endpoint has @Permissions() or is explicitly public', () => {
    expect(PERMISSIONS_METADATA_KEY).toBeDefined();

    const controllerFiles = walk(MODULES_DIR);
    expect(controllerFiles.length).toBeGreaterThan(0);

    const allEndpoints: Endpoint[] = [];
    for (const file of controllerFiles) {
      allEndpoints.push(...parseControllerFile(file));
    }

    const missing = allEndpoints
      .filter(
        (e) => !e.hasMethodLevelPermissions && !e.hasClassLevelPermissions,
      )
      .filter((e) => !ALLOWED_PUBLIC_METHODS.has(e.key));

    if (missing.length > 0) {
      const msg = missing
        .map((e) => `  • ${e.key}  (${path.relative(MODULES_DIR, e.file)})`)
        .join('\n');
      throw new Error(
        `Found ${missing.length} endpoint(s) with no @Permissions() decoration.\n` +
          `Either add a @Permissions(...) decorator, or add the handler key to\n` +
          `ALLOWED_PUBLIC_METHODS in permission-coverage.spec.ts with a comment.\n\n` +
          msg,
      );
    }

    expect(missing).toHaveLength(0);
  });
});
