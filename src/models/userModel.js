import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  subscription: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' },
  trialEndsAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 