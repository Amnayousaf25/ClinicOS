/**
 * One-off helper: import every user from EXTERNAL_MONGODB_URI into the main
 * `users` collection under a specific organization.
 *
 * Usage:
 *   yarn import:external-users <orgId> [--dry]
 *   yarn import:external-users --auto [--dry]    # picks the only org if one exists
 *
 * Behavior:
 *   - Reads every document in the external `users` collection.
 *   - Upserts into the main users collection matched by
 *     `(orgId, externalId)` so re-runs don't duplicate.
 *   - Populates orgId from the CLI arg, externalId from the source _id,
 *     name / email / employeeId from the external doc. Every imported
 *     user lands with `role: employee` — promote individuals later from
 *     the Users page.
 *   - Default permissions: `permissionOverrides` is initialized as `{}`,
 *     which the permission resolver treats as "inherit everything from
 *     the role defaults". That means every imported Employee already gets
 *     the full employee-role permission set at runtime without needing
 *     an explicit override map written to the doc.
 *
 * Idempotent — upsert key is `(orgId, externalId)`.
 */

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const DRY_RUN = process.argv.includes('--dry');

// External DB's role strings don't map cleanly onto our catalog, so every
// imported user lands as Employee. Admins can promote individuals by hand
// from the Users page afterwards.
const DEFAULT_ROLE = 'employee' as const;

type ExternalUserDoc = {
  _id: unknown;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  workEmail?: string;
  primaryEmail?: string;
  employeeId?: string;
  empId?: string;
  staffId?: string;
};

const pickName = (doc: any): string => {
  return (
    doc.fullName ||
    doc.name ||
    [doc.firstName, doc.lastName].filter(Boolean).join(' ').trim() ||
    doc.email ||
    'Unknown'
  );
};

const pickEmail = (doc: any): string | null => {
  const email = doc.email || doc.workEmail || doc.primaryEmail;
  if (typeof email !== 'string') return null;
  return email.trim().toLowerCase();
};

const pickEmployeeId = (doc: any, fallbackIndex: number): string => {
  return (
    doc.employeeId ||
    doc.empId ||
    doc.staffId ||
    `EXT-${String(fallbackIndex).padStart(4, '0')}`
  );
};

const randomPassword = () => crypto.randomBytes(12).toString('hex');

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--dry');
  const autoOrg = args.includes('--auto');
  const explicitOrgId = args.find((a) => a !== '--auto');

  const mainUri = process.env.MONGODB_URI;
  const externalUri = process.env.EXTERNAL_MONGODB_URI;
  if (!mainUri) throw new Error('MONGODB_URI not set');
  if (!externalUri) throw new Error('EXTERNAL_MONGODB_URI not set');

  const mainConn = await mongoose.createConnection(mainUri).asPromise();
  const externalConn = await mongoose.createConnection(externalUri).asPromise();

  // Resolve target org — either explicit arg or auto-detect a single-org DB.
  let org: { _id: mongoose.Types.ObjectId; name: string } | null = null;
  if (autoOrg) {
    const orgs = await mainConn
      .collection('organizations')
      .find({}, { projection: { _id: 1, name: 1 } })
      .toArray();
    if (orgs.length !== 1) {
      console.error(
        `--auto requires exactly one organization in the main DB; found ${orgs.length}. Pass an explicit <orgId>.`,
      );
      process.exit(1);
    }
    org = orgs[0] as any;
  } else if (explicitOrgId) {
    if (!mongoose.Types.ObjectId.isValid(explicitOrgId)) {
      console.error(`Invalid orgId: ${explicitOrgId}`);
      process.exit(1);
    }
    org = (await mainConn
      .collection('organizations')
      .findOne(
        { _id: new mongoose.Types.ObjectId(explicitOrgId) },
        { projection: { _id: 1, name: 1 } },
      )) as any;
    if (!org) {
      console.error(`Organization ${explicitOrgId} not found in main DB`);
      process.exit(1);
    }
  } else {
    console.error(
      'Usage: ts-node import-external-users.ts <orgId|--auto> [--dry]',
    );
    process.exit(1);
  }

  const orgObjectId = org!._id;
  console.log(`Target org: ${org!.name} (${String(orgObjectId)})`);
  console.log(
    `Role policy: every imported user → Employee (permissions inherit from employee role defaults)`,
  );

  const externalUsersCollection = externalConn.collection('users');
  const externalCount = await externalUsersCollection.countDocuments({});
  console.log(`Found ${externalCount} users in external DB`);

  if (externalCount === 0) {
    await Promise.all([mainConn.close(), externalConn.close()]);
    return;
  }

  // Reuse a single hashed password for imported users. They must hit
  // "forgot password" on first login anyway, so there's no value in
  // generating per-user hashes (which would slow the script down).
  const sharedHash = await bcrypt.hash(randomPassword(), 10);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const externalCursor = externalUsersCollection.find<ExternalUserDoc>(
    {},
    {
      projection: {
        _id: 1,
        fullName: 1,
        name: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        workEmail: 1,
        primaryEmail: 1,
        employeeId: 1,
        empId: 1,
        staffId: 1,
      },
    },
  );

  let fallbackIndex = 0;
  for await (const src of externalCursor) {
    fallbackIndex += 1;
    const email = pickEmail(src);
    if (!email) {
      console.log(`  [skip] user ${String(src._id)}: no email`);
      skipped += 1;
      continue;
    }

    const doc = {
      orgId: orgObjectId,
      externalId: src._id,
      name: pickName(src),
      email,
      employeeId: pickEmployeeId(src, fallbackIndex),
      password: sharedHash,
      role: DEFAULT_ROLE,
      isActive: true,
      invitationStatus: 'accepted',
      permissionOverrides: {},
      permissionsVersion: 1,
      screenshotInterval: 300,
      shiftType: 'flexible',
      shiftConfig: { startTime: null, endTime: null, cutoffTime: null },
      alertConfig: { enabled: false, threshold: 50, idleThresholdMinutes: 60 },
      deletedAt: null,
      updatedAt: new Date(),
    };

    if (DRY_RUN) {
      console.log(
        `  [dry] would upsert ${doc.name} <${doc.email}> role=${doc.role}`,
      );
      continue;
    }

    try {
      const result = await mainConn.collection('users').updateOne(
        { orgId: orgObjectId, externalId: src._id },
        {
          $set: doc,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
      if (result.upsertedCount > 0) {
        inserted += 1;
        console.log(`  [+] ${doc.name} <${doc.email}>`);
      } else if (result.modifiedCount > 0) {
        updated += 1;
      }
    } catch (err: any) {
      // E11000 on (orgId, email) means the email already belongs to a
      // user imported under a different externalId — log and keep going.
      if (err?.code === 11000) {
        console.log(
          `  [conflict] ${doc.email} already exists under a different externalId — skipped`,
        );
        skipped += 1;
      } else {
        throw err;
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}done — inserted=${inserted} updated=${updated} skipped=${skipped}`,
  );

  await Promise.all([mainConn.close(), externalConn.close()]);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
