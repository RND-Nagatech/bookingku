import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const email = String(process.env.PLATFORM_ADMIN_EMAIL || '').trim().toLowerCase();
const name = String(process.env.PLATFORM_ADMIN_NAME || 'Platform Admin').trim();
const password = String(process.env.PLATFORM_ADMIN_PASSWORD || '');

if (!email || !password) {
  console.error('PLATFORM_ADMIN_EMAIL dan PLATFORM_ADMIN_PASSWORD wajib diisi di api/.env');
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bookingku_templates');
  const users = db.collection('tm_user');
  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date();
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { name, password_hash: passwordHash, role: 'platform_admin', updated_at: timestamp } },
    );
    console.log(`Platform Admin diperbarui: ${email}`);
  } else {
    await users.insertOne({
      name, email, password_hash: passwordHash, role: 'platform_admin',
      created_at: timestamp, updated_at: timestamp,
    });
    console.log(`Platform Admin dibuat: ${email}`);
  }
} finally {
  await client.close();
}
