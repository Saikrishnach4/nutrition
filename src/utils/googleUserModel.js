import mongoose from 'mongoose';

const GoogleUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  subscription: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' },
  trialEndsAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.GoogleUser || mongoose.model('GoogleUser', GoogleUserSchema); 