const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Interview = require('./models/Interview');

async function testCompleteInterview() {
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

    // Find a draft interview for this user
    const interview = await Interview.findOne({ user: user._id, status: 'draft' });
    
    if (!interview) {
      console.log('❌ No draft interview found for user');
      mongoose.disconnect();
      return;
    }

    console.log('✅ Found draft interview:', interview.title);

    // Simulate completing the interview with some analysis data
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.duration = 300; // 5 minutes
    
    // Add some mock analysis data to questions
    if (interview.questions && interview.questions.length > 0) {
      interview.questions = interview.questions.map((q, index) => ({
        ...q,
        response: {
          text: `This is a sample response for question ${index + 1}`,
          audioUrl: null,
          videoUrl: null
        },
        analysis: {
          confidence: { score: 8.5 },
          communication: { clarity: 7.2 },
          sentiment: { overall: 0.3 },
          answerScore: { score: 8.0 },
          overallScore: 7.8
        }
      }));
    }
    
    // Save the interview
    await interview.save();
    
    console.log('✅ Interview completed and saved');
    
    // Check if overallAnalysis was properly populated
    const updatedInterview = await Interview.findById(interview._id);
    
    if (updatedInterview.overallAnalysis) {
      console.log('\nOverall Analysis:');
      console.log(`Answer Score: ${updatedInterview.overallAnalysis.answerScore}`);
      console.log(`Answered Questions: ${updatedInterview.overallAnalysis.answeredQuestions}/${updatedInterview.overallAnalysis.totalQuestions}`);
      console.log(`Average Confidence: ${updatedInterview.overallAnalysis.averageConfidence}`);
      console.log(`Average Clarity: ${updatedInterview.overallAnalysis.averageClarity}`);
    } else {
      console.log('❌ No overall analysis data found');
    }

    mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error completing interview:', error);
    mongoose.disconnect();
  }
}

testCompleteInterview();