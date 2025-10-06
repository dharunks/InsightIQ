/**
 * Utility for scoring user answers against expected answers
 */

/**
 * Calculates a score by comparing a user's answer to the expected answer
 * @param {string} userAnswer - The answer provided by the user
 * @param {string} expectedAnswer - The expected answer from the question bank
 * @param {Object} options - Scoring options
 * @param {number} options.keywordWeight - Weight for keyword matching (default: 0.5)
 * @param {number} options.contentWeight - Weight for overall content similarity (default: 0.3)
 * @param {number} options.exactMatchWeight - Weight for exact match detection (default: 0.2)
 * @returns {Object} Score details including numerical score and feedback
 */
function scoreAnswer(userAnswer, expectedAnswer, options = {}) {
  // Default options
  const { 
    keywordWeight = 0.5, 
    contentWeight = 0.3,
    exactMatchWeight = 0.2,
    minScore = 0,
    maxScore = 10
  } = options;
  
  // If either answer is missing, return a zero score
  if (!userAnswer || !expectedAnswer) {
    return {
      score: minScore,
      feedback: "Unable to score: missing user answer or expected answer",
      keywordMatches: [],
      missingKeywords: [],
      grade: "F"
    };
  }

  // Normalize text for comparison (lowercase, remove extra spaces)
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  const normalizedExpectedAnswer = expectedAnswer.toLowerCase().trim();
  
  // Penalize very short answers (less than 15 characters)
  if (normalizedUserAnswer.length < 15) {
    return {
      score: 2.0, // Very low score for extremely short answers
      feedback: "Answer is too brief to properly address the question.",
      keywordMatches: [],
      missingKeywords: extractKeyPhrases(normalizedExpectedAnswer),
      grade: "F"
    };
  }
  
  // Penalize nonsensical answers (random characters, no real words)
  const realWordPattern = /\b[a-z]{3,}\b/g;
  const realWords = normalizedUserAnswer.match(realWordPattern) || [];
  if (realWords.length < 2) {
    return {
      score: 1.0, // Extremely low score for nonsensical answers
      feedback: "Answer appears to be nonsensical or random characters.",
      keywordMatches: [],
      missingKeywords: extractKeyPhrases(normalizedExpectedAnswer),
      grade: "F"
    };
  }
  
  // Check for exact or near-exact match
  const exactMatchScore = calculateExactMatchScore(normalizedUserAnswer, normalizedExpectedAnswer);
  
  // Extract key phrases/keywords from expected answer
  const keyPhrases = extractKeyPhrases(normalizedExpectedAnswer);
  
  // Calculate keyword match score
  const { matchedKeywords, missingKeywords, keywordScore } = calculateKeywordScore(
    normalizedUserAnswer, 
    keyPhrases
  );
  
  // Calculate content similarity score
  const contentScore = calculateContentSimilarity(
    normalizedUserAnswer, 
    normalizedExpectedAnswer
  );
  
  // Calculate weighted final score
  let finalScore = (keywordScore * keywordWeight) + 
                   (contentScore * contentWeight) + 
                   (exactMatchScore * exactMatchWeight);
  
  // Scale to desired range
  finalScore = Math.min(maxScore, Math.max(minScore, finalScore * maxScore));
  
  // If the answers are very similar, ensure a high score
  if (exactMatchScore > 0.9) {
    finalScore = Math.max(finalScore, 9.5);
  }
  
  // Generate grade based on score
  const grade = scoreToGrade(finalScore);
  
  // Generate feedback based on the score
  const feedback = generateFeedback(finalScore, matchedKeywords, missingKeywords);
  
  return {
    score: parseFloat(finalScore.toFixed(1)),
    keywordScore: parseFloat(keywordScore.toFixed(2)),
    contentScore: parseFloat(contentScore.toFixed(2)),
    exactMatchScore: parseFloat(exactMatchScore.toFixed(2)),
    feedback,
    keywordMatches: matchedKeywords,
    missingKeywords,
    grade
  };
}

/**
 * Calculates how closely the user answer matches the expected answer
 * @param {string} userAnswer - Normalized user answer
 * @param {string} expectedAnswer - Normalized expected answer
 * @returns {number} Exact match score (0-1)
 */
function calculateExactMatchScore(userAnswer, expectedAnswer) {
  // If they're identical, return perfect score
  if (userAnswer === expectedAnswer) {
    return 1.0;
  }
  
  // Check if one is a substring of the other
  if (userAnswer.includes(expectedAnswer) || expectedAnswer.includes(userAnswer)) {
    const lengthRatio = Math.min(userAnswer.length, expectedAnswer.length) / 
                        Math.max(userAnswer.length, expectedAnswer.length);
    return 0.8 + (0.2 * lengthRatio);
  }
  
  // Calculate string similarity using Levenshtein distance
  const distance = levenshteinDistance(userAnswer, expectedAnswer);
  const maxLength = Math.max(userAnswer.length, expectedAnswer.length);
  const similarity = 1 - (distance / maxLength);
  
  return similarity;
}

