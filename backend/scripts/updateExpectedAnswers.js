const mongoose = require('mongoose');
const QuestionBank = require('../models/QuestionBank');
require('dotenv').config();

// Expected answers for each question
const expectedAnswers = [
  {
    question: "Tell me about yourself.",
    expectedAnswer: "I'm Dharun, a software engineer with a strong interest in building practical and innovative solutions. I enjoy working on projects that combine technology and problem-solving, and I'm always looking for opportunities to learn new skills and contribute to impactful work."
  },
  {
    question: "What is the difference between let, const, and var in JavaScript?",
    expectedAnswer: "In JavaScript, var declares variables that are function-scoped (or globally scoped if declared outside a function) and can be redeclared or updated. let declares block-scoped variables (only accessible inside the nearest {} block) and can be updated but not redeclared within the same scope, making it safer than var. const is also block-scoped but creates a read-only binding — the variable cannot be reassigned after its initial value (though objects or arrays declared with const can still have their contents changed)."
  },
  {
    question: "Describe a challenging situation you faced and how you handled it.",
    expectedAnswer: "In my previous project, we had a very tight deadline to deliver a key module, but midway we discovered a major bug that affected core functionality. Instead of panicking, I broke the problem into smaller parts, coordinated with teammates to divide the debugging tasks, and worked extra hours to test each fix quickly. By prioritizing the most critical issues and keeping communication open with the team and stakeholders, we were able to resolve the bug and still deliver the module on time."
  },
  {
    question: "Why do you want to work for our company?",
    expectedAnswer: "I'm impressed by your company's reputation for innovation and its focus on delivering impactful solutions. I want to be part of a team where I can apply my skills, keep learning, and contribute to meaningful projects that make a real difference."
  },
  {
    question: "Where do you see yourself in 5 years?",
    expectedAnswer: "In five years, I see myself having grown into a more skilled and experienced software engineer, taking on greater responsibilities, leading projects, and contributing to innovative solutions within your company. I also aim to continue learning new technologies and strengthening my leadership and problem-solving skills."
  },
  {
    question: "Explain the concept of closures in JavaScript.",
    expectedAnswer: "In JavaScript, a closure is created when an inner function \"remembers\" and can access variables from its outer (enclosing) function even after that outer function has finished executing. This happens because functions in JavaScript form their own scope and carry a reference to the environment in which they were created. Closures are widely used to create private data, maintain state between function calls, and implement callbacks or event handlers."
  },
  {
    question: "What is the difference between SQL and NoSQL databases?",
    expectedAnswer: "SQL databases are relational, use structured schemas, and store data in tables with rows and columns. They are ideal for complex queries and transactions, ensuring data consistency (ACID properties). NoSQL databases are non-relational, schema-less, and store data in formats like documents, key-value pairs, or graphs. They are highly scalable and flexible, making them suitable for handling large volumes of unstructured or rapidly changing data."
  },
  {
    question: "Tell me about a time when you had to work with a difficult team member.",
    expectedAnswer: "In one project, I had a team member who often disagreed with others and resisted suggestions, which slowed progress. I decided to approach the situation calmly by actively listening to their concerns and finding common ground. By involving them in planning decisions and clearly communicating expectations, we were able to collaborate more effectively, complete the project on time, and even incorporate some of their valuable ideas."
  },
  {
    question: "How would you handle a situation where you disagree with your manager?",
    expectedAnswer: "If I disagreed with my manager, I would first try to understand their perspective fully. Then, I would present my points respectfully, supported with data or examples, and suggest possible alternatives. Ultimately, I would be open to feedback and follow the final decision, focusing on the success of the project and team."
  }
];

async function updateExpectedAnswers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insightiq', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    console.log('🔄 Updating expected answers...');
    
    let updatedCount = 0;
    
    // Update each question with its expected answer
    for (const item of expectedAnswers) {
      // Find the question by its text (case-insensitive)
      const question = await QuestionBank.findOne({
        question: { $regex: new RegExp('^' + item.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
      });
      
      if (question) {
        // Update the question with the expected answer
        question.expectedAnswer = item.expectedAnswer;
        await question.save();
        updatedCount++;
        console.log(`✅ Updated: "${item.question.substring(0, 40)}..."`);
      } else {
        console.log(`❌ Question not found: "${item.question.substring(0, 40)}..."`);
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} out of ${expectedAnswers.length} questions`);
    
  } catch (error) {
    console.error('💥 Error updating expected answers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  updateExpectedAnswers();
}

module.exports = updateExpectedAnswers;