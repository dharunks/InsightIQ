const mongoose = require('mongoose');
const { seedQuestions } = require('../utils/seedData');
require('dotenv').config();

async function runSeeder() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insightiq', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    console.log('🌱 Seeding questions...');
    const success = await seedQuestions();
    
    if (success) {
      console.log('🎉 Database seeded successfully!');
    } else {
      console.log('❌ Failed to seed database');
    }
    
  } catch (error) {
    console.error('💥 Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

module.exports = runSeeder;