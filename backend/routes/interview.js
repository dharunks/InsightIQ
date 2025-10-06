const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Interview = require('../models/Interview');
const QuestionBank = require('../models/QuestionBank');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const sentimentAnalyzer = require('../utils/sentimentAnalysis');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', req.user._id.toString());
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept audio and video files
  const allowedTypes = /webm|mp4|avi|mov|wav|mp3|ogg|m4a/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /audio|video/.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio and video files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: fileFilter
});

// @route   GET /api/interviews
// @desc    Get user's interviews with pagination
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const type = req.query.type;

    // Build filter
    const filter = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-questions.response.audioUrl -questions.response.videoUrl'); // Exclude large files from list

    const total = await Interview.countDocuments(filter);

    res.json({
      interviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch interviews'
    });
  }
});

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, type, difficulty, questionCount = 5 } = req.body;

    // Validation
    if (!title || !type || !difficulty) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Title, type, and difficulty are required'
      });
    }

    // Get random questions from question bank
    const questions = await QuestionBank.aggregate([
      { 
        $match: { 
          category: type, 
          difficulty: difficulty,
          isActive: true 
        } 
      },
      { $sample: { size: Math.min(questionCount, 20) } } // Max 20 questions
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        error: 'No questions found',
        message: `No questions available for ${type} interviews at ${difficulty} level`
      });
    }

    // Format questions for interview
    const formattedQuestions = questions.map((q, index) => ({
      id: `q${index + 1}`,
      text: q.question,
      category: q.subcategory,
      expectedTime: q.timeLimit || 120
    }));

    // Create interview
    const interview = new Interview({
      user: userId,
      title,
      type,
      difficulty,
      questions: formattedQuestions,
      status: 'draft'
    });

    await interview.save();

    res.status(201).json({
      message: 'Interview created successfully',
      interview: {
        id: interview._id,
        title: interview.title,
        type: interview.type,
        difficulty: interview.difficulty,
        status: interview.status,
        questionCount: interview.questions.length,
        createdAt: interview.createdAt
      }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create interview'
    });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get specific interview details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const interviewId = req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'Interview not found or access denied'
      });
    }

    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch interview'
    });
  }
});

// @route   PUT /api/interviews/:id/start
// @desc    Start an interview
// @access  Private
router.put('/:id/start', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const interviewId = req.params.id;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'Interview not found or access denied'
      });
    }

    if (interview.status !== 'draft' && interview.status !== 'paused') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Interview can only be started from draft or paused status'
      });
    }

    interview.status = 'in-progress';
    if (!interview.startedAt) {
      interview.startedAt = new Date();
    }

    await interview.save();

    res.json({
      message: 'Interview started successfully',
      interview: {
        id: interview._id,
        status: interview.status,
        startedAt: interview.startedAt,
        questions: interview.questions.map(q => ({
          id: q.id,
          text: q.text,
          category: q.category,
          expectedTime: q.expectedTime
        }))
      }
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to start interview'
    });
  }
});

