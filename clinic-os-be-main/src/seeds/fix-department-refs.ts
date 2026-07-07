/**
 * One-shot fix for two related legacy bugs on the main monitoring DB:
 *
 *   1. Department rows seeded before any org existed are missing
 *      `orgId`. Without it the unique `(orgId, name)` index behaves
 *      oddly and the Departments page can't find anything. Assign
 *      every orphaned department to the current org.
 *
 *   2. Users imported from the business system carry `department`
 *      as a raw string name ("Engineering", "Design", …) instead of
 *      the `Department._id` ObjectId the monitoring schema declares.
 *      Any endpoint that populates `department` on a user query
 *      throws `CastError: Cast to ObjectId failed for value "Engineering"`.
 *      Map each legacy string to the matching Department row (case-
 *      insensitive) and write the real ObjectId back. Leftovers get
 *      cleared to `null` so the cast stops failing.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   yarn fix:department-refs <orgId> [--dry]
 *   yarn fix:department-refs --auto [--dry]
 */

import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.dev') });

const DRY_RUN = process.argv.includes('--dry');

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--dry');
  const autoOrg = args.includes('--auto');
  const explicitOrgId = args.find((a) => a !== '--auto');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db!;

  // ── 1. Resolve target org ────────────────────────────────────────────
  let org: { _id: mongoose.Types.ObjectId; name: string } | null = null;
  if (autoOrg) {
    const orgs = await db
      .collection('organizations')
      .find({}, { projection: { _id: 1, name: 1 } })
      .toArray();
    if (orgs.length !== 1) {
      throw new Error(
        `--auto requires exactly one organization in DB; found ${orgs.length}. Pass an explicit <orgId>.`,
      );
    }
    const onlyOrg = orgs[0] as {
      _id: mongoose.Types.ObjectId;
      name: string;
    };
    org = { _id: onlyOrg._id, name: onlyOrg.name };
  } else if (explicitOrgId) {
    if (!mongoose.Types.ObjectId.isValid(explicitOrgId)) {
      throw new Error(`Invalid orgId: ${explicitOrgId}`);
    }
    org = (await db
      .collection('organizations')
      .findOne(
        { _id: new mongoose.Types.ObjectId(explicitOrgId) },
        { projection: { _id: 1, name: 1 } },
      )) as { _id: mongoose.Types.ObjectId; name: string } | null;
    if (!org) {
      throw new Error(`Organization ${explicitOrgId} not found`);
    }
  } else {
    throw new Error('Usage: yarn fix:department-refs <orgId|--auto> [--dry]');
  }
  const orgId = org._id;
  console.log(`Target org: ${org.name} (${String(orgId)})`);

  // ── 2. Backfill orgId on departments that are missing it ────────────
  const orphanedDepts = await db.collection('departments').countDocuments({
    $or: [{ orgId: null }, { orgId: { $exists: false } }],
  });
  console.log(`\nDepartments missing orgId: ${orphanedDepts}`);
  if (orphanedDepts > 0 && !DRY_RUN) {
    const result = await db
      .collection('departments')
      .updateMany(
        { $or: [{ orgId: null }, { orgId: { $exists: false } }] },
        { $set: { orgId } },
      );
    console.log(
      `  → matched=${result.matchedCount} modified=${result.modifiedCount}`,
    );
  }

  // ── 3. Build a name → _id map for the current org's departments ──────
  // In --dry we haven't actually written orgId yet, so fall back to the
  // full department list so the preview matches what the real run will do.
  const depts = await db
    .collection('departments')
    .find(DRY_RUN ? {} : { orgId })
    .project({ _id: 1, name: 1 })
    .toArray();
  const byName = new Map<string, mongoose.Types.ObjectId>();
  for (const d of depts) {
    byName.set(
      String((d as any).name)
        .trim()
        .toLowerCase(),
      d._id,
    );
  }
  console.log(`${byName.size} departments available for matching`);

  // ── 4. Find users whose department is a raw string ───────────────────
  // Mongoose can't query `department` with a string filter because the
  // schema declares it as ObjectId — but the raw driver will happily do
  // a $type: "string" match since it inspects the stored BSON type.
  const legacyUsers = await db
    .collection('users')
    .find({ department: { $type: 'string' } })
    .project({ _id: 1, name: 1, department: 1 })
    .toArray();
  console.log(`\nUsers with string department values: ${legacyUsers.length}`);

  let mapped = 0;
  let cleared = 0;

  for (const user of legacyUsers) {
    const raw = String((user as any).department).trim();
    const match = byName.get(raw.toLowerCase());
    if (match) {
      console.log(`  [→] ${(user as any).name}: "${raw}" → ${String(match)}`);
      if (!DRY_RUN) {
        await db
          .collection('users')
          .updateOne({ _id: user._id }, { $set: { department: match } });
      }
      mapped += 1;
    } else {
      console.log(
        `  [x] ${(user as any).name}: "${raw}" — no matching department, clearing`,
      );
      if (!DRY_RUN) {
        await db
          .collection('users')
          .updateOne({ _id: user._id }, { $set: { department: null } });
      }
      cleared += 1;
    }
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}done — mapped=${mapped} cleared=${cleared}`,
  );
  await conn.close();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
