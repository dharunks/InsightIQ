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
const tfidf = new TfIdf();

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
// Utility: Cosine similarity (semantic closeness)
// ------------------------------------------------------
function cosineSimilarity(textA, textB) {
  tfidf.addDocument(textA);
  tfidf.addDocument(textB);
  const vectorA = [];
  const vectorB = [];
  tfidf.listTerms(0).forEach(item => {
    const term = item.term;
    const valA = tfidf.tfidf(term, 0);
    const valB = tfidf.tfidf(term, 1);
    vectorA.push(valA);
    vectorB.push(valB);
  });

  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  const magA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
  return magA && magB ? dotProduct / (magA * magB) : 0;
}

// ------------------------------------------------------
// Utility: Calculate Confidence
// ------------------------------------------------------
function confidenceScore(answer) {
  const wordCount = answer.split(" ").length;
  const lengthScore = Math.min(wordCount / 20, 10);
  const sentimentScore = Math.max(sentiment.analyze(answer).score + 5, 0);
  const structureScore = /because|for example|therefore|so that|in conclusion/i.test(answer) ? 1.5 : 0;
  return Math.min(lengthScore + sentimentScore / 2 + structureScore, 10);
}

// ------------------------------------------------------
// Utility: Calculate Clarity
// ------------------------------------------------------
function clarityScore(answer) {
  if (!answer || answer.trim().length < 5) return 1;
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
export function scoreAnswer(questionId, answer) {
  const expected = expectedAnswers[questionId];
  if (!expected || !answer) {
    return {
      overall: 0,
      confidence: 1,
      clarity: 1,
      relevance: 0,
      grade: "F",
      feedback: "Invalid question or empty response."
    };
  }

  const relevance = cosineSimilarity(answer.toLowerCase(), expected.toLowerCase()) * 10;
  const confidence = confidenceScore(answer);
  const clarity = clarityScore(answer);
  const overall = Math.min(relevance * 0.4 + confidence * 0.3 + clarity * 0.3, 10);
  const grade = getGrade(overall);

  // Generate feedback dynamically
  const feedback = [];
  if (overall < 5) feedback.push("Try expanding your response with examples or context.");
  if (confidence < 6) feedback.push("Speak more confidently and elaborate your points.");
  if (clarity < 6) feedback.push("Structure your sentences more clearly.");
  if (relevance < 6) feedback.push("Your answer needs more alignment with the expected concept.");

  return {
    questionId,
    overall: parseFloat(overall.toFixed(1)),
    confidence: parseFloat(confidence.toFixed(1)),
    clarity: parseFloat(clarity.toFixed(1)),
    relevance: parseFloat(relevance.toFixed(1)),
    grade,
    feedback: feedback.length ? feedback : ["Excellent response! Well-articulated and relevant."]
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
