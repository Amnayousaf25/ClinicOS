/**
 * Three-in-one setup script:
 *
 *   1. Resolve a target org in the monitoring DB using either:
 *      - an explicit `<orgId>`, or
 *      - `--auto` (requires exactly one org to exist).
 *   2. Backfill `orgId` on every user that's missing one, pointing at
 *      the current org. Also forces `invitationStatus: accepted`,
 *      `isActive: true`, empty `permissionOverrides`, and other
 *      defaults so imported users become first-class members of the
 *      tenant.
 *   3. Upsert a hard-coded superadmin user (email + password from the
 *      CLI args at the top of main). The password is bcrypt-hashed.
 *
 * Usage:
 *   yarn seed:superadmin <orgId> [--dry]
 *   yarn seed:superadmin --auto [--dry]
 *
 * Idempotent — safe to re-run. The superadmin upsert is keyed on email.
 */

import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const DRY_RUN = process.argv.includes('--dry');

const SUPERADMIN_EMAIL = 'tahir+s@geeksofkolachi.com';
const SUPERADMIN_PASSWORD = 'Test1234$';
const SUPERADMIN_NAME = 'Tahir (Superadmin)';
const SUPERADMIN_EMPLOYEE_ID = 'SUPER-0001';

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--dry');
  const autoOrg = args.includes('--auto');
  const explicitOrgId = args.find((a) => a !== '--auto');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db!;

  console.log(`Connected to ${db.databaseName}`);
  console.log(DRY_RUN ? '[dry-run]\n' : '');

  // ── 1. Resolve org ───────────────────────────────────────────────────
  const orgsCollection = db.collection('organizations');
  let org: { _id: mongoose.Types.ObjectId; name: string } | null = null;

  if (autoOrg) {
    const orgs = await orgsCollection
      .find({}, { projection: { _id: 1, name: 1 } })
      .toArray();
    if (orgs.length !== 1) {
      throw new Error(
        `--auto requires exactly one organization in DB; found ${orgs.length}. Pass an explicit <orgId>.`,
      );
    }
    const onlyOrg: any = orgs[0];
    org = {
      _id: onlyOrg._id,
      name: onlyOrg.name,
    };
  } else if (explicitOrgId) {
    if (!mongoose.Types.ObjectId.isValid(explicitOrgId)) {
      throw new Error(`Invalid orgId: ${explicitOrgId}`);
    }
    org = (await orgsCollection.findOne(
      { _id: new mongoose.Types.ObjectId(explicitOrgId) },
      { projection: { _id: 1, name: 1 } },
    )) as any;
    if (!org) {
      throw new Error(`Organization ${explicitOrgId} not found`);
    }
  } else {
    throw new Error('Usage: yarn seed:superadmin <orgId|--auto> [--dry]');
  }

  if (!org) throw new Error('Failed to resolve target organization');
  console.log(`Using org: ${org.name} (${String(org._id)})`);
  const orgId = org._id;

  // ── 2. Backfill orgId on users missing one ───────────────────────────
  const usersCollection = db.collection('users');
  const missingOrg = await usersCollection.countDocuments({
    $or: [{ orgId: null }, { orgId: { $exists: false } }],
  });
  console.log(`Users without orgId: ${missingOrg}`);

  if (missingOrg > 0) {
    if (DRY_RUN) {
      console.log(
        `[dry] would assign orgId=${String(orgId)} to ${missingOrg} users`,
      );
    } else {
      const updateResult = await usersCollection.updateMany(
        { $or: [{ orgId: null }, { orgId: { $exists: false } }] },
        {
          $set: {
            orgId,
            isActive: true,
            invitationStatus: 'accepted',
            permissionOverrides: {},
            permissionsVersion: 1,
            shiftType: 'flexible',
            shiftConfig: {
              startTime: null,
              endTime: null,
              cutoffTime: null,
            },
            screenshotInterval: 300,
            alertConfig: {
              enabled: false,
              threshold: 50,
              idleThresholdMinutes: 60,
            },
            deletedAt: null,
            updatedAt: new Date(),
          },
        },
      );
      console.log(
        `  → matched=${updateResult.matchedCount} modified=${updateResult.modifiedCount}`,
      );
    }
  }

  // Drop the role legacy values that don't match our enum — "sales",
  // "member", etc. Anything not in the catalog becomes "employee".
  const VALID_ROLES = new Set(['superadmin', 'admin', 'manager', 'employee']);
  const invalidRoleUsers = await usersCollection
    .find({ role: { $nin: Array.from(VALID_ROLES) } })
    .project({ _id: 1, role: 1 })
    .toArray();
  console.log(
    `Users with non-catalog roles: ${invalidRoleUsers.length}${
      invalidRoleUsers.length
        ? ` (e.g. ${[...new Set(invalidRoleUsers.map((u: any) => u.role))].join(', ')})`
        : ''
    }`,
  );
  if (invalidRoleUsers.length > 0 && !DRY_RUN) {
    await usersCollection.updateMany(
      { role: { $nin: Array.from(VALID_ROLES) } },
      { $set: { role: 'employee' } },
    );
    console.log('  → reset to role=employee');
  }

  // Legacy users also need a password (original business DB may not
  // have hashed one). Only fill in missing passwords so we don't clobber
  // any existing hashes.
  const missingPassword = await usersCollection.countDocuments({
    $or: [
      { password: null },
      { password: { $exists: false } },
      { password: '' },
    ],
  });
  if (missingPassword > 0 && !DRY_RUN) {
    const placeholder = await bcrypt.hash(
      `bootstrap-${Date.now()}-${Math.random()}`,
      10,
    );
    await usersCollection.updateMany(
      {
        $or: [
          { password: null },
          { password: { $exists: false } },
          { password: '' },
        ],
      },
      { $set: { password: placeholder } },
    );
    console.log(
      `  → seeded throwaway passwords for ${missingPassword} users (must use forgot-password)`,
    );
  }

  // Same for employeeId — the unique (orgId, employeeId) index will
  // bomb the org-wide backfill if two legacy users share "". Assign
  // sequential EMP-0001 fallbacks to missing values.
  const missingEmpId = await usersCollection
    .find({
      $or: [
        { employeeId: null },
        { employeeId: { $exists: false } },
        { employeeId: '' },
      ],
    })
    .project({ _id: 1 })
    .toArray();
  if (missingEmpId.length > 0 && !DRY_RUN) {
    let index = 1;
    for (const user of missingEmpId) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { employeeId: `EMP-${String(index).padStart(4, '0')}` } },
      );
      index += 1;
    }
    console.log(`  → assigned EMP-xxxx ids to ${missingEmpId.length} users`);
  }

  // ── 3. Upsert the superadmin user ────────────────────────────────────
  console.log(`\nUpserting superadmin ${SUPERADMIN_EMAIL}`);
  const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

  if (DRY_RUN) {
    console.log(`[dry] would upsert ${SUPERADMIN_EMAIL} as superadmin`);
  } else {
    await usersCollection.updateOne(
      { orgId, email: SUPERADMIN_EMAIL },
      {
        $set: {
          orgId,
          name: SUPERADMIN_NAME,
          email: SUPERADMIN_EMAIL,
          password: hashedPassword,
          role: 'superadmin',
          employeeId: SUPERADMIN_EMPLOYEE_ID,
          isActive: true,
          invitationStatus: 'accepted',
          permissionOverrides: {},
          permissionsVersion: 1,
          screenshotInterval: 300,
          shiftType: 'flexible',
          shiftConfig: {
            startTime: null,
            endTime: null,
            cutoffTime: null,
          },
          alertConfig: {
            enabled: false,
            threshold: 50,
            idleThresholdMinutes: 60,
          },
          deletedAt: null,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    console.log(`  → done (password reset to supplied value)`);
  }

  console.log('\nAll done.');
  await conn.close();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
