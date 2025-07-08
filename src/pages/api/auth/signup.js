import dbConnect from '../../../utils/mongodb';
import User from '../../../models/userModel';
import GoogleUser from '../../../models/googleUserModel';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  await dbConnect();

  const existingUser = await User.findOne({ email });
  const existingGoogleUser = await GoogleUser.findOne({ email });

  if (existingUser || existingGoogleUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdAt = new Date();
  const trialEndsAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    subscription: 'free',
    subscriptionStatus: 'active',
    trialEndsAt,
    createdAt
  });

  const { password: _, ...userWithoutPassword } = newUser.toObject();

  res.status(201).json({
    message: 'User created successfully',
    user: userWithoutPassword
  });
}
