const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth');

// Import analysis services
const speechToTextService = require('../utils/speechToText');
const huggingFaceNLP = require('../utils/huggingFaceNLP');
const advancedVideoAnalysis = require('../utils/advancedVideoAnalysis');
const sentimentAnalyzer = require('../utils/sentimentAnalysis');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', req.user._id.toString());
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio and video files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and video files are allowed'));
    }
  }
});

// @route   POST /api/multimedia/analyze-speech
// @desc    Analyze speech from audio file
// @access  Private
router.post('/analyze-speech', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { text, options = {} } = req.body;
    const audioPath = req.file.path;

    console.log(`Processing speech analysis for user ${req.user._id}`);

    // Read audio file
    const audioBuffer = await fs.readFile(audioPath);
    
    // Transcribe audio to text
    const transcriptionResult = await speechToTextService.transcribe(audioBuffer, {
      languageCode: options.language || 'en-US',
      encoding: 'WEBM_OPUS',
      sampleRate: options.sampleRate || 48000
    });

    let finalText = text || transcriptionResult.transcript || '';
    
    // If no text provided and transcription failed, return error
    if (!finalText.trim()) {
      return res.status(400).json({
        error: 'No speech detected or text provided',
        transcription: transcriptionResult
      });
    }

    // Analyze speech characteristics if transcription was successful
    let speechCharacteristics = null;
    if (transcriptionResult.success && transcriptionResult.words && transcriptionResult.words.length > 0) {
      speechCharacteristics = speechToTextService.analyzeSpeechCharacteristics(transcriptionResult);
    }

    // Perform comprehensive NLP analysis
    const nlpAnalysis = await huggingFaceNLP.analyzeComprehensive(finalText, options);

    // Combine analyses for multimedia response
    const multimediaAnalysis = await sentimentAnalyzer.analyzeMultimediaResponse(
      finalText,
      audioPath,
      'audio'
    );

    // Cleanup uploaded file
    try {
      await fs.unlink(audioPath);
    } catch (cleanupError) {
      console.warn('Could not cleanup audio file:', cleanupError.message);
    }

    res.json({
      success: true,
      analysis: {
        transcription: transcriptionResult,
        speechCharacteristics,
        nlpAnalysis,
        multimediaAnalysis,
        text: finalText,
        processingTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Speech analysis error:', error);
    
    // Cleanup file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not cleanup file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      error: 'Speech analysis failed',
      message: error.message
    });
  }
});

// @route   POST /api/multimedia/analyze-video
// @desc    Analyze video for body language and speech
// @access  Private
router.post('/analyze-video', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const { text, options = {} } = req.body;
    const videoPath = req.file.path;

    console.log(`Processing video analysis for user ${req.user._id}`);

    // Start parallel analyses
    const analysisPromises = [];

    // 1. Advanced video/body language analysis
    analysisPromises.push(
      advancedVideoAnalysis.analyzeCompleteVideo(videoPath, options)
        .catch(error => ({
          success: false,
          error: error.message,
          type: 'video'
        }))
    );

    // 2. Speech analysis if audio is present
    if (options.includeSpeech !== false) {
      analysisPromises.push(
        (async () => {
          try {
            const audioBuffer = await fs.readFile(videoPath);
            const transcriptionResult = await speechToTextService.transcribe(audioBuffer, {
              languageCode: options.language || 'en-US',
              encoding: 'WEBM_OPUS'
            });
            
            return {
              type: 'speech',
              transcription: transcriptionResult,
              speechCharacteristics: transcriptionResult.success ? 
                speechToTextService.analyzeSpeechCharacteristics(transcriptionResult) : null
            };
          } catch (error) {
            return {
              type: 'speech',
              success: false,
              error: error.message
            };
          }
        })()
      );
    }

    // 3. NLP analysis on provided text or transcribed speech
    if (text && text.trim()) {
      analysisPromises.push(
        huggingFaceNLP.analyzeComprehensive(text, options)
          .then(result => ({ type: 'nlp', ...result }))
          .catch(error => ({
            type: 'nlp',
            success: false,
            error: error.message
          }))
      );
    }

    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);
    
    // Organize results
    const analysisResults = {
      video: results.find(r => r.type !== 'speech' && r.type !== 'nlp') || null,
      speech: results.find(r => r.type === 'speech') || null,
      nlp: results.find(r => r.type === 'nlp') || null
    };

    // Create comprehensive multimedia analysis
    let multimediaAnalysis = null;
    const finalText = text || analysisResults.speech?.transcription?.transcript || '';
    
    if (finalText.trim()) {
      multimediaAnalysis = await sentimentAnalyzer.analyzeMultimediaResponse(
        finalText,
        videoPath,
        'video'
      ).catch(error => ({
        success: false,
        error: error.message
      }));
    }

    // Generate comprehensive insights
    const comprehensiveInsights = generateComprehensiveInsights(analysisResults, multimediaAnalysis);

    // Cleanup uploaded file
    try {
      await fs.unlink(videoPath);
    } catch (cleanupError) {
      console.warn('Could not cleanup video file:', cleanupError.message);
    }

    res.json({
      success: true,
      analysis: {
        video: analysisResults.video,
        speech: analysisResults.speech,
        nlp: analysisResults.nlp,
        multimedia: multimediaAnalysis,
        insights: comprehensiveInsights,
        text: finalText,
        processingTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Video analysis error:', error);
    
    // Cleanup file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not cleanup file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      error: 'Video analysis failed',
      message: error.message
    });
  }
});