// @route   PUT /api/interviews/:id/questions/:questionId/response
// @desc    Submit response for a question (with optional media)
// @access  Private
router.put('/:id/questions/:questionId/response', 
  authMiddleware, 
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { id: interviewId, questionId } = req.params;
      const { text, duration } = req.body;

      console.log('Request validation:', {
        hasText: !!text,
        textLength: text?.length || 0,
        textTrimmed: text?.trim?.() || '',
        hasFiles: !!req.files,
        fileKeys: req.files ? Object.keys(req.files) : [],
        duration
      });

      // Check if we have either text content or media files
      const hasTextContent = text && text.trim().length > 0;
      const hasMediaFiles = req.files && (req.files.audio?.length > 0 || req.files.video?.length > 0);
      
      if (!hasTextContent && !hasMediaFiles) {
        console.log('Validation failed: no text content or media files');
        return res.status(400).json({
          error: 'Validation error',
          message: 'Either text response or media file is required'
        });
      }

      console.log('Validation passed:', { hasTextContent, hasMediaFiles });

      const interview = await Interview.findOne({
        _id: interviewId,
        user: userId
      });

      if (!interview) {
        return res.status(404).json({
          error: 'Interview not found',
          message: 'Interview not found or access denied'
        });
      }

      if (interview.status !== 'in-progress') {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Interview must be in progress to submit responses'
        });
      }

      // Find the question
      const questionIndex = interview.questions.findIndex(q => q.id === questionId);
      
      if (questionIndex === -1) {
        return res.status(404).json({
          error: 'Question not found',
          message: 'Question not found in this interview'
        });
      }

      // Handle media files
      let audioFile = null;
      let videoFile = null;
      let mediaType = null;

      console.log('Files received:', req.files);
      console.log('Request body:', { text, duration });

      if (req.files) {
        if (req.files.audio && req.files.audio[0]) {
          audioFile = req.files.audio[0].path;
          mediaType = 'audio';
          console.log('Audio file uploaded:', audioFile);
        }
        if (req.files.video && req.files.video[0]) {
          videoFile = req.files.video[0].path;
          mediaType = 'video';
          console.log('Video file uploaded:', videoFile);
        }
      }

      // Analyze the response (text + multimedia)
      console.log('Analyzing multimedia response:', { text, mediaType, audioFile, videoFile });
      
      let analysis;
      try {
        if (mediaType && (audioFile || videoFile)) {
          const mediaPath = videoFile || audioFile;
          console.log('Attempting multimedia analysis for:', mediaPath);
          analysis = await sentimentAnalyzer.analyzeMultimediaResponse(text || '', mediaPath, mediaType);
        } else {
          console.log('Performing text-only analysis');
          analysis = sentimentAnalyzer.analyzeText(text || '');
        }
        console.log('Analysis completed successfully');
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        // Fallback to text analysis if multimedia analysis fails
        console.log('Falling back to text-only analysis');
        analysis = sentimentAnalyzer.analyzeText(text || '');
      }

      // Update question with response and analysis
      const responseData = {
        text: text || '',
        duration: duration || 0,
        submittedAt: new Date()
      };

      // Store media file paths
      if (audioFile) {
        const relativePath = path.relative(path.join(__dirname, '../uploads'), audioFile);
        responseData.audioUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        console.log('Audio file stored at:', responseData.audioUrl);
      }
      if (videoFile) {
        const relativePath = path.relative(path.join(__dirname, '../uploads'), videoFile);
        responseData.videoUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        console.log('Video file stored at:', responseData.videoUrl);
      }

      interview.questions[questionIndex].response = responseData;
      interview.questions[questionIndex].analysis = analysis;

      // Add some strengths based on analysis
      const strengths = [];
      
      // Score the answer against expected answer if available
      const { scoreAnswer } = require('../utils/answerScoring');
      const questionData = interview.questions[questionIndex].questionData;
      
      if (questionData && questionData.expectedAnswer && responseData.text) {
        const scoringResult = scoreAnswer(responseData.text, questionData.expectedAnswer);
        
        // Add scoring results to the analysis
        interview.questions[questionIndex].analysis.answerScore = {
          score: scoringResult.score,
          grade: scoringResult.grade || 'C', // Use the grade from scoring system
          feedback: scoringResult.feedback,
          keywordMatches: scoringResult.keywordMatches,
          missingKeywords: scoringResult.missingKeywords
        };
        
        // Add answer quality to strengths or areas for improvement
        if (scoringResult.score >= 7) {
          strengths.push('Strong answer content');
        }
        
        // Add grade-based strengths
        if (scoringResult.grade && ['A+', 'A', 'A-', 'B+'].includes(scoringResult.grade)) {
          strengths.push('Excellent answer quality');
        }
      }
      if (analysis.confidence.score >= 7) strengths.push('Confident delivery');
      if (analysis.communication.clarity >= 7) strengths.push('Clear communication');
      if (analysis.sentiment && analysis.sentiment.positivity > 0.6) strengths.push('Positive attitude');
      if (analysis.communication.wordCount > 50) strengths.push('Detailed response');
      
      // Add multimedia-specific strengths
      if (analysis.nonVerbal) {
        if (analysis.nonVerbal.eyeContact.score >= 8) strengths.push('Excellent eye contact');
        if (analysis.nonVerbal.posture.score >= 8) strengths.push('Professional posture');
        if (analysis.nonVerbal.overallPresence >= 8) strengths.push('Strong screen presence');
      }
      
      if (analysis.communication.wordsPerMinute && 
          analysis.communication.wordsPerMinute >= 120 && 
          analysis.communication.wordsPerMinute <= 150) {
        strengths.push('Optimal speaking pace');
      }

      interview.questions[questionIndex].analysis.strengths = strengths;

      await interview.save();

      res.json({
        message: 'Response submitted and analyzed successfully',
        analysis: interview.questions[questionIndex].analysis,
        question: {
          id: questionId,
          hasResponse: true,
          hasMedia: !!(audioFile || videoFile),
          mediaType: mediaType,
          submittedAt: interview.questions[questionIndex].response.submittedAt
        }
      });
    } catch (error) {
      console.error('Submit response error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        const filesToCleanup = [];
        if (req.files.audio) filesToCleanup.push(...req.files.audio.map(f => f.path));
        if (req.files.video) filesToCleanup.push(...req.files.video.map(f => f.path));
        
        for (const filePath of filesToCleanup) {
          try {
            await fs.unlink(filePath);
          } catch (cleanupError) {
            console.warn('Failed to cleanup file:', filePath, cleanupError.message);
          }
        }
      }
      
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to submit response'
      });
    }
  }
);

