const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insightiq');
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      mongoose.disconnect();
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      stats: {
        totalInterviews: 0,
        averageConfidence: 0,
        averageClarity: 0,
        improvementTrend: 0
      },
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      },
      badges: []
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('Email: test@example.com');
    console.log('Password: password123');

    mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    mongoose.disconnect();
  }
}

createTestUser();