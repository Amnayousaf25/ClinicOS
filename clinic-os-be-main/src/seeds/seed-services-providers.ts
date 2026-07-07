/**
 * Seed script: creates 12 services + 12 providers/doctors for the demo clinic.
 *
 * Usage: npx ts-node src/seeds/seed-services-providers.ts
 */
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI!;

const OrgSchema = new mongoose.Schema(
  { name: String, slug: String },
  { timestamps: true },
);

const ServiceSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Types.ObjectId, ref: 'Organization' },
    name: String,
    duration: Number,
    price: Number,
    category: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
ServiceSchema.index({ orgId: 1, name: 1 }, { unique: true });

const ProviderSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Types.ObjectId, ref: 'Organization' },
    name: String,
    title: String,
    serviceId: { type: mongoose.Types.ObjectId, ref: 'Service' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
ProviderSchema.index({ orgId: 1, name: 1 }, { unique: true });

const ClinicSettingsSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Types.ObjectId, ref: 'Organization', unique: true },
    clinicName: String,
    providers: [{ id: String, name: String, role: String }],
  },
  { timestamps: true, strict: false },
);

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const Org = mongoose.model('Organization', OrgSchema);
  const Service = mongoose.model('Service', ServiceSchema);
  const Provider = mongoose.model('Provider', ProviderSchema);
  const Settings = mongoose.model('ClinicSetting', ClinicSettingsSchema);

  const org = await Org.findOne({ slug: 'demo-clinic' });
  if (!org) {
    console.error(
      'Org "demo-clinic" not found. Run seed-clinic-admin.ts first.',
    );
    process.exit(1);
  }

  const orgId = org._id;
  console.log(`Org: ${org.name} (${String(orgId)})`);

  // --- Seed 12 Services (representing the 12 medical departments) ---
  const services = [
    { name: 'Cardiology', duration: 30, price: 150, category: 'Specialist' },
    { name: 'Dermatology', duration: 30, price: 120, category: 'Specialist' },
    { name: 'Physician', duration: 30, price: 80, category: 'General' },
    { name: 'Neurology', duration: 45, price: 160, category: 'Specialist' },
    { name: 'Orthopedics', duration: 30, price: 140, category: 'Specialist' },
    { name: 'Pediatrics', duration: 30, price: 90, category: 'General' },
    { name: 'ENT', duration: 30, price: 100, category: 'Specialist' },
    { name: 'Gynecology', duration: 30, price: 110, category: 'Specialist' },
    { name: 'Psychiatry', duration: 45, price: 130, category: 'Specialist' },
    { name: 'Gastroenterology', duration: 30, price: 125, category: 'Specialist' },
    { name: 'Urology', duration: 30, price: 135, category: 'Specialist' },
    { name: 'Oncology', duration: 45, price: 170, category: 'Specialist' },
  ];

  const serviceMap: Record<string, any> = {};

  for (const s of services) {
    let doc = await Service.findOne({ orgId, name: s.name });
    if (doc) {
      console.log(`  Service exists: ${s.name}`);
    } else {
      doc = await Service.create({ orgId, ...s });
      console.log(
        `  Created service: ${s.name} (${s.duration}m · $${s.price})`,
      );
    }
    serviceMap[s.name] = doc._id;
  }

  // --- Seed 12 Providers (Doctors) mapped to the 12 Services ---
  const doctors = [
    { name: 'Dr. Sarah Mitchell', title: 'Cardiologist', serviceName: 'Cardiology' },
    { name: 'Dr. Anita Rao', title: 'Dermatologist', serviceName: 'Dermatology' },
    { name: 'Dr. James Walker', title: 'General Physician', serviceName: 'Physician' },
    { name: 'Dr. Tom Chen', title: 'Neurologist', serviceName: 'Neurology' },
    { name: 'Dr. John Doe', title: 'Orthopedic Surgeon', serviceName: 'Orthopedics' },
    { name: 'Dr. Jane Smith', title: 'Pediatrician', serviceName: 'Pediatrics' },
    { name: 'Dr. Robert Johnson', title: 'ENT Specialist', serviceName: 'ENT' },
    { name: 'Dr. Emily Davis', title: 'Gynecologist', serviceName: 'Gynecology' },
    { name: 'Dr. Michael Brown', title: 'Psychiatrist', serviceName: 'Psychiatry' },
    { name: 'Dr. David Wilson', title: 'Gastroenterologist', serviceName: 'Gastroenterology' },
    { name: 'Dr. William Moore', title: 'Urologist', serviceName: 'Urology' },
    { name: 'Dr. Linda Taylor', title: 'Oncologist', serviceName: 'Oncology' },
  ];

  const settingsProviders: Array<{ id: string; name: string; role: string }> = [];

  for (let i = 0; i < doctors.length; i++) {
    const docInfo = doctors[i];
    const sId = serviceMap[docInfo.serviceName];
    if (!sId) continue;

    let providerDoc = await Provider.findOne({ orgId, name: docInfo.name });
    if (providerDoc) {
      console.log(`  Provider exists: ${docInfo.name}`);
    } else {
      providerDoc = await Provider.create({
        orgId,
        name: docInfo.name,
        title: docInfo.title,
        serviceId: sId,
        isActive: true,
      });
      console.log(`  Created provider: ${docInfo.name} (${docInfo.title})`);
    }

    settingsProviders.push({
      id: `p${i + 1}`,
      name: docInfo.name,
      role: docInfo.title,
    });
  }

  // Update ClinicSettings fallback
  let settings = await Settings.findOne({ orgId });
  if (!settings) {
    settings = await Settings.create({
      orgId,
      clinicName: org.name,
      providers: settingsProviders,
    });
    console.log(`  Created clinic settings with ${settingsProviders.length} providers`);
  } else {
    (settings as any).providers = settingsProviders;
    await settings.save();
    console.log(`  Updated clinic settings with ${settingsProviders.length} providers`);
  }

  console.log('\n--- Done ---');
  console.log('Services:', services.map((s) => s.name).join(', '));
  console.log('Providers:', doctors.map((p) => p.name).join(', '));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