// @route   PUT /api/interviews/:id/complete
// @desc    Complete an interview
// @access  Private
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const interviewId = req.params.id;

    console.log('=== INTERVIEW COMPLETION REQUEST ===');
    console.log('User ID:', userId);
    console.log('Interview ID:', interviewId);

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId
    });

    if (!interview) {
      console.log('ERROR: Interview not found');
      return res.status(404).json({
        error: 'Interview not found',
        message: 'Interview not found or access denied'
      });
    }

    console.log('Current interview status:', interview.status);
    console.log('Interview questions count:', interview.questions.length);
    console.log('Questions with responses:', interview.questions.filter(q => q.response).length);

    // Allow completion from 'draft', 'in-progress' and 'completed' status
    // This handles edge cases where the interview might be stuck in draft
    if (interview.status !== 'in-progress' && interview.status !== 'completed' && interview.status !== 'draft') {
      console.log('ERROR: Invalid status for completion:', interview.status);
      return res.status(400).json({
        error: 'Invalid status',
        message: `Interview cannot be completed from status: ${interview.status}. Valid statuses: draft, in-progress, completed`
      });
    }

    // If already completed, just return the existing data
    if (interview.status === 'completed') {
      console.log('Interview already completed, returning existing data');
      return res.json({
        message: 'Interview already completed',
        interview: {
          id: interview._id,
          status: interview.status,
          completedAt: interview.completedAt,
          duration: interview.duration,
          overallAnalysis: interview.overallAnalysis,
          feedback: interview.feedback
        }
      });
    }

    console.log('Proceeding with interview completion...');
    
    // Ensure the interview is marked as started if it wasn't already
    if (!interview.startedAt) {
      console.log('Interview was never started, setting start time to now');
      interview.startedAt = new Date();
    }
    
    // Mark as completed
    interview.status = 'completed';
    interview.completedAt = new Date();
    
    if (interview.startedAt) {
      interview.duration = Math.floor((interview.completedAt - interview.startedAt) / 1000);
    }

    // Generate AI feedback
    const answeredQuestions = interview.questions.filter(q => q.response && (q.response.text || q.response.audioUrl || q.response.videoUrl));
    
    console.log(`Interview completion: ${answeredQuestions.length} answered questions out of ${interview.questions.length} total`);
    
    if (answeredQuestions.length > 0) {
      const avgConfidence = answeredQuestions.reduce((sum, q) => 
        sum + (q.analysis?.confidence?.score || 0), 0) / answeredQuestions.length;
      
      const avgClarity = answeredQuestions.reduce((sum, q) => 
        sum + (q.analysis?.communication?.clarity || 0), 0) / answeredQuestions.length;
        
      // Calculate average answer score if available
      const questionsWithScores = answeredQuestions.filter(q => q.analysis?.answerScore?.score);
      const avgAnswerScore = questionsWithScores.length > 0
        ? questionsWithScores.reduce((sum, q) => sum + q.analysis.answerScore.score, 0) / questionsWithScores.length
        : null;
        
      // Calculate overall grade based on answer scores
      let overallGrade = 'C';
      if (questionsWithScores.length > 0) {
        // Count grades by frequency
        const gradeCount = {};
        questionsWithScores.forEach(q => {
          const grade = q.analysis?.answerScore?.grade || 'C';
          gradeCount[grade] = (gradeCount[grade] || 0) + 1;
        });
        
        // Find the most frequent grade
        let maxCount = 0;
        Object.entries(gradeCount).forEach(([grade, count]) => {
          if (count > maxCount) {
            maxCount = count;
            overallGrade = grade;
          }
        });
        
        // If average score is very high, ensure grade is at least A-
        if (avgAnswerScore >= 9) {
          overallGrade = overallGrade < 'A-' ? 'A-' : overallGrade;
        }
      }
      
      // Calculate total word count properly from all responses
      const totalWordCount = answeredQuestions.reduce((sum, q) => {
        let wordCount = 0;
        
        // Get word count from analysis (which should include transcribed text)
        if (q.analysis?.communication?.wordCount) {
          wordCount = q.analysis.communication.wordCount;
        } 
        // Fallback to text response word count
        else if (q.response?.text) {
          wordCount = q.response.text.trim().split(/\s+/).filter(word => word.length > 0).length;
        }
        
        return sum + wordCount;
      }, 0);

      const totalFillerWords = answeredQuestions.reduce((sum, q) => 
        sum + (q.analysis?.communication?.fillerWords || 0), 0);

      // Check for multimedia responses
      const multimediaQuestions = answeredQuestions.filter(q => 
        q.analysis?.nonVerbal || q.analysis?.mediaAnalysis
      );
      
      const hasMultimedia = multimediaQuestions.length > 0;
      const avgPresence = hasMultimedia 
        ? multimediaQuestions.reduce((sum, q) => 
            sum + (q.analysis.nonVerbal?.overallPresence || 0), 0) / multimediaQuestions.length
        : 0;
        
      // Generate overall analysis
      interview.overallAnalysis = {
        confidence: avgConfidence,
        clarity: avgClarity,
        answerScore: avgAnswerScore,
        grade: overallGrade,
        totalWordCount,
        totalFillerWords,
        answeredQuestions: answeredQuestions.length,
        totalQuestions: interview.questions.length,
        completionRate: (answeredQuestions.length / interview.questions.length) * 100,
        duration: interview.duration || 0
      };

      // Generate enhanced feedback summary
      let summary = `You completed ${answeredQuestions.length} questions with an average confidence score of ${avgConfidence.toFixed(1)}/10 and clarity score of ${avgClarity.toFixed(1)}/10.`;
      
      // Include answer quality score if available
      if (avgAnswerScore !== null) {
        summary += ` Your answer content received an average score of ${avgAnswerScore.toFixed(1)}/10 (Grade: ${overallGrade}) based on expected answers.`;
      }
      
      if (totalWordCount > 0) {
        summary += ` You provided a total of ${totalWordCount} words across all responses.`;
      }
      
      if (hasMultimedia) {
        summary += ` Your multimedia responses showed an average presence score of ${avgPresence.toFixed(1)}/10.`;
      }
      
      const recommendations = [];
      const nextSteps = [];

      // Enhanced recommendations based on multimedia analysis
      if (avgConfidence < 7) {
        recommendations.push('Practice speaking with more conviction about your achievements');
        nextSteps.push('Record yourself answering common interview questions');
      }

      if (avgClarity < 7) {
        recommendations.push('Work on structuring your answers more clearly using the STAR method');
        nextSteps.push('Practice organizing your thoughts before speaking');
      }

      // Add recommendations based on answer content score
      if (avgAnswerScore !== null && avgAnswerScore < 7) {
        recommendations.push('Focus on addressing key points expected in your answers');
        nextSteps.push('Review common questions and prepare comprehensive answers');
      }

      if (totalFillerWords > answeredQuestions.length * 3) {
        recommendations.push('Reduce filler words by taking brief pauses to collect your thoughts');
        nextSteps.push('Practice mindful speaking exercises');
      }
      
      if (totalWordCount > 0 && totalWordCount / answeredQuestions.length < 30) {
        recommendations.push('Try to provide more detailed responses with specific examples');
        nextSteps.push('Practice elaborating on your experiences with concrete details');
      }

      if (hasMultimedia) {
        if (avgPresence < 7) {
          recommendations.push('Improve your screen presence by maintaining eye contact and good posture');
          nextSteps.push('Practice video recording to become more comfortable on camera');
        }
        
        const videoQuestions = multimediaQuestions.filter(q => q.analysis.nonVerbal);
        if (videoQuestions.length > 0) {
          const avgEyeContact = videoQuestions.reduce((sum, q) => 
            sum + (q.analysis.nonVerbal.eyeContact?.score || 0), 0) / videoQuestions.length;
          const avgPosture = videoQuestions.reduce((sum, q) => 
            sum + (q.analysis.nonVerbal.posture?.score || 0), 0) / videoQuestions.length;
          
          if (avgEyeContact < 7) {
            recommendations.push('Maintain better eye contact by looking directly at the camera');
          }
          if (avgPosture < 7) {
            recommendations.push('Improve your posture - sit up straight and keep shoulders back');
          }
        }
      }

      if (avgConfidence >= 8 && avgClarity >= 8 && (!hasMultimedia || avgPresence >= 8)) {
        recommendations.push('Excellent communication skills! Continue practicing to maintain this level');
        nextSteps.push('Consider practicing more challenging interview scenarios');
      }

      // Generate comprehensive feedback using the enhanced analyzer
      // Temporarily disabled due to null reference issues
      let comprehensiveFeedback;
      try {
        comprehensiveFeedback = sentimentAnalyzer.generateComprehensiveFeedback(
          { confidence: { score: avgConfidence }, communication: { clarity: avgClarity } },
          hasMultimedia ? { nonVerbal: { overallPresence: avgPresence } } : null
        );
      } catch (feedbackError) {
        console.warn('Comprehensive feedback generation failed:', feedbackError.message);
        comprehensiveFeedback = {
          summary: `Interview completed with ${answeredQuestions.length} questions answered.`,
          strengths: ['Completed the interview'],
          improvements: ['Continue practicing'],
          scores: {
            confidence: avgConfidence,
            clarity: avgClarity
          }
        };
      }

      interview.feedback = {
        ai: {
          summary,
          recommendations,
          nextSteps,
          comprehensiveAnalysis: comprehensiveFeedback
        }
      };
    }

    await interview.save();

    // Update user stats
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.totalInterviews': 1 },
        $set: {
          'stats.averageConfidence': await calculateUserAverageConfidence(userId),
          'stats.averageClarity': await calculateUserAverageClarity(userId)
        }
      });
      console.log('User stats updated successfully');
    } catch (statsError) {
      console.warn('Failed to update user stats:', statsError.message);
      // Don't fail the interview completion if stats update fails
    }

    console.log('Interview completed successfully:', {
      id: interview._id,
      status: interview.status,
      duration: interview.duration,
      answeredQuestions: answeredQuestions.length
    });

    res.json({
      message: 'Interview completed successfully',
      interview: {
        id: interview._id,
        status: interview.status,
        completedAt: interview.completedAt,
        duration: interview.duration,
        overallAnalysis: interview.overallAnalysis,
        feedback: interview.feedback
      }
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to complete interview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to calculate user average confidence
async function calculateUserAverageConfidence(userId) {
  const interviews = await Interview.find({
    user: userId,
    status: 'completed'
  });

  if (interviews.length === 0) return 0;

  const totalConfidence = interviews.reduce((sum, interview) => {
    return sum + (interview.overallAnalysis?.averageConfidence || 0);
  }, 0);

  return totalConfidence / interviews.length;
}

// Helper function to calculate user average clarity
async function calculateUserAverageClarity(userId) {
  const interviews = await Interview.find({
    user: userId,
    status: 'completed'
  });

  if (interviews.length === 0) return 0;

  const totalClarity = interviews.reduce((sum, interview) => {
    return sum + (interview.overallAnalysis?.averageClarity || 0);
  }, 0);

  return totalClarity / interviews.length;
}

// @route   DELETE /api/interviews/:id
// @desc    Delete an interview
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const interviewId = req.params.id;

    const interview = await Interview.findOneAndDelete({
      _id: interviewId,
      user: userId
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'Interview not found or access denied'
      });
    }

    res.json({
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete interview'
    });
  }
});

