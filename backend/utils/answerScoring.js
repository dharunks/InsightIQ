// ============================================
// answerScoring.js
// ============================================
// Version: 3.0
// Purpose: Evaluate responses for all 9 HR + Technical questions
// ============================================

import natural from "natural";
import Sentiment from "sentiment";

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// ------------------------------------------------------
// Expected Answers Dataset
// ------------------------------------------------------
const expectedAnswers = {
  1: `I'm Dharun, a software engineer with a strong interest in building practical and innovative solutions. I enjoy working on projects that combine technology and problem-solving, and I'm always looking for opportunities to learn new skills and contribute to impactful work.`,
  2: `In JavaScript, var declares variables that are function-scoped (or globally scoped if declared outside a function) and can be redeclared or updated. let declares block-scoped variables (only accessible inside the nearest {} block) and can be updated but not redeclared within the same scope, making it safer than var. const is also block-scoped but creates a read-only binding — the variable cannot be reassigned after its initial value (though objects or arrays declared with const can still have their contents changed).`,
  3: `In my previous project, we had a very tight deadline to deliver a key module, but midway we discovered a major bug that affected core functionality. Instead of panicking, I broke the problem into smaller parts, coordinated with teammates to divide the debugging tasks, and worked extra hours to test each fix quickly. By prioritizing the most critical issues and keeping communication open with the team and stakeholders, we were able to resolve the bug and still deliver the module on time.`,
  4: `I'm impressed by your company's reputation for innovation and its focus on delivering impactful solutions. I want to be part of a team where I can apply my skills, keep learning, and contribute to meaningful projects that make a real difference.`,
  5: `In five years, I see myself having grown into a more skilled and experienced software engineer, taking on greater responsibilities, leading projects, and contributing to innovative solutions within your company. I also aim to continue learning new technologies and strengthening my leadership and problem-solving skills.`,
  6: `In JavaScript, a closure is created when an inner function "remembers" and can access variables from its outer (enclosing) function even after that outer function has finished executing. This happens because functions in JavaScript form their own scope and carry a reference to the environment in which they were created. Closures are widely used to create private data, maintain state between function calls, and implement callbacks or event handlers.`,
  7: `SQL databases are relational, use structured schemas, and store data in tables with rows and columns. They are ideal for complex queries and transactions, ensuring data consistency (ACID properties). NoSQL databases are non-relational, schema-less, and store data in formats like documents, key-value pairs, or graphs. They are highly scalable and flexible, making them suitable for handling large volumes of unstructured or rapidly changing data.`,
  8: `In one project, I had a team member who often disagreed with others and resisted suggestions, which slowed progress. I decided to approach the situation calmly by actively listening to their concerns and finding common ground. By involving them in planning decisions and clearly communicating expectations, we were able to collaborate more effectively, complete the project on time, and even incorporate some of their valuable ideas.`,
  9: `If I disagreed with my manager, I would first try to understand their perspective fully. Then, I would present my points respectfully, supported with data or examples, and suggest possible alternatives. Ultimately, I would be open to feedback and follow the final decision, focusing on the success of the project and team.`
};

// ------------------------------------------------------
// Utility: Cosine similarity (semantic closeness) with better normalization
// ------------------------------------------------------
function cosineSimilarity(textA, textB) {
  // Create new TF-IDF instance for each calculation
  const tfidf = new TfIdf();
  
  // Add documents
  tfidf.addDocument(textA);
  tfidf.addDocument(textB);
  
  // Get terms for both documents
  const termsA = tfidf.listTerms(0);
  const termsB = tfidf.listTerms(1);
  
  // If either document has no terms, return 0
  if (termsA.length === 0 || termsB.length === 0) {
    return 0;
  }
  
  // Create vectors
  const vectorA = [];
  const vectorB = [];
  
  // Get all unique terms
  const allTerms = new Set([...termsA.map(t => t.term), ...termsB.map(t => t.term)]);
  
  // Build vectors
  allTerms.forEach(term => {
    const valA = tfidf.tfidf(term, 0) || 0;
    const valB = tfidf.tfidf(term, 1) || 0;
    vectorA.push(valA);
    vectorB.push(valB);
  });
  
  // Calculate dot product
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  
  // Calculate magnitudes
  const magA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
  
  // Return cosine similarity (0 if either magnitude is 0)
  return magA && magB ? dotProduct / (magA * magB) : 0;
}

// ------------------------------------------------------
// Utility: Calculate Relevance with stricter penalties
// ------------------------------------------------------
function calculateRelevance(userAnswer, expectedAnswer) {
  // Check for completely nonsensical answers
  const userWords = userAnswer.trim().split(/\s+/).filter(word => word.length > 0);
  
  // If less than 3 words or mostly non-alphabetic, it's nonsensical
  const isNonsensical = userWords.length < 3 || 
    userWords.every(word => !/[a-zA-Z]/.test(word)) ||
    (userWords.filter(word => !/[a-zA-Z]/.test(word)).length > userWords.length * 0.5);
  
  if (isNonsensical) {
    return 0; // Very low relevance for nonsensical answers
  }
  
  // Calculate cosine similarity
  const similarity = cosineSimilarity(userAnswer.toLowerCase(), expectedAnswer.toLowerCase());
  
  // Convert to 0-10 scale
  const scaledSimilarity = similarity * 10;
  
  // Apply stricter penalties for low similarity
  if (scaledSimilarity < 1) {
    return Math.max(0, scaledSimilarity); // Very low score for completely different answers
  } else if (scaledSimilarity < 3) {
    return scaledSimilarity; // Low score for somewhat related but incorrect answers
  } else {
    return scaledSimilarity; // Normal score for relevant answers
  }
}

