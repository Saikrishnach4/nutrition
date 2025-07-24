// Enhanced API handler with better validation and error handling
import dbConnect from '../../../utils/mongodb';
import User from '../../../models/userModel';
import GoogleUser from '../../../models/googleUserModel';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

// Validation helpers
const validateHeight = (height) => {
  if (height !== undefined && height !== null) {
    const num = parseFloat(height);
    if (isNaN(num) || num < 0 || num > 10) {
      return 'Height must be between 0 and 10 feet';
    }
  }
  return null;
};

const validateWeight = (weight) => {
  if (weight !== undefined && weight !== null) {
    const num = parseFloat(weight);
    if (isNaN(num) || num < 0 || num > 500) {
      return 'Weight must be between 0 and 500 kg';
    }
  }
  return null;
};

const validateAge = (age) => {
  if (age !== undefined && age !== null) {
    const num = parseInt(age);
    if (isNaN(num) || num < 0 || num > 120) {
      return 'Age must be between 0 and 120 years';
    }
  }
  return null;
};

const validateGender = (gender) => {
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    return 'Invalid gender selection';
  }
  return null;
};

const validateActivityLevel = (activityLevel) => {
  const validLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];
  if (activityLevel && !validLevels.includes(activityLevel)) {
    return 'Invalid activity level selection';
  }
  return null;
};

const validateDietaryPreference = (dietaryPreference) => {
  const validPreferences = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Mixed'];
  if (dietaryPreference && !validPreferences.includes(dietaryPreference)) {
    return 'Invalid dietary preference selection';
  }
  return null;
};

const validateHealthGoal = (healthGoal) => {
  const validGoals = ['Lose Weight', 'Gain Muscle', 'Maintain Weight', 'Improve Health'];
  if (healthGoal && !validGoals.includes(healthGoal)) {
    return 'Invalid health goal selection';
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, height, weight, age, gender, activityLevel, dietaryPreference, healthGoal } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and cannot be empty' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name cannot exceed 100 characters' });
    }

    // Validate optional fields
    const validationErrors = [
      validateHeight(height),
      validateWeight(weight),
      validateAge(age),
      validateGender(gender),
      validateActivityLevel(activityLevel),
      validateDietaryPreference(dietaryPreference),
      validateHealthGoal(healthGoal)
    ].filter(error => error !== null);

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // Find user in either User or GoogleUser collection
    let userDoc = await User.findOne({ email: session.user.email });
    let isGoogle = false;
    
    if (!userDoc) {
      userDoc = await GoogleUser.findOne({ email: session.user.email });
      isGoogle = true;
    }

    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    userDoc.name = name.trim();
    
    // Only update fields that were provided (not undefined)
    if (height !== undefined) {
      userDoc.height = height ? parseFloat(height) : null;
    }
    if (weight !== undefined) {
      userDoc.weight = weight ? parseFloat(weight) : null;
    }
    if (age !== undefined) {
      userDoc.age = age ? parseInt(age) : null;
    }
    if (gender !== undefined) {
      userDoc.gender = gender || null;
    }
    if (activityLevel !== undefined) {
      userDoc.activityLevel = activityLevel || null;
    }
    if (dietaryPreference !== undefined) {
      userDoc.dietaryPreference = dietaryPreference || null;
    }
    if (healthGoal !== undefined) {
      userDoc.healthGoal = healthGoal || null;
    }

    // Save the updated user
    await userDoc.save();

    // Return success response with updated user data
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        name: userDoc.name,
        email: userDoc.email,
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

  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errorMessages.join(', ') });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid data format provided' });
    }
    
    // Handle duplicate key errors (though unlikely for profile updates)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A user with this information already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}