// @route   POST /api/multimedia/analyze-text
// @desc    Analyze text using advanced NLP
// @access  Private
router.post('/analyze-text', authMiddleware, async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for analysis' });
    }

    console.log(`Processing text analysis for user ${req.user._id}`);

    // Perform parallel analyses
    const [huggingFaceAnalysis, sentimentAnalysis] = await Promise.all([
      huggingFaceNLP.analyzeComprehensive(text, options),
      sentimentAnalyzer.analyzeText(text)
    ]);

    // Combine insights
    const combinedInsights = {
      overallScore: huggingFaceAnalysis.success ? 
        huggingFaceAnalysis.communicationScore?.overall || 
        sentimentAnalysis.confidence?.score || 5 : 
        sentimentAnalysis.confidence?.score || 5,
      
      sentiment: huggingFaceAnalysis.sentiment || sentimentAnalysis.sentiment,
      emotion: huggingFaceAnalysis.emotion || null,
      
      strengths: [],
      improvements: [
        ...(huggingFaceAnalysis.recommendations || []),
        ...(sentimentAnalysis.suggestedImprovements || [])
      ],
      
      keyMetrics: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        readabilityLevel: calculateReadabilityLevel(text),
        professionalismScore: huggingFaceAnalysis.toxicity?.professionalismScore || 8
      }
    };

    // Add strengths based on analysis
    if (combinedInsights.overallScore >= 8) {
      combinedInsights.strengths.push('Excellent communication skills');
    }
    if (combinedInsights.keyMetrics.professionalismScore >= 8) {
      combinedInsights.strengths.push('Professional tone maintained');
    }

    res.json({
      success: true,
      analysis: {
        huggingFace: huggingFaceAnalysis,
        sentiment: sentimentAnalysis,
        insights: combinedInsights,
        text: text,
        processingTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      error: 'Text analysis failed',
      message: error.message
    });
  }
});

// @route   GET /api/multimedia/services-status
// @desc    Get status of all analysis services
// @access  Private
router.get('/services-status', authMiddleware, async (req, res) => {
  try {
    const status = {
      speechToText: speechToTextService.getServiceStatus(),
      huggingFace: huggingFaceNLP.getServiceStatus(),
      videoAnalysis: {
        available: true,
        features: ['body_language', 'posture_analysis', 'eye_contact', 'facial_expressions', 'gestures']
      },
      sentimentAnalysis: {
        available: true,
        features: ['sentiment', 'confidence', 'clarity', 'fluency']
      },
      multimedia: {
        maxFileSize: '100MB',
        supportedFormats: {
          audio: ['webm', 'mp3', 'wav', 'ogg'],
          video: ['webm', 'mp4', 'avi', 'mov']
        }
      }
    };

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Service status error:', error);
    res.status(500).json({
      error: 'Could not retrieve service status',
      message: error.message
    });
  }
});