// ------------------------------------------------------
// Utility: Calculate Confidence with content quality checks
// ------------------------------------------------------
function confidenceScore(answer) {
  const wordCount = answer.split(" ").length;
  
  // Penalize very short answers
  if (wordCount < 5) {
    return Math.min(wordCount, 2); // Max 2 points for very short answers
  }
  
  const lengthScore = Math.min(wordCount / 20, 10);
  const sentimentScore = Math.max(sentiment.analyze(answer).score + 5, 0);
  const structureScore = /because|for example|therefore|so that|in conclusion/i.test(answer) ? 1.5 : 0;
  return Math.min(lengthScore + sentimentScore / 2 + structureScore, 10);
}

// ------------------------------------------------------
// Utility: Calculate Clarity with content quality checks
// ------------------------------------------------------
function clarityScore(answer) {
  if (!answer || answer.trim().length < 5) return 1;
  
  // Check for nonsensical content
  const words = answer.trim().split(/\s+/);
  const nonsensicalWords = words.filter(word => word.length > 1 && !/[a-zA-Z]/.test(word));
  if (nonsensicalWords.length > words.length * 0.5) {
    return 1; // Very low clarity for mostly nonsensical content
  }
  
  const avgWordLength = answer.replace(/[^a-zA-Z ]/g, "").split(" ").reduce((a, b) => a + b.length, 0) / answer.split(" ").length;
  const punctuationBonus = (answer.match(/[.,!?]/g) || []).length > 2 ? 1 : 0;
  return Math.min((avgWordLength / 4) + punctuationBonus + 5, 10);
}

// ------------------------------------------------------
// Utility: Grade Mapping
// ------------------------------------------------------
function getGrade(score) {
  if (score >= 9) return "A+";
  if (score >= 8) return "A";
  if (score >= 7) return "B+";
  if (score >= 6) return "B";
  if (score >= 5) return "C";
  if (score >= 4) return "D";
  return "F";
}

// ------------------------------------------------------
// MAIN FUNCTION: scoreAnswer()
// ------------------------------------------------------
export function scoreAnswer(userAnswer, expectedAnswer) {
  // Handle case where expected answer might be missing
  if (!expectedAnswer || !userAnswer) {
    return {
      score: 0,
      grade: "F",
      feedback: "Invalid question or empty response."
    };
  }

  // Check for completely nonsensical answers
  const trimmedAnswer = userAnswer.trim();
  if (trimmedAnswer.length < 3 || /^[^a-zA-Z0-9\s]*$/.test(trimmedAnswer)) {
    return {
      score: 0,
      grade: "F",
      feedback: "Response is nonsensical or too short to evaluate."
    };
  }

  const relevance = calculateRelevance(userAnswer, expectedAnswer);
  const confidence = confidenceScore(userAnswer);
  const clarity = clarityScore(userAnswer);
  
  // If relevance is very low, cap the overall score
  let overall;
  if (relevance < 1) {
    // For completely wrong answers, limit score to a maximum of 2
    overall = Math.min(relevance * 2 + confidence * 0.1 + clarity * 0.1, 2);
  } else if (relevance < 3) {
    // For somewhat related but incorrect answers, limit score appropriately
    overall = Math.min(relevance * 2 + confidence * 0.2 + clarity * 0.2, 5);
  } else {
    // For relevant answers, use normal weighting
    overall = Math.min(relevance * 0.4 + confidence * 0.3 + clarity * 0.3, 10);
  }
  
  const grade = getGrade(overall);

  // Generate feedback based on what's wrong
  const feedback = [];
  if (overall < 2) {
    feedback.push("Your answer doesn't address the question. Please provide a relevant response.");
  } else if (overall < 4) {
    feedback.push("Your answer needs more alignment with the expected concept.");
  } else if (overall < 6) {
    feedback.push("Try expanding your response with more relevant details.");
  }
  
  if (confidence < 3 && overall > 2) feedback.push("Speak more confidently and elaborate your points.");
  if (clarity < 3 && overall > 2) feedback.push("Structure your sentences more clearly.");
  if (relevance < 2 && overall > 2) feedback.push("Your answer needs more alignment with the expected concept.");

  return {
    score: parseFloat(overall.toFixed(1)),
    confidence: parseFloat(confidence.toFixed(1)),
    clarity: parseFloat(clarity.toFixed(1)),
    relevance: parseFloat(relevance.toFixed(1)),
    grade,
    feedback: feedback.length ? feedback.join(" ") : "Excellent response! Well-articulated and relevant."
  };
}

// ------------------------------------------------------
// Manual Test Example (optional)
// ------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    scoreAnswer(
      2,
      "In JavaScript, let and const are block-scoped while var is function-scoped. const cannot be reassigned and let can be changed but not redeclared. var can be redeclared and has hoisting behavior."
    )
  );
}
