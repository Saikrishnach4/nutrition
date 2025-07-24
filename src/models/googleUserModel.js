import mongoose from 'mongoose';

const GoogleUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  subscription: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' },
  trialEndsAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  height: { type: String },
  weight: { type: String },
  age: { type: Number },
  gender: { type: String },
  activityLevel: { type: String },
  dietaryPreference: { type: String },
  healthGoal: { type: String },
});

export default mongoose.models.GoogleUser || mongoose.model('GoogleUser', GoogleUserSchema); 