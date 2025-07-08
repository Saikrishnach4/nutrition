import mongoose from 'mongoose';
import User from '../utils/userModel';
import dbConnect from '../utils/mongodb';

async function updateManualUsers() {
  await dbConnect();
  const users = await User.find({});
  const updates = users.map(async (user) => {
    user.subscription = 'free';
    user.subscriptionStatus = 'active';
    const baseDate = user.createdAt || new Date();
    user.trialEndsAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
    console.log(`Updated user: ${user.email}`);
  });
  await Promise.all(updates);
  console.log('All manual users updated.');
  mongoose.connection.close();
}

updateManualUsers().catch((err) => {
  console.error('Error updating users:', err);
  mongoose.connection.close();
}); 