const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Interview = require('./models/Interview');

async function checkInterviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insightiq');
    console.log('✅ Connected to MongoDB');

    // Find test user
    const user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.log('❌ Test user not found');
      mongoose.disconnect();
      return;
    }

    console.log('✅ Test user found:', user.email);

    // Find interviews for this user
    const interviews = await Interview.find({ user: user._id });
    
    console.log(`Found ${interviews.length} interviews for user`);
    
    if (interviews.length > 0) {
      console.log('\nInterviews:');
      interviews.forEach((interview, index) => {
        console.log(`\n${index + 1}. ${interview.title} (${interview.status})`);
        if (interview.overallAnalysis) {
          console.log(`   Answer Score: ${interview.overallAnalysis.answerScore}`);
          console.log(`   Answered Questions: ${interview.overallAnalysis.answeredQuestions}/${interview.overallAnalysis.totalQuestions}`);
        } else {
          console.log('   No overall analysis data');
        }
      });
    }

    mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error checking interviews:', error);
    mongoose.disconnect();
  }
}

checkInterviews();