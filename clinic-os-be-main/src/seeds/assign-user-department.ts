/**
 * One-off helper: assign a department to a user by id.
 *
 * Usage:
 *   yarn ts-node src/seeds/assign-user-department.ts <userId> <departmentId>
 *
 * Example:
 *   yarn ts-node src/seeds/assign-user-department.ts \
 *     69c65e5878493fee9900cc8f 69df3ccbe1b141ad5f9fd6f7
 *
 * Validates that both documents exist and that the department belongs to
 * the same organization as the user before writing. Idempotent.
 */

import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env.dev');
dotenv.config({ path: envPath });

async function main() {
  const [, , userId, departmentId] = process.argv;
  if (!userId || !departmentId) {
    console.error(
      'Usage: ts-node assign-user-department.ts <userId> <departmentId>',
    );
    process.exit(1);
  }
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    console.error('Both userId and departmentId must be valid ObjectIds');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  const userOid = new mongoose.Types.ObjectId(userId);
  const deptOid = new mongoose.Types.ObjectId(departmentId);

  const user = await mongoose.connection
    .collection('users')
    .findOne(
      { _id: userOid },
      { projection: { orgId: 1, name: 1, department: 1 } },
    );
  if (!user) {
    console.error(`User ${userId} not found`);
    process.exit(1);
  }

  const dept = await mongoose.connection
    .collection('departments')
    .findOne({ _id: deptOid }, { projection: { orgId: 1, name: 1 } });
  if (!dept) {
    console.error(`Department ${departmentId} not found`);
    process.exit(1);
  }

  if (String(user.orgId) !== String(dept.orgId)) {
    console.error(
      `Cross-tenant write blocked: user.orgId=${user.orgId} but department.orgId=${dept.orgId}`,
    );
    process.exit(1);
  }

  if (String(user.department) === String(deptOid)) {
    console.log(
      `No change — user "${user.name}" already in department "${dept.name}"`,
    );
    await mongoose.disconnect();
    return;
  }

  await mongoose.connection
    .collection('users')
    .updateOne({ _id: userOid }, { $set: { department: deptOid } });

  console.log(
    `✓ user "${user.name}" (${userId}) assigned to department "${dept.name}" (${departmentId})`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
