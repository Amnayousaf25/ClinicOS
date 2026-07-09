/**
 * Backfill `organizations.ownerId` for every org that's missing one.
 *
 * Resolution order per org:
 *   1. The first admin user in the org (sorted by createdAt ascending) —
 *      matches the "paid the bill, set up the team" definition.
 *   2. Otherwise, the oldest non-deleted user of any role.
 *   3. If the org has zero users, leave ownerId null and log.
 *
 * Usage:
 *   yarn backfill:org-owners [--dry]
 *
 * Idempotent — re-running is a no-op once every org has an ownerId.
 */

import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.dev') });

const DRY_RUN = process.argv.includes('--dry');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db!;

  const orgs = await db.collection('organizations').find({}).toArray();
  console.log(`Found ${orgs.length} organizations`);

  let assigned = 0;
  let unchanged = 0;
  let orphan = 0;

  for (const org of orgs) {
    if ((org as any).ownerId) {
      console.log(
        `  [=] ${(org as any).name}: already has owner ${String((org as any).ownerId)}`,
      );
      unchanged += 1;
      continue;
    }

    const firstAdmin = await db
      .collection('users')
      .findOne(
        { orgId: org._id, role: 'admin', deletedAt: null },
        { sort: { createdAt: 1 }, projection: { _id: 1, name: 1, email: 1 } },
      );

    const candidate =
      firstAdmin ||
      (await db
        .collection('users')
        .findOne(
          { orgId: org._id, deletedAt: null },
          { sort: { createdAt: 1 }, projection: { _id: 1, name: 1, email: 1 } },
        ));

    if (!candidate) {
      console.log(
        `  [!] ${(org as any).name}: no users — leaving ownerId null`,
      );
      orphan += 1;
      continue;
    }

    console.log(
      `  [+] ${(org as any).name}: ownerId → ${(candidate as any).name} <${(candidate as any).email}> (${String(candidate._id)})`,
    );

    if (!DRY_RUN) {
      await db
        .collection('organizations')
        .updateOne({ _id: org._id }, { $set: { ownerId: candidate._id } });
    }
    assigned += 1;
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}done — assigned=${assigned} unchanged=${unchanged} orphan=${orphan}`,
  );
  await conn.close();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