/**
 * Calculates Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substitution
          matrix[i][j-1] + 1,   // insertion
          matrix[i-1][j] + 1    // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Converts a numerical score to a letter grade
 * @param {number} score - Numerical score (0-10)
 * @returns {string} Letter grade
 */
function scoreToGrade(score) {
  if (score >= 9.5) return "A+";
  if (score >= 9.0) return "A";
  if (score >= 8.5) return "A-";
  if (score >= 8.0) return "B+";
  if (score >= 7.5) return "B";
  if (score >= 7.0) return "B-";
  if (score >= 6.5) return "C+";
  if (score >= 6.0) return "C";
  if (score >= 5.5) return "C-";
  if (score >= 5.0) return "D+";
  if (score >= 4.0) return "D";
  return "F";
}

/**
 * Extracts key phrases from the expected answer
 * @param {string} expectedAnswer - The normalized expected answer
 * @returns {string[]} Array of key phrases
 */
function extractKeyPhrases(expectedAnswer) {
  // Split by common separators and filter out short or common words
  const phrases = expectedAnswer.split(/[.,;:!?]/)
    .map(phrase => phrase.trim())
    .filter(phrase => phrase.length > 0);
  
  // Extract important words and phrases
  const keyPhrases = [];
  const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'about'];
  
  // Process each phrase to extract keywords
  phrases.forEach(phrase => {
    const words = phrase.split(' ');
    
    // Add multi-word phrases (2-3 words)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && !commonWords.includes(words[i])) {
        if (i < words.length - 1 && words[i+1].length > 3) {
          keyPhrases.push(`${words[i]} ${words[i+1]}`);
        }
        if (i < words.length - 2 && words[i+2].length > 3) {
          keyPhrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
        }
      }
    }
    
    // Add individual important words
    words.forEach(word => {
      if (word.length > 4 && !commonWords.includes(word)) {
        keyPhrases.push(word);
      }
    });
  });
  
  // Remove duplicates and return
  return [...new Set(keyPhrases)];
}

/**
 * Calculates keyword matching score
 * @param {string} userAnswer - Normalized user answer
 * @param {string[]} keyPhrases - Key phrases from expected answer
 * @returns {Object} Keyword matching details and score
 */
function calculateKeywordScore(userAnswer, keyPhrases) {
  const matchedKeywords = [];
  const missingKeywords = [];
  
  // Check each key phrase
  keyPhrases.forEach(phrase => {
    if (userAnswer.includes(phrase)) {
      matchedKeywords.push(phrase);
    } else {
      missingKeywords.push(phrase);
    }
  });
  
  // Calculate score based on percentage of matched keywords
  const keywordScore = keyPhrases.length > 0 
    ? matchedKeywords.length / keyPhrases.length 
    : 0;
  
  return { matchedKeywords, missingKeywords, keywordScore };
}

/**
 * Calculates overall content similarity
 * @param {string} userAnswer - Normalized user answer
 * @param {string} expectedAnswer - Normalized expected answer
 * @returns {number} Similarity score (0-1)
 */
function calculateContentSimilarity(userAnswer, expectedAnswer) {
  // Simple implementation using word overlap
  // Could be enhanced with more sophisticated NLP techniques
  
  const userWords = new Set(userAnswer.split(/\s+/).filter(word => word.length > 3));
  const expectedWords = new Set(expectedAnswer.split(/\s+/).filter(word => word.length > 3));
  
  // Count overlapping words
  let overlapCount = 0;
  userWords.forEach(word => {
    if (expectedWords.has(word)) {
      overlapCount++;
    }
  });
  
  // Calculate Jaccard similarity
  const totalUniqueWords = new Set([...userWords, ...expectedWords]).size;
  return totalUniqueWords > 0 ? overlapCount / totalUniqueWords : 0;
}

/**
 * Generates feedback based on the score
 * @param {number} score - The calculated score
 * @param {string[]} matchedKeywords - Keywords that were matched
 * @param {string[]} missingKeywords - Keywords that were missing
 * @returns {string} Feedback message
 */
function generateFeedback(score, matchedKeywords, missingKeywords) {
  // Generate appropriate feedback based on score
  if (score >= 9) {
    return "Excellent answer that covers all key points.";
  } else if (score >= 7) {
    return "Good answer that covers most key points.";
  } else if (score >= 5) {
    return "Adequate answer but missing some important points.";
  } else if (score >= 3) {
    return "Answer needs improvement and is missing several key points.";
  } else {
    return "Answer does not address the expected points.";
  }
}

module.exports = {
  scoreAnswer
};