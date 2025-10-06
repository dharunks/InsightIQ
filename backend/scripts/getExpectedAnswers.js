const mongoose = require('mongoose');
const QuestionBank = require('../models/QuestionBank');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function getExpectedAnswers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insightiq', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Retrieving all questions and expected answers...');
    
    const questions = await QuestionBank.find({}).lean();
    
    console.log(`\n📋 Found ${questions.length} questions in the database\n`);
    
    // Create output file
    const outputPath = path.join(__dirname, '../expected_answers.md');
    let output = `# Expected Answers for All Questions\n\nTotal Questions: ${questions.length}\n\n`;
    
    // Format all questions with their expected answers
    questions.forEach((q, index) => {
      output += `## Question ${index + 1}: ${q.question}\n\n`;
      output += `**Category:** ${q.category} | **Subcategory:** ${q.subcategory} | **Difficulty:** ${q.difficulty}\n\n`;
      output += `**Expected Answer:** ${q.expectedAnswer || 'Not specified'}\n\n`;
      
      if (q.sampleAnswerPoints && q.sampleAnswerPoints.length > 0) {
        output += '**Sample Answer Points:**\n';
        q.sampleAnswerPoints.forEach(point => {
          output += `- ${point}\n`;
        });
        output += '\n';
      }
      
      if (q.tips && q.tips.length > 0) {
        output += '**Tips:**\n';
        q.tips.forEach(tip => {
          output += `- ${tip}\n`;
        });
        output += '\n';
      }
      
      output += '---\n\n';
      
      // Also print to console for immediate feedback
      console.log(`Question ${index + 1}: ${q.question}`);
      console.log(`Category: ${q.category} | Subcategory: ${q.subcategory} | Difficulty: ${q.difficulty}`);
      console.log(`Expected Answer: ${q.expectedAnswer || 'Not specified'}`);
      console.log('\n' + '-'.repeat(40) + '\n');
    });
    
    // Write to file
    fs.writeFileSync(outputPath, output);
    console.log(`✅ Expected answers saved to ${outputPath}`);
    
  } catch (error) {
    console.error('💥 Error retrieving questions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  getExpectedAnswers();
}

module.exports = getExpectedAnswers;