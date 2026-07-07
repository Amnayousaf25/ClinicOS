import * as mongoose from 'mongoose';

/**
 * Migration script: Single-tenant → Multi-tenant
 *
 * Creates a default Organization and stamps every existing document
 * with the org's _id.  Safe to run multiple times (idempotent).
 *
 * Usage:
 *   MONGODB_URI=mongodb://... npx ts-node src/seeds/migrate-to-multi-tenant.ts
 */
async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const db = mongoose.connection.db!;

  // ── Step 1: Create default Organization ────────────────────────────
  const orgsCollection = db.collection('organizations');
  let org = await orgsCollection.findOne({ slug: 'default' });

  if (!org) {
    const result = await orgsCollection.insertOne({
      name: 'Default Organization',
      slug: 'default',
      plan: 'trial',
      maxUsers: 50,
      settings: {
        screenshotInterval: 300,
        idleThreshold: 180,
        cutoffTime: '19:00',
        burnoutThreshold: 10,
        enableScreenshots: true,
        enableActivityTracking: true,
        blurScreenshots: false,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org = await orgsCollection.findOne({ _id: result.insertedId });
    console.log('Created default organization:', org!._id);
  } else {
    console.log('Default organization already exists:', org._id);
  }

  const orgId = org!._id;

  // ── Step 2: Stamp orgId on all collections ─────────────────────────
  const collections = [
    'users',
    'sessions',
    'activitylogs',
    'screenshots',
    'productivityscores',
    'alerts',
    'departments',
    'appcategoryregistries',
  ];

  for (const collName of collections) {
    const coll = db.collection(collName);
    const count = await coll.countDocuments({ orgId: { $exists: false } });
    if (count === 0) {
      console.log(`  ${collName}: already migrated (0 docs without orgId)`);
      continue;
    }
    const result = await coll.updateMany(
      { orgId: { $exists: false } },
      { $set: { orgId } },
    );
    console.log(`  ${collName}: stamped ${result.modifiedCount} documents`);
  }

  // ── Step 3: Drop old unique indexes that conflict with compound ones ─
  const usersCollection = db.collection('users');
  try {
    await usersCollection.dropIndex('email_1');
    console.log('  Dropped old email_1 unique index');
  } catch {
    // Index may not exist
  }
  try {
    await usersCollection.dropIndex('employeeId_1');
    console.log('  Dropped old employeeId_1 unique index');
  } catch {
    // Index may not exist
  }

  const deptsCollection = db.collection('departments');
  try {
    await deptsCollection.dropIndex('name_1');
    console.log('  Dropped old departments name_1 unique index');
  } catch {
    // Index may not exist
  }

  await mongoose.disconnect();
  console.log('\nMigration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
