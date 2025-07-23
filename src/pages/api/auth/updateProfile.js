import dbConnect from '../../../utils/mongodb';
import User from '../../../models/userModel';
import GoogleUser from '../../../models/googleUserModel';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { name, height, weight, age, gender, activityLevel, dietaryPreference, healthGoal } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  let userDoc = await User.findOne({ email: session.user.email });
  let isGoogle = false;
  if (!userDoc) {
    userDoc = await GoogleUser.findOne({ email: session.user.email });
    isGoogle = true;
  }
  if (!userDoc) return res.status(404).json({ error: 'User not found' });
  userDoc.name = name;
  if (typeof height !== 'undefined') userDoc.height = height;
  if (typeof weight !== 'undefined') userDoc.weight = weight;
  if (typeof age !== 'undefined') userDoc.age = age;
  if (typeof gender !== 'undefined') userDoc.gender = gender;
  if (typeof activityLevel !== 'undefined') userDoc.activityLevel = activityLevel;
  if (typeof dietaryPreference !== 'undefined') userDoc.dietaryPreference = dietaryPreference;
  if (typeof healthGoal !== 'undefined') userDoc.healthGoal = healthGoal;
  await userDoc.save();
  return res.status(200).json({
    message: 'Profile updated successfully',
    user: {
      name: userDoc.name,
      height: userDoc.height,
      weight: userDoc.weight,
      age: userDoc.age,
      gender: userDoc.gender,
      activityLevel: userDoc.activityLevel,
      dietaryPreference: userDoc.dietaryPreference,
      healthGoal: userDoc.healthGoal,
      subscription: userDoc.subscription,
      subscriptionStatus: userDoc.subscriptionStatus,
      trialEndsAt: userDoc.trialEndsAt,
      createdAt: userDoc.createdAt,
      isGoogle,
    },
  });
} 