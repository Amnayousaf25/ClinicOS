#!/usr/bin/env node
// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Wipe clinic operational data while preserving auth + tenancy.
 *
 * Drops:
 *   - patients
 *   - counters          (MRN sequence — resets so new patients start at P-000001)
 *   - appointments
 *   - appointmenthistories
 *   - intakeforms
 *   - reminderlogs
 *
 * Preserves:
 *   - organizations, users, services, providers, insurances,
 *     clinicsettings, reminderconfigs
 *
 * Usage:
 *   node scripts/wipe-clinic-data.js --env=dev --confirm
 *   node scripts/wipe-clinic-data.js --env=prod --confirm   (will refuse without TIBOVA_ALLOW_PROD_WIPE=yes)
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const env = args.env || 'dev';
const confirmed = args.confirm === 'true';

dotenv.config({ path: path.resolve(__dirname, `..`, `.env.${env}`) });

const COLLECTIONS_TO_WIPE = [
  'patients',
  'counters',
  'appointments',
  'appointmenthistories',
  'intakeforms',
  'reminderlogs',
];

const COLLECTIONS_PRESERVED = [
  'organizations',
  'users',
  'services',
  'providers',
  'insurances',
  'insuranceproviders',
  'clinicsettings',
  'reminderconfigs',
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(`Missing MONGODB_URI in .env.${env}`);
    process.exit(1);
  }

  if (env === 'prod' && process.env.TIBOVA_ALLOW_PROD_WIPE !== 'yes') {
    console.error(
      'Refusing prod wipe. Set TIBOVA_ALLOW_PROD_WIPE=yes if you really mean it.',
    );
    process.exit(1);
  }

  console.log(`\nEnvironment:    ${env}`);
  console.log(`MongoDB URI:    ${uri.replace(/:\/\/[^@]+@/, '://****@')}`);
  console.log(`\nWill DELETE all documents from:`);
  for (const c of COLLECTIONS_TO_WIPE) console.log(`  - ${c}`);
  console.log(`\nWill PRESERVE:`);
  for (const c of COLLECTIONS_PRESERVED) console.log(`  - ${c}`);

  if (!confirmed) {
    console.log(
      '\nDry run. Re-run with --confirm to actually delete.\n',
    );
    process.exit(0);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('');
  for (const name of COLLECTIONS_TO_WIPE) {
    const exists = await db
      .listCollections({ name }, { nameOnly: true })
      .toArray();
    if (exists.length === 0) {
      console.log(`  - ${name.padEnd(25)}  (no collection — skipped)`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    console.log(
      `  - ${name.padEnd(25)}  ${String(result.deletedCount).padStart(6)} deleted`,
    );
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
