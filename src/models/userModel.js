import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    minlength: [1, 'Name cannot be empty']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: { 
    type: String, 
    required: false,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  subscription: { 
    type: String, 
    enum: {
      values: ['free', 'premium', 'pro'],
      message: 'Subscription must be either free, premium, or pro'
    },
    default: 'free' 
  },
  subscriptionStatus: { 
    type: String, 
    enum: {
      values: ['active', 'inactive', 'cancelled', 'expired'],
      message: 'Subscription status must be active, inactive, cancelled, or expired'
    },
    default: 'active' 
  },
  trialEndsAt: { 
    type: Date,
    validate: {
      validator: function(value) {
        // Trial end date should be in the future when set
        return !value || value > new Date();
      },
      message: 'Trial end date must be in the future'
    }
  },
  weight: { 
    type: Number,
    min: [0, 'Weight cannot be negative'],
    max: [500, 'Weight cannot exceed 500 kg'],
    validate: {
      validator: function(value) {
        return value === null || value === undefined || (!isNaN(value) && isFinite(value));
      },
      message: 'Weight must be a valid number'
    }
  },
  height: { 
    type: Number, // Height in feet
    min: [0, 'Height cannot be negative'],
    max: [10, 'Height cannot exceed 10 feet'],
    validate: {
      validator: function(value) {
        return value === null || value === undefined || (!isNaN(value) && isFinite(value));
      },
      message: 'Height must be a valid number'
    }
  },
  age: { 
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot exceed 120 years'],
    validate: {
      validator: function(value) {
        return value === null || value === undefined || (Number.isInteger(value) && value >= 0);
      },
      message: 'Age must be a valid whole number'
    }
  },
  gender: { 
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other', null],
      message: 'Gender must be Male, Female, or Other'
    },
    default: null
  },
  activityLevel: { 
    type: String,
    enum: {
      values: [
        'Sedentary', 
        'Lightly Active', 
        'Moderately Active', 
        'Very Active', 
        'Extremely Active',
        null
      ],
      message: 'Invalid activity level selected'
    },
    default: null
  },
  dietaryPreference: { 
    type: String,
    enum: {
      values: [
        'Vegetarian', 
        'Vegan', 
        'Gluten-Free', 
        'Keto', 
        'Paleo', 
        'Mixed',
        null
      ],
      message: 'Invalid dietary preference selected'
    },
    default: null
  },
  healthGoal: { 
    type: String,
    enum: {
      values: [
        'Lose Weight', 
        'Gain Muscle', 
        'Maintain Weight', 
        'Improve Health',
        null
      ],
      message: 'Invalid health goal selected'
    },
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true // Prevent modification of creation date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove password from JSON output for security
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ subscription: 1, subscriptionStatus: 1 });

// Virtual for BMI calculation (if height and weight are available)
UserSchema.virtual('bmi').get(function() {
  if (this.weight && this.height) {
    // Convert height from feet to meters
    const heightInMeters = this.height * 0.3048;
    const bmi = this.weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }
  return null;
});

// Virtual for BMI category
UserSchema.virtual('bmiCategory').get(function() {
  const bmi = this.bmi;
  if (!bmi) return null;
  
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
});

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware for additional validation
UserSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  // Ensure name is properly formatted
  if (this.name) {
    this.name = this.name.trim();
  }
  
  next();
});

// Instance method to get profile completion percentage
UserSchema.methods.getProfileCompletion = function() {
  const fields = ['name', 'height', 'weight', 'age', 'gender', 'activityLevel', 'dietaryPreference', 'healthGoal'];
  const filledFields = fields.filter(field => this[field] !== null && this[field] !== undefined && this[field] !== '');
  return Math.round((filledFields.length / fields.length) * 100);
};

// Instance method to check if profile is complete
UserSchema.methods.isProfileComplete = function() {
  return this.getProfileCompletion() === 100;
};

// Static method to find users with incomplete profiles
UserSchema.statics.findIncompleteProfiles = function() {
  return this.find({
    $or: [
      { height: { $exists: false } },
      { weight: { $exists: false } },
      { age: { $exists: false } },
      { gender: { $exists: false } },
      { activityLevel: { $exists: false } },
      { dietaryPreference: { $exists: false } },
      { healthGoal: { $exists: false } },
      { height: null },
      { weight: null },
      { age: null },
      { gender: null },
      { activityLevel: null },
      { dietaryPreference: null },
      { healthGoal: null }
    ]
  });
};

export default mongoose.models.User || mongoose.model('User', UserSchema);