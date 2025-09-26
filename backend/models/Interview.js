const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'hr', 'situational'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  questions: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    category: String,
    expectedTime: Number, // in seconds
    response: {
      text: String,
      audioUrl: String,
      videoUrl: String,
      duration: Number, // in seconds
      submittedAt: Date
    },
    analysis: {
      sentiment: {
        overall: Number, // -1 to 1
        confidence: Number, // 0 to 1
        positivity: Number, // 0 to 1
        negativity: Number, // 0 to 1
        neutrality: Number // 0 to 1
      },
      communication: {
        clarity: Number, // 0 to 10
        fluency: Number, // 0 to 10
        pace: String, // 'slow', 'normal', 'fast'
        fillerWords: Number,
        wordCount: Number,
        wordsPerMinute: Number // For audio/video analysis
      },
      confidence: {
        score: Number, // 0 to 10
        indicators: [String],
        improvements: [String]
      },
      // Multimedia-specific analysis
      nonVerbal: {
        eyeContact: {
          score: Number, // 0 to 10
          feedback: String
        },
        posture: {
          score: Number, // 0 to 10
          feedback: String
        },
        overallPresence: Number, // 0 to 10
        videoQuality: Number // 0 to 10
      },
      mediaAnalysis: {
        type: String, // 'audio' or 'video'
        duration: Number,
        fileSize: Number,
        quality: Number, // 0 to 10
        communicationScore: Number // 0 to 10
      },
      overallScore: Number, // 0 to 10 comprehensive score
      keywords: [String],
      suggestedImprovements: [String],
      strengths: [String]
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'paused'],
    default: 'draft'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  overallAnalysis: {
    averageConfidence: Number,
    averageClarity: Number,
    averagePresence: Number, // Non-verbal presence score
    communicationScore: Number,
    sentimentScore: Number,
    multimediaScore: Number, // Score for audio/video quality
    overallScore: Number, // Comprehensive score including multimedia
    strengths: [String],
    improvements: [String],
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    },
    breakdown: {
      textAnalysis: Number, // 0-10
      audioQuality: Number, // 0-10 (if audio)
      videoPresence: Number, // 0-10 (if video)
      overallPerformance: Number // 0-10
    }
  },
  feedback: {
    ai: {
      summary: String,
      recommendations: [String],
      nextSteps: [String]
    },
    human: {
      summary: String,
      rating: Number,
      comments: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reviewedAt: Date
    }
  },
  settings: {
    recordAudio: {
      type: Boolean,
      default: false
    },
    recordVideo: {
      type: Boolean,
      default: false
    },
    enableRealTimeFeedback: {
      type: Boolean,
      default: true
    }
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Index for better performance
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ type: 1, difficulty: 1 });

// Calculate overall scores before saving
interviewSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.questions.length > 0) {
    const completedQuestions = this.questions.filter(q => q.analysis && q.response);
    
    if (completedQuestions.length > 0) {
      // Calculate basic averages
      const avgConfidence = completedQuestions.reduce((sum, q) => 
        sum + (q.analysis.confidence?.score || 0), 0) / completedQuestions.length;
      
      const avgClarity = completedQuestions.reduce((sum, q) => 
        sum + (q.analysis.communication?.clarity || 0), 0) / completedQuestions.length;
      
      const avgSentiment = completedQuestions.reduce((sum, q) => 
        sum + (q.analysis.sentiment?.overall || 0), 0) / completedQuestions.length;
      
      // Calculate multimedia-specific scores
      const questionsWithVideo = completedQuestions.filter(q => q.analysis.nonVerbal);
      const avgPresence = questionsWithVideo.length > 0 
        ? questionsWithVideo.reduce((sum, q) => sum + (q.analysis.nonVerbal.overallPresence || 0), 0) / questionsWithVideo.length
        : 0;
      
      const questionsWithMedia = completedQuestions.filter(q => q.analysis.mediaAnalysis);
      const avgMediaScore = questionsWithMedia.length > 0
        ? questionsWithMedia.reduce((sum, q) => sum + (q.analysis.mediaAnalysis.communicationScore || 0), 0) / questionsWithMedia.length
        : 0;
      
      // Calculate overall scores
      const overallScores = completedQuestions.map(q => q.analysis.overallScore || 0);
      const avgOverallScore = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
      
      // Normalize sentiment from -1,1 to 0,10
      const sentimentScore = ((avgSentiment + 1) / 2) * 10;
      
      const communicationScore = (avgClarity + (avgConfidence || 0)) / 2;
      
      // Calculate comprehensive score
      let comprehensiveScore = (avgConfidence + avgClarity + sentimentScore) / 3;
      
      // Factor in multimedia scores if available
      if (avgPresence > 0 || avgMediaScore > 0) {
        const multimediaWeight = 0.3; // 30% weight for multimedia
        const textWeight = 0.7; // 70% weight for text analysis
        const multimediaScore = Math.max(avgPresence, avgMediaScore);
        comprehensiveScore = (comprehensiveScore * textWeight) + (multimediaScore * multimediaWeight);
      }
      
      // Calculate grade based on comprehensive score
      let grade = 'F';
      if (comprehensiveScore >= 9.5) grade = 'A+';
      else if (comprehensiveScore >= 9) grade = 'A';
      else if (comprehensiveScore >= 8.5) grade = 'A-';
      else if (comprehensiveScore >= 8) grade = 'B+';
      else if (comprehensiveScore >= 7.5) grade = 'B';
      else if (comprehensiveScore >= 7) grade = 'B-';
      else if (comprehensiveScore >= 6.5) grade = 'C+';
      else if (comprehensiveScore >= 6) grade = 'C';
      else if (comprehensiveScore >= 5.5) grade = 'C-';
      else if (comprehensiveScore >= 5) grade = 'D';
      
      // Collect strengths and improvements
      const allStrengths = completedQuestions.flatMap(q => q.analysis.strengths || []);
      const allImprovements = completedQuestions.flatMap(q => q.analysis.suggestedImprovements || []);
      
      // Remove duplicates and get top items
      const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
      const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5);
      
      this.overallAnalysis = {
        averageConfidence: parseFloat(avgConfidence.toFixed(1)),
        averageClarity: parseFloat(avgClarity.toFixed(1)),
        averagePresence: parseFloat(avgPresence.toFixed(1)),
        communicationScore: parseFloat(communicationScore.toFixed(1)),
        sentimentScore: parseFloat(sentimentScore.toFixed(1)),
        multimediaScore: parseFloat(avgMediaScore.toFixed(1)),
        overallScore: parseFloat(comprehensiveScore.toFixed(1)),
        strengths: uniqueStrengths,
        improvements: uniqueImprovements,
        grade: grade,
        breakdown: {
          textAnalysis: parseFloat(((avgConfidence + avgClarity + sentimentScore) / 3).toFixed(1)),
          audioQuality: parseFloat((avgMediaScore || 0).toFixed(1)),
          videoPresence: parseFloat((avgPresence || 0).toFixed(1)),
          overallPerformance: parseFloat(comprehensiveScore.toFixed(1))
        }
      };
    }
  }
  next();
});

module.exports = mongoose.model('Interview', interviewSchema);