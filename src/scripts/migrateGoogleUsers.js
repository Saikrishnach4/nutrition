import mongoose from 'mongoose';
import User from '../utils/userModel';

// This schema is only for reading old GoogleUser documents
const GoogleUserSchema = new mongoose.Schema({}, { strict: false });
const GoogleUser = mongoose.models.GoogleUser || mongoose.model('GoogleUser', GoogleUserSchema, 'googleusers');

import dbConnect from '../utils/mongodb';

async function migrateGoogleUsers() {
  await dbConnect();
  const googleUsers = await GoogleUser.find({});
  let migrated = 0;
  for (const gUser of googleUsers) {
    const exists = await User.findOne({ email: gUser.email });
    if (exists) {
      console.log(`Skipping ${gUser.email} (already exists in User collection)`);
      continue;
    }
    await User.create({
      name: gUser.name,
      email: gUser.email,
      provider: 'google',
      image: gUser.picture || gUser.image || '',
      subscription: gUser.subscription || 'free',
      subscriptionStatus: gUser.subscriptionStatus || 'active',
      trialEndsAt: gUser.trialEndsAt,
      planStartDate: gUser.planStartDate || gUser.createdAt || new Date(),
      planEndDate: gUser.planEndDate || null,
      lastLoginAt: gUser.lastLoginAt || gUser.createdAt || new Date(),
      createdAt: gUser.createdAt || new Date()
    });
    migrated++;
    console.log(`Migrated Google user: ${gUser.email}`);
  }
  console.log(`Migration complete. Migrated ${migrated} users.`);
  mongoose.connection.close();
}

migrateGoogleUsers().catch((err) => {
  console.error('Error migrating Google users:', err);
  mongoose.connection.close();
}); 