/**
 * Backfill script: seed default departments into every existing organization.
 *
 * Also drops any stale unique index on `name` alone (legacy from before the
 * schema was scoped per-org). The correct index is the `(orgId, name)`
 * compound — with a standalone `name_1` index in place, two orgs can never
 * share a department name, which is wrong and blocks seeding.
 *
 * Idempotent — re-running for an org that already has some of these defaults
 * is a no-op for the existing entries and only inserts the missing ones.
 *
 * Usage:
 *   yarn backfill:departments            # apply changes
 *   yarn backfill:departments --dry      # show what would change, no writes
 */

import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { DEFAULT_DEPARTMENTS } from './default-departments';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const DRY_RUN = process.argv.includes('--dry');

/**
 * Drop any unique index on `name` alone. The current schema uses a compound
 * `(orgId, name)` unique index, but older deployments may still have the
 * legacy `name_1` index which incorrectly prevents two orgs from sharing a
 * department name.
 */
async function dropStaleNameIndex() {
  const collection = mongoose.connection.collection('departments');
  let indexes: any[] = [];
  try {
    indexes = await collection.indexes();
  } catch {
    // Collection may not exist yet; nothing to drop.
    return;
  }

  for (const idx of indexes) {
    const keys = Object.keys(idx.key ?? {});
    const isStandaloneName =
      keys.length === 1 && keys[0] === 'name' && idx.unique === true;
    if (!isStandaloneName) continue;

    console.log(`  • dropping stale unique index "${idx.name}" on {name}`);
    if (!DRY_RUN) {
      await collection.dropIndex(idx.name);
    }
  }
}

async function backfill() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  await dropStaleNameIndex();

  const orgs = await mongoose.connection
    .collection('organizations')
    .find({}, { projection: { _id: 1, name: 1 } })
    .toArray();

  console.log(`Found ${orgs.length} organizations`);
  let totalInserted = 0;

  for (const org of orgs) {
    const existing = await mongoose.connection
      .collection('departments')
      .find({ orgId: org._id })
      .project({ name: 1 })
      .toArray();
    const existingNames = new Set(existing.map((d: any) => d.name));
    const toInsert = DEFAULT_DEPARTMENTS.filter((n) => !existingNames.has(n));

    if (toInsert.length === 0) {
      console.log(`  ${org.name}: already has all defaults`);
      continue;
    }

    console.log(
      `  ${org.name}: inserting ${toInsert.length} → ${toInsert.join(', ')}`,
    );

    if (!DRY_RUN) {
      const docs = toInsert.map((name) => ({
        orgId: org._id,
        name,
        managers: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // insertMany with ordered:false still throws a BulkWriteError if any
      // document trips a unique index — catch E11000 and count whatever
      // actually landed so a second re-run doesn't abort the whole script.
      try {
        const result = await mongoose.connection
          .collection('departments')
          .insertMany(docs, { ordered: false });
        totalInserted += result.insertedCount ?? 0;
      } catch (err: any) {
        if (err?.code === 11000) {
          const inserted = err?.result?.insertedCount ?? 0;
          const skipped = docs.length - inserted;
          console.log(
            `    ↳ ${inserted} inserted, ${skipped} skipped (already present)`,
          );
          totalInserted += inserted;
        } else {
          throw err;
        }
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}Inserted ${totalInserted} department rows total`,
  );
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