// @route   POST /api/multimedia/batch-analyze
// @desc    Analyze multiple files in batch
// @access  Private
router.post('/batch-analyze', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    const { texts = [], options = {} } = req.body;
    const files = req.files;

    console.log(`Processing batch analysis for user ${req.user._id}: ${files.length} files`);

    const results = [];
    
    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = texts[i] || '';
      
      try {
        let analysis;
        
        if (file.mimetype.startsWith('audio/')) {
          const audioBuffer = await fs.readFile(file.path);
          const transcription = await speechToTextService.transcribe(audioBuffer);
          const finalText = text || transcription.transcript || '';
          
          if (finalText.trim()) {
            const nlpAnalysis = await huggingFaceNLP.analyzeComprehensive(finalText);
            analysis = {
              file: file.originalname,
              type: 'audio',
              transcription,
              nlp: nlpAnalysis,
              text: finalText
            };
          } else {
            analysis = {
              file: file.originalname,
              type: 'audio',
              error: 'No speech detected',
              transcription
            };
          }
        } else if (file.mimetype.startsWith('video/')) {
          const videoAnalysis = await advancedVideoAnalysis.analyzeCompleteVideo(file.path);
          analysis = {
            file: file.originalname,
            type: 'video',
            video: videoAnalysis,
            text: text
          };
          
          // Add speech analysis if text provided
          if (text.trim()) {
            analysis.nlp = await huggingFaceNLP.analyzeComprehensive(text);
          }
        }

        results.push(analysis);
        
        // Cleanup file
        await fs.unlink(file.path);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        results.push({
          file: file.originalname,
          error: fileError.message
        });
        
        // Cleanup file on error
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.warn('Could not cleanup file:', cleanupError.message);
        }
      }
    }

    // Generate batch insights
    const batchInsights = generateBatchInsights(results);

    res.json({
      success: true,
      results,
      insights: batchInsights,
      processedCount: results.length,
      processingTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    
    // Cleanup all files on error
    if (req.files) {
      await Promise.all(req.files.map(async file => {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.warn('Could not cleanup file:', cleanupError.message);
        }
      }));
    }

    res.status(500).json({
      error: 'Batch analysis failed',
      message: error.message
    });
  }
});

// Utility functions
function generateComprehensiveInsights(analyses, multimediaAnalysis) {
  const insights = {
    overallScore: 0,
    strengths: [],
    improvements: [],
    keyFindings: []
  };

  let scoreCount = 0;
  let totalScore = 0;

  // Video insights
  if (analyses.video && analyses.video.success) {
    const videoScore = analyses.video.overallAssessment?.overallScore || 0;
    totalScore += videoScore;
    scoreCount++;
    
    insights.keyFindings.push(`Body language assessment: ${analyses.video.overallAssessment?.grade || 'N/A'}`);
    
    if (analyses.video.overallAssessment?.strengths) {
      insights.strengths.push(...analyses.video.overallAssessment.strengths);
    }
    
    if (analyses.video.recommendations) {
      insights.improvements.push(...analyses.video.recommendations.map(r => r.suggestion));
    }
  }

  // Speech insights
  if (analyses.speech && analyses.speech.success) {
    if (analyses.speech.speechCharacteristics) {
      const speechScore = analyses.speech.speechCharacteristics.fluencyScore || 0;
      totalScore += speechScore;
      scoreCount++;
      
      insights.keyFindings.push(`Speech fluency: ${speechScore}/10`);
      insights.keyFindings.push(`Speaking pace: ${analyses.speech.speechCharacteristics.wordsPerMinute} WPM`);
    }
  }

  // NLP insights
  if (analyses.nlp && analyses.nlp.success) {
    const nlpScore = analyses.nlp.communicationScore?.overall || 0;
    totalScore += nlpScore;
    scoreCount++;
    
    insights.keyFindings.push(`Communication score: ${nlpScore}/10`);
    
    if (analyses.nlp.recommendations) {
      insights.improvements.push(...analyses.nlp.recommendations);
    }
  }

  // Multimedia insights
  if (multimediaAnalysis && multimediaAnalysis.success) {
    const multiScore = multimediaAnalysis.overallScore || 0;
    totalScore += multiScore;
    scoreCount++;
  }

  insights.overallScore = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : 0;

  return insights;
}

function generateBatchInsights(results) {
  const successfulAnalyses = results.filter(r => !r.error);
  const audioAnalyses = successfulAnalyses.filter(r => r.type === 'audio');
  const videoAnalyses = successfulAnalyses.filter(r => r.type === 'video');

  return {
    totalProcessed: results.length,
    successful: successfulAnalyses.length,
    failed: results.length - successfulAnalyses.length,
    audioFiles: audioAnalyses.length,
    videoFiles: videoAnalyses.length,
    averageScores: {
      audio: audioAnalyses.length > 0 ? 
        audioAnalyses.reduce((sum, a) => sum + (a.nlp?.communicationScore?.overall || 0), 0) / audioAnalyses.length : 0,
      video: videoAnalyses.length > 0 ? 
        videoAnalyses.reduce((sum, v) => sum + (v.video?.overallAssessment?.overallScore || 0), 0) / videoAnalyses.length : 0
    }
  };
}

function calculateReadabilityLevel(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).length;
  const syllables = text.split(/[aeiouAEIOU]/).length - 1;
  
  if (sentences === 0 || words === 0) return 'Unknown';
  
  // Simplified Flesch Reading Ease calculation
  const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

module.exports = router;