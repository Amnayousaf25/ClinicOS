/**
 * Seed script: creates the demo clinic org + admin user
 *
 * Usage: npx ts-node src/seeds/seed-clinic-admin.ts
 */
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI!;

const OrgSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true, lowercase: true },
    plan: { type: String, default: 'trial' },
    maxUsers: { type: Number, default: 50 },
    ownerId: { type: mongoose.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    roleDefaultOverrides: { type: Object, default: {} },
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Types.ObjectId, ref: 'Organization' },
    name: String,
    email: { type: String, lowercase: true, trim: true },
    employeeId: String,
    password: String,
    role: String,
    department: { type: mongoose.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    invitationToken: { type: String, default: null },
    invitationStatus: { type: String, default: 'accepted' },
    permissionOverrides: { type: Object, default: {} },
    permissionsVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const Org = mongoose.model('Organization', OrgSchema);
  const User = mongoose.model('User', UserSchema);

  // 1. Create or find org
  let org = await Org.findOne({ slug: 'demo-clinic' });
  if (!org) {
    org = await Org.create({
      name: 'ClinicOS Demo Clinic',
      slug: 'demo-clinic',
      plan: 'trial',
      maxUsers: 50,
      isActive: true,
    });
    console.log(`Created org: ${org.name} (${String(org._id)})`);
  } else {
    console.log(`Org already exists: ${org.name} (${String(org._id)})`);
  }

  // 2. Create admin user
  const email = 'tahir+a@geeksofkolachi.com';
  const password = 'Test1234$';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await User.findOne({ orgId: org._id, email });
  if (!user) {
    user = await User.create({
      orgId: org._id,
      name: 'Tahir Admin',
      email,
      employeeId: 'ADM-001',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      invitationStatus: 'accepted',
      permissionOverrides: {},
      permissionsVersion: 1,
    });
    console.log(`Created admin user: ${email} (${String(user._id)})`);

    // Set org owner
    await Org.findByIdAndUpdate(org._id, { ownerId: user._id });
    console.log('Set as org owner.');
  } else {
    // Update password and ensure active
    user.password = hashedPassword;
    user.isActive = true;
    user.role = 'admin';
    user.invitationStatus = 'accepted';
    await user.save();
    console.log(`Admin user already exists — updated password: ${email}`);
  }

  console.log('\n--- Done ---');
  console.log(`Org slug: demo-clinic`);
  console.log(`Login: ${email} / ${password}`);
  console.log(`BE: http://localhost:4002/api/v1/auth/login`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
