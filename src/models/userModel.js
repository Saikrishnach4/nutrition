import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  subscription: { type: String, default: 'free' },
  subscriptionStatus: { type: String, default: 'active' },
  trialEndsAt: { type: Date },
  weight: { type: Number },
  height: { type: Number }, // Height in feet
  age: { type: Number },
  gender: { type: String },
  activityLevel: { type: String },
  dietaryPreference: { type: String },
  healthGoal: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 