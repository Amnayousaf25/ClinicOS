import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const db = mongoose.connection.db!;
  const orgsCol = db.collection('organizations');
  const usersCol = db.collection('users');

  // Ensure default org exists
  let org = await orgsCol.findOne({ slug: 'default' });
  if (!org) {
    const res = await orgsCol.insertOne({
      name: 'Hourlli',
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
    org = await orgsCol.findOne({ _id: res.insertedId });
    console.log('Created default organization');
  }

  const orgId = org!._id;
  const hashedPassword = await bcrypt.hash('Test1234$', 10);
  const now = new Date();

  const users = [
    {
      name: 'Tahir Super Admin',
      email: 'tahir+s@geeksofkolachi.com',
      employeeId: 'EMP-SA-001',
      role: 'superadmin',
    },
    {
      name: 'Tahir Manager',
      email: 'tahir+m@geeksofkolachi.com',
      employeeId: 'EMP-MG-001',
      role: 'manager',
    },
    {
      name: 'Tahir Employee',
      email: 'tahir+e@geeksofkolachi.com',
      employeeId: 'EMP-EM-001',
      role: 'employee',
    },
  ];

  for (const u of users) {
    const existing = await usersCol.findOne({ orgId, email: u.email });
    if (existing) {
      await usersCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: u.name,
            role: u.role,
            password: hashedPassword,
            isActive: true,
            invitationStatus: 'accepted',
            deletedAt: null,
            updatedAt: now,
          },
        },
      );
      console.log(`  Updated: ${u.email} (${u.role})`);
    } else {
      await usersCol.insertOne({
        orgId,
        name: u.name,
        email: u.email,
        employeeId: u.employeeId,
        password: hashedPassword,
        role: u.role,
        shiftType: 'flexible',
        shiftConfig: { startTime: null, endTime: null, cutoffTime: null },
        screenshotInterval: 300,
        isActive: true,
        deletedAt: null,
        invitationToken: null,
        invitationStatus: 'accepted',
        permissionOverrides: {},
        permissionsVersion: 1,
        alertConfig: {
          enabled: false,
          threshold: 50,
          idleThresholdMinutes: 60,
        },
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  Created: ${u.email} (${u.role})`);
    }
  }

  await mongoose.disconnect();
  console.log(`\nDone! All ${users.length} users seeded.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