// @route   GET /api/interviews/media/:userId/:filename
// @desc    Serve uploaded media files
// @access  Private
router.get('/media/:userId/:filename', authMiddleware, async (req, res) => {
  try {
    const { userId, filename } = req.params;
    const requestingUserId = req.user._id.toString();
    
    // Only allow users to access their own media files
    if (userId !== requestingUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own media files'
      });
    }
    
    const filePath = path.join(__dirname, '../uploads', userId, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested media file was not found'
      });
    }
    
    // Set appropriate headers based on file type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
      contentType = `video/${ext.slice(1)}`;
    } else if (['.wav', '.mp3', '.ogg', '.m4a'].includes(ext)) {
      contentType = `audio/${ext.slice(1)}`;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Stream the file
    const readStream = require('fs').createReadStream(filePath);
    readStream.pipe(res);
    
  } catch (error) {
    console.error('Serve media error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to serve media file'
    });
  }
});

module.exports = router;

// Cleanup function to remove old media files
const cleanupOldMediaFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const userDirs = await fs.readdir(uploadsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const userDir of userDirs) {
      const userPath = path.join(uploadsDir, userDir);
      const stat = await fs.stat(userPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(userPath);
        
        for (const file of files) {
          const filePath = path.join(userPath, file);
          const fileStat = await fs.stat(filePath);
          
          if (now - fileStat.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old media file: ${filePath}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during media cleanup:', error);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupOldMediaFiles, 24 * 60 * 60 * 1000);