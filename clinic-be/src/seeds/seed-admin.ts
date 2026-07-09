import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitoring';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const db = mongoose.connection.db!;

  // Seed into the "old" user collection (used by boilerplate auth)
  const usersCollection = db.collection('users');

  const email = 'tahirgeeks@gmail.com';
  const existing = await usersCollection.findOne({ email });

  if (existing) {
    console.log('User already exists, updating...');
    await usersCollection.updateOne(
      { email },
      {
        $set: {
          name: 'muhammad tahir',
          role: 'ADMIN',
          externalId: new mongoose.Types.ObjectId('68512f3db1d85db97831246d'),
          emailVerified: true,
          status: 'ACTIVE',
          password: await bcrypt.hash('Test1234$', 10),
          provider: 'CUSTOM',
          updatedAt: new Date(),
        },
      },
    );
    console.log('User updated successfully');
  } else {
    await usersCollection.insertOne({
      name: 'muhammad tahir',
      email,
      phone: '',
      role: 'ADMIN',
      externalId: new mongoose.Types.ObjectId('68512f3db1d85db97831246d'),
      emailVerified: true,
      status: 'ACTIVE',
      password: await bcrypt.hash('Test1234$', 10),
      provider: 'CUSTOM',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Admin user created successfully');
  }

  // Also seed into the new "monitoring" users collection if it exists
  const monitoringUsers = db.collection('users');
  const existingMonitoring = await monitoringUsers.findOne({
    email,
    employeeId: { $exists: true },
  });

  if (!existingMonitoring) {
    await monitoringUsers.insertOne({
      name: 'muhammad tahir',
      email,
      employeeId: 'EMP-001',
      role: 'admin',
      externalId: new mongoose.Types.ObjectId('68512f3db1d85db97831246d'),
      password: await bcrypt.hash('Test1234$', 10),
      shiftType: 'flexible',
      shiftConfig: { startTime: null, endTime: null, cutoffTime: null },
      screenshotInterval: 300,
      isActive: true,
      deletedAt: null,
      invitationToken: null,
      invitationStatus: 'accepted',
      permissionOverrides: {},
      permissionsVersion: 1,
      alertConfig: { enabled: false, threshold: 50, idleThresholdMinutes: 60 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Monitoring admin user created successfully');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
