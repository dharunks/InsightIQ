const QuestionBank = require('../models/QuestionBank');

// Sample questions to populate the database
const sampleQuestions = [
  // HR Questions - Beginner
  {
    category: 'hr',
    subcategory: 'Introduction',
    difficulty: 'beginner',
    question: "Tell me about yourself.",
    tags: ['introduction', 'background', 'overview'],
    industry: ['general'],
    expectedAnswerStructure: "Brief professional summary highlighting key experiences, skills, and career goals.",
    sampleAnswerPoints: [
      "Current role and responsibilities",
      "Key accomplishments",
      "Relevant skills",
      "Career aspirations"
    ],
    timeLimit: 120,
    tips: [
      "Keep it professional and concise",
      "Focus on relevant experience",
      "End with why you're interested in this role"
    ]
  },
  {
    category: 'hr',
    subcategory: 'Motivation',
    difficulty: 'beginner',
    question: "Why do you want to work here?",
    tags: ['motivation', 'company-research', 'interest'],
    industry: ['general'],
    expectedAnswerStructure: "Demonstrate knowledge of the company and align personal goals with company values.",
    sampleAnswerPoints: [
      "Company mission and values alignment",
      "Growth opportunities",
      "Industry leadership",
      "Personal career goals"
    ],
    timeLimit: 90,
    tips: [
      "Research the company beforehand",
      "Connect your goals with theirs",
      "Show genuine enthusiasm"
    ]
  },
  {
    category: 'hr',
    subcategory: 'Strengths',
    difficulty: 'beginner',
    question: "What are your greatest strengths?",
    tags: ['strengths', 'self-assessment', 'skills'],
    industry: ['general'],
    expectedAnswerStructure: "Identify 2-3 key strengths with specific examples demonstrating each.",
    sampleAnswerPoints: [
      "Specific strength with example",
      "How it benefited previous employers",
      "Relevance to the target role"
    ],
    timeLimit: 120,
    tips: [
      "Choose strengths relevant to the job",
      "Use specific examples",
      "Quantify your impact when possible"
    ]
  },

  // HR Questions - Intermediate
  {
    category: 'hr',
    subcategory: 'Challenges',
    difficulty: 'intermediate',
    question: "Describe a time when you faced a significant challenge at work. How did you handle it?",
    tags: ['problem-solving', 'challenges', 'resilience'],
    industry: ['general'],
    expectedAnswerStructure: "Use STAR method: Situation, Task, Action, Result.",
    sampleAnswerPoints: [
      "Clear description of the challenge",
      "Your role and responsibility",
      "Specific actions taken",
      "Measurable results achieved"
    ],
    timeLimit: 180,
    tips: [
      "Use the STAR method",
      "Focus on your actions",
      "Highlight the positive outcome"
    ]
  },
  {
    category: 'hr',
    subcategory: 'Teamwork',
    difficulty: 'intermediate',
    question: "Tell me about a time when you had to work with a difficult team member.",
    tags: ['teamwork', 'conflict-resolution', 'communication'],
    industry: ['general'],
    expectedAnswerStructure: "Demonstrate emotional intelligence and professional conflict resolution.",
    sampleAnswerPoints: [
      "Situation description",
      "Communication approach",
      "Collaborative solution",
      "Relationship improvement"
    ],
    timeLimit: 150,
    tips: [
      "Focus on professional solutions",
      "Avoid personal criticism",
      "Emphasize positive outcomes"
    ]
  },

  // Behavioral Questions - Beginner
  {
    category: 'behavioral',
    subcategory: 'Leadership',
    difficulty: 'beginner',
    question: "Describe your leadership style.",
    tags: ['leadership', 'management', 'style'],
    industry: ['general'],
    expectedAnswerStructure: "Describe your approach to leading others with examples.",
    sampleAnswerPoints: [
      "Leadership philosophy",
      "Communication style",
      "Team motivation approach",
      "Example of successful leadership"
    ],
    timeLimit: 120,
    tips: [
      "Be authentic to your style",
      "Provide concrete examples",
      "Show adaptability"
    ]
  },
  {
    category: 'behavioral',
    subcategory: 'Problem Solving',
    difficulty: 'beginner',
    question: "How do you approach problem-solving?",
    tags: ['problem-solving', 'analytical', 'methodology'],
    industry: ['general'],
    expectedAnswerStructure: "Outline your systematic approach to identifying and solving problems.",
    sampleAnswerPoints: [
      "Problem identification process",
      "Information gathering methods",
      "Solution evaluation criteria",
      "Implementation approach"
    ],
    timeLimit: 120,
    tips: [
      "Describe a clear process",
      "Use specific examples",
      "Show logical thinking"
    ]
  },

  // Behavioral Questions - Intermediate
  {
    category: 'behavioral',
    subcategory: 'Adaptability',
    difficulty: 'intermediate',
    question: "Tell me about a time when you had to adapt to a significant change at work.",
    tags: ['adaptability', 'change-management', 'flexibility'],
    industry: ['general'],
    expectedAnswerStructure: "Demonstrate flexibility and positive attitude toward change using STAR method.",
    sampleAnswerPoints: [
      "Description of the change",
      "Initial reaction and concerns",
      "Adaptation strategies used",
      "Successful outcome"
    ],
    timeLimit: 180,
    tips: [
      "Show positive attitude",
      "Highlight learning outcomes",
      "Demonstrate proactive adaptation"
    ]
  },

  // Technical Questions - Beginner
  {
    category: 'technical',
    subcategory: 'Programming',
    difficulty: 'beginner',
    question: "Explain the difference between a variable and a constant in programming.",
    tags: ['programming', 'fundamentals', 'concepts'],
    industry: ['technology', 'software'],
    expectedAnswerStructure: "Clear explanation of both concepts with examples.",
    sampleAnswerPoints: [
      "Variable definition and characteristics",
      "Constant definition and characteristics",
      "When to use each",
      "Examples in code"
    ],
    timeLimit: 90,
    tips: [
      "Use simple, clear language",
      "Provide code examples",
      "Explain practical applications"
    ]
  },
  {
    category: 'technical',
    subcategory: 'Database',
    difficulty: 'beginner',
    question: "What is a database and why is it important?",
    tags: ['database', 'fundamentals', 'data-storage'],
    industry: ['technology', 'data'],
    expectedAnswerStructure: "Explain database concept, types, and business importance.",
    sampleAnswerPoints: [
      "Database definition",
      "Types of databases",
      "Benefits for organizations",
      "Real-world examples"
    ],
    timeLimit: 120,
    tips: [
      "Start with basics",
      "Use business examples",
      "Explain benefits clearly"
    ]
  },

  // Technical Questions - Intermediate
  {
    category: 'technical',
    subcategory: 'System Design',
    difficulty: 'intermediate',
    question: "How would you design a simple web application architecture?",
    tags: ['system-design', 'architecture', 'web-development'],
    industry: ['technology', 'software'],
    expectedAnswerStructure: "Describe layers, components, and their interactions.",
    sampleAnswerPoints: [
      "Frontend components",
      "Backend services",
      "Database design",
      "Communication protocols"
    ],
    timeLimit: 300,
    tips: [
      "Start with high-level overview",
      "Consider scalability",
      "Explain design decisions"
    ]
  },

  // Situational Questions - Beginner
  {
    category: 'situational',
    subcategory: 'Decision Making',
    difficulty: 'beginner',
    question: "How would you handle a situation where you disagree with your supervisor's decision?",
    tags: ['conflict-resolution', 'communication', 'professionalism'],
    industry: ['general'],
    expectedAnswerStructure: "Show professional approach to disagreement and constructive communication.",
    sampleAnswerPoints: [
      "Listen and understand their perspective",
      "Express concerns professionally",
      "Propose alternative solutions",
      "Accept final decision gracefully"
    ],
    timeLimit: 120,
    tips: [
      "Show respect for authority",
      "Demonstrate professionalism",
      "Focus on constructive dialogue"
    ]
  },
  {
    category: 'situational',
    subcategory: 'Time Management',
    difficulty: 'beginner',
    question: "How would you prioritize tasks when everything seems urgent?",
    tags: ['time-management', 'prioritization', 'organization'],
    industry: ['general'],
    expectedAnswerStructure: "Describe systematic approach to prioritization and time management.",
    sampleAnswerPoints: [
      "Assessment criteria for urgency",
      "Prioritization framework",
      "Communication with stakeholders",
      "Task delegation strategies"
    ],
    timeLimit: 120,
    tips: [
      "Explain your methodology",
      "Show logical thinking",
      "Consider stakeholder impact"
    ]
  },

  // Situational Questions - Intermediate
  {
    category: 'situational',
    subcategory: 'Crisis Management',
    difficulty: 'intermediate',
    question: "What would you do if you discovered a critical error in a project just before the deadline?",
    tags: ['crisis-management', 'problem-solving', 'communication'],
    industry: ['general'],
    expectedAnswerStructure: "Demonstrate calm decision-making under pressure and stakeholder communication.",
    sampleAnswerPoints: [
      "Immediate assessment of the error",
      "Impact analysis",
      "Communication with stakeholders",
      "Action plan and execution"
    ],
    timeLimit: 180,
    tips: [
      "Stay calm and analytical",
      "Prioritize transparency",
      "Focus on solutions"
    ]
  },

  // Advanced Questions
  {
    category: 'technical',
    subcategory: 'Architecture',
    difficulty: 'advanced',
    question: "Design a scalable system that can handle millions of concurrent users.",
    tags: ['scalability', 'architecture', 'performance'],
    industry: ['technology'],
    expectedAnswerStructure: "Comprehensive system design covering all scalability aspects.",
    sampleAnswerPoints: [
      "Load balancing strategies",
      "Database sharding and replication",
      "Caching mechanisms",
      "Microservices architecture"
    ],
    timeLimit: 600,
    tips: [
      "Think about bottlenecks",
      "Consider different components",
      "Discuss trade-offs"
    ]
  },
  {
    category: 'behavioral',
    subcategory: 'Leadership',
    difficulty: 'advanced',
    question: "Describe a time when you had to lead a major organizational change initiative.",
    tags: ['change-management', 'leadership', 'strategy'],
    industry: ['general'],
    expectedAnswerStructure: "Demonstrate strategic thinking, stakeholder management, and change leadership.",
    sampleAnswerPoints: [
      "Change vision and strategy",
      "Stakeholder engagement plan",
      "Implementation roadmap",
      "Resistance management"
    ],
    timeLimit: 240,
    tips: [
      "Show strategic thinking",
      "Highlight stakeholder management",
      "Demonstrate measurable results"
    ]
  }
];

// Function to seed the database with sample questions
async function seedQuestions() {
  try {
    // Clear existing questions
    await QuestionBank.deleteMany({});
    
    // Insert sample questions
    await QuestionBank.insertMany(sampleQuestions);
    
    console.log(`✅ Successfully seeded ${sampleQuestions.length} questions to the database`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    return false;
  }
}

module.exports = {
  sampleQuestions,
  seedQuestions
};