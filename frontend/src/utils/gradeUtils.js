/**
 * Shared utility for consistent grade calculation across frontend and backend
 */

/**
 * Converts a numerical score to a letter grade
 * @param {number} score - Numerical score (0-10)
 * @returns {string} Letter grade
 */
export function scoreToGrade(score) {
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
 * Converts a letter grade to a numerical value for averaging
 * @param {string} grade - Letter grade
 * @returns {number} Numerical value
 */
export function gradeToNumeric(grade) {
  switch (grade) {
    case "A+": return 9.75;
    case "A": return 9.25;
    case "A-": return 8.75;
    case "B+": return 8.25;
    case "B": return 7.75;
    case "B-": return 7.25;
    case "C+": return 6.75;
    case "C": return 6.25;
    case "C-": return 5.75;
    case "D+": return 5.25;
    case "D": return 4.5;
    case "F": return 2.0;
    default: return 5.0; // Default to C grade
  }
}

/**
 * Calculates overall grade from individual question grades
 * @param {Array} questionGrades - Array of individual question grades
 * @returns {string} Overall letter grade
 */
export function calculateOverallGrade(questionGrades) {
  if (!questionGrades || questionGrades.length === 0) {
    return "C"; // Default grade
  }
  
  // Special handling for all F grades (nonsensical answers)
  const allFGrades = questionGrades.every(grade => grade === "F");
  if (allFGrades && questionGrades.length > 0) {
    return "F";
  }
  
  // Calculate average numerical value of grades
  const numericSum = questionGrades.reduce((sum, grade) => sum + gradeToNumeric(grade), 0);
  const averageScore = numericSum / questionGrades.length;
  
  // Convert back to letter grade
  return scoreToGrade(averageScore);
}

/**
 * Calculates overall grade from individual question scores
 * @param {Array} questionScores - Array of individual question scores with grade property
 * @returns {string} Overall letter grade
 */
export function calculateOverallGradeFromScores(questionScores) {
  if (!questionScores || questionScores.length === 0) {
    return "C"; // Default grade
  }
  
  // Extract grades
  const grades = questionScores.map(q => q.grade || "C");
  
  return calculateOverallGrade(grades);
}

/**
 * Gets performance grade using the same logic as backend
 * @param {number} confidence - Confidence score
 * @param {number} clarity - Clarity score
 * @param {number} answerScore - Answer quality score
 * @returns {Object} Grade object with grade, color, and background
 */
export function getPerformanceGrade(confidence, clarity, answerScore) {
  // Use answer score as primary factor for overall grade if available
  if (answerScore && answerScore > 0) {
    const grade = scoreToGrade(parseFloat(answerScore));
    return getGradeStyle(grade);
  }
  
  // Fallback to previous method if no answer score
  const average = (parseFloat(confidence) + parseFloat(clarity)) / 2;
  const grade = scoreToGrade(average);
  return getGradeStyle(grade);
}

/**
 * Gets styling for a grade
 * @param {string} grade - Letter grade
 * @returns {Object} Style object
 */
function getGradeStyle(grade) {
  switch (grade) {
    case 'A+':
    case 'A':
    case 'A-':
      return { grade, color: 'text-green-600', bg: 'bg-green-100' };
    case 'B+':
    case 'B':
    case 'B-':
      return { grade, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'C+':
    case 'C':
    case 'C-':
      return { grade, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    case 'D+':
    case 'D':
      return { grade, color: 'text-orange-600', bg: 'bg-orange-100' };
    default: // F grade
      return { grade, color: 'text-red-600', bg: 'bg-red-100' };
  }
}