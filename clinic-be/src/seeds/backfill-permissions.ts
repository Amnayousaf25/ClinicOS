/**
 * Backfill script: initialize permission fields on existing users.
 *
 * For every user:
 *   - Set `permissionOverrides = {}` if missing.
 *   - Set `permissionsVersion = 1` if missing.
 *   - Translate legacy `scoreVisibility: true` → `permissionOverrides['scores.self.view'] = true`.
 *
 * For every org with a non-default `screenshotVisibleRoles`:
 *   - For users whose role is in that whitelist, set
 *     `permissionOverrides['screenshots.view'] = true`.
 *
 * Usage:
 *   yarn backfill:permissions            # apply changes
 *   yarn backfill:permissions --dry      # show what would change, no writes
 *
 * Run on staging first. Idempotent.
 */

import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

// Load environment variables from .env.dev (matches the other seed scripts).
const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const DRY_RUN = process.argv.includes('--dry');

const PERM_SCORES_SELF_VIEW = 'scores.self.view';
const PERM_SCREENSHOTS_VIEW = 'screenshots.view';

type Diff = {
  userId: string;
  role: string;
  changes: Record<string, unknown>;
};

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is not set (checked .env.dev)',
    );
  }
  await mongoose.connect(uri);
  console.log('[backfill-permissions] connected to MongoDB');
  console.log(`[backfill-permissions] mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);

  const db = mongoose.connection.db!;
  const usersCol = db.collection('users');
  const orgsCol = db.collection('organizations');

  const orgs = await orgsCol.find({}).toArray();
  const orgScreenshotRoles = new Map<string, Set<string>>();
  for (const org of orgs) {
    const roles: string[] = Array.isArray(org.screenshotVisibleRoles)
      ? org.screenshotVisibleRoles
      : [];
    // Default whitelist is ['admin'] — only treat non-default as an override signal.
    const isDefault = roles.length === 1 && roles[0] === 'admin';
    if (!isDefault) {
      orgScreenshotRoles.set(String(org._id), new Set(roles));
    }
  }

  const users = await usersCol.find({}).toArray();
  console.log(`[backfill-permissions] scanning ${users.length} users…`);

  const diffs: Diff[] = [];

  for (const user of users) {
    const overrides: Record<string, boolean> =
      user.permissionOverrides && typeof user.permissionOverrides === 'object'
        ? { ...user.permissionOverrides }
        : {};
    const changes: Record<string, unknown> = {};

    if (!user.permissionOverrides) {
      changes.permissionOverrides = overrides;
    }
    if (!user.permissionsVersion) {
      changes.permissionsVersion = 1;
    }

    if (
      user.scoreVisibility === true &&
      overrides[PERM_SCORES_SELF_VIEW] !== true
    ) {
      overrides[PERM_SCORES_SELF_VIEW] = true;
      changes.permissionOverrides = overrides;
    }

    const orgWhitelist = orgScreenshotRoles.get(String(user.orgId));
    if (
      orgWhitelist &&
      orgWhitelist.has(user.role) &&
      overrides[PERM_SCREENSHOTS_VIEW] !== true
    ) {
      overrides[PERM_SCREENSHOTS_VIEW] = true;
      changes.permissionOverrides = overrides;
    }

    if (Object.keys(changes).length === 0) continue;

    diffs.push({
      userId: String(user._id),
      role: user.role,
      changes,
    });

    if (!DRY_RUN) {
      await usersCol.updateOne({ _id: user._id }, { $set: changes });
    }
  }

  console.log(`[backfill-permissions] ${diffs.length} users would be updated`);
  for (const diff of diffs.slice(0, 20)) {
    console.log(
      `  • ${diff.userId} (${diff.role}): ${Object.keys(diff.changes).join(', ')}`,
    );
  }
  if (diffs.length > 20) {
    console.log(`  … and ${diffs.length - 20} more`);
  }

  if (DRY_RUN) {
    console.log('[backfill-permissions] DRY RUN — no writes performed');
  } else {
    console.log('[backfill-permissions] changes applied');
  }

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('[backfill-permissions] failed:', err);
  process.exit(1);
});
