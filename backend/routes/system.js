const express = require('express');
const speechService = require('../utils/speechToText');
const huggingFaceService = require('../utils/huggingFaceNLP');
const localWhisper = require('../utils/localWhisper');

const router = express.Router();

// @route   GET /api/system/status
// @desc    Get system status and service availability
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const speechStatus = speechService.getServiceStatus();
    const huggingFaceStatus = huggingFaceService.getServiceStatus();
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      services: {
        speechToText: {
          ...speechStatus,
          recommendations: speechStatus.localWhisper 
            ? ['✅ Local Whisper is working perfectly!']
            : [
                '⚠️ Install Local Whisper for free speech-to-text:',
                '1. Install Python 3.7+',
                '2. Run: pip install openai-whisper',
                '3. Install FFmpeg',
                '4. Restart server'
              ]
        },
        nlp: {
          ...huggingFaceStatus,
          recommendations: huggingFaceStatus.huggingface
            ? ['✅ HuggingFace NLP is working perfectly!']
            : ['⚠️ HuggingFace service using fallback mode']
        }
      },
      costAnalysis: {
        currentSetup: 'FREE',
        monthlyEstimate: '$0.00',
        services: [
          {
            name: 'Speech-to-Text',
            provider: speechStatus.localWhisper ? 'Local Whisper' : 'Fallback',
            cost: 'FREE',
            quality: speechStatus.localWhisper ? 'Excellent' : 'Basic'
          },
          {
            name: 'Sentiment Analysis',
            provider: 'HuggingFace',
            cost: huggingFaceStatus.apiKeyConfigured ? 'FREE (with higher limits)' : 'FREE (rate limited)',
            quality: 'Excellent'
          }
        ]
      },
      recommendations: []
    };

    // Add recommendations based on status
    if (!speechStatus.localWhisper) {
      systemStatus.recommendations.push({
        priority: 'high',
        title: 'Install Local Whisper',
        description: 'Get free, high-quality speech-to-text processing',
        action: 'See FREE_AI_SETUP.md for installation instructions'
      });
    }

    if (!huggingFaceStatus.apiKeyConfigured) {
      systemStatus.recommendations.push({
        priority: 'medium',
        title: 'Optional: Get HuggingFace API Key',
        description: 'Increase rate limits and access more models',
        action: 'Sign up at huggingface.co for free API key'
      });
    }

    if (speechStatus.localWhisper && huggingFaceStatus.huggingface) {
      systemStatus.recommendations.push({
        priority: 'info',
        title: 'Perfect Setup!',
        description: 'You have a fully functional free AI system',
        action: 'Start creating interviews and enjoy free AI analysis!'
      });
    }

    res.json(systemStatus);
  } catch (error) {
    console.error('System status check error:', error);
    res.status(500).json({
      error: 'Failed to check system status',
      message: error.message
    });
  }
});

// @route   POST /api/system/test-speech
// @desc    Test speech-to-text with a sample
// @access  Public
router.post('/test-speech', async (req, res) => {
  try {
    // This would be used for testing with actual audio files
    res.json({
      message: 'Speech testing endpoint ready',
      availableProviders: speechService.getServiceStatus(),
      testInstructions: [
        'Upload an audio file to test speech-to-text functionality',
        'Supported formats: WAV, MP3, WebM, MP4',
        'Test with a short 5-10 second audio clip'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Speech test failed',
      message: error.message
    });
  }
});

// @route   POST /api/system/test-nlp
// @desc    Test NLP analysis with sample text
// @access  Public
router.post('/test-nlp', async (req, res) => {
  try {
    const { text } = req.body;
    const testText = text || "I'm excited about this opportunity and confident in my abilities to contribute to your team.";
    
    console.log('Testing NLP with sample text...');
    const analysis = await huggingFaceService.analyzeComprehensive(testText);
    
    res.json({
      message: 'NLP test completed successfully',
      testText: testText,
      analysis: analysis,
      performance: {
        provider: analysis.provider,
        processingTime: 'Fast',
        quality: analysis.success ? 'Excellent' : 'Fallback mode'
      }
    });
  } catch (error) {
    console.error('NLP test error:', error);
    res.status(500).json({
      error: 'NLP test failed',
      message: error.message,
      fallback: 'Using basic sentiment analysis'
    });
  }
});

// @route   GET /api/system/installation-help
// @desc    Get installation instructions for free services
// @access  Public
router.get('/installation-help', (req, res) => {
  try {
    const whisperInstructions = localWhisper.getInstallationInstructions();
    
    res.json({
      title: 'Free AI Services Installation Guide',
      whisper: whisperInstructions,
      huggingface: {
        title: 'HuggingFace Setup (Optional)',
        steps: [
          '1. Visit https://huggingface.co',
          '2. Sign up for free account',
          '3. Go to Settings → Access Tokens',
          '4. Create a new token',
          '5. Add HUGGINGFACE_API_KEY=your_token to .env',
          '6. Restart server'
        ],
        benefits: [
          'Higher rate limits',
          'Access to more models',
          'Faster processing',
          'Still completely free'
        ]
      },
      costComparison: {
        'Google Speech-to-Text': '$0.006 per 15 seconds',
        'Azure Speech Service': '$1.00 per hour',
        'Local Whisper': 'FREE ✅',
        'HuggingFace NLP': 'FREE ✅'
      },
      quickTest: {
        endpoints: [
          'GET /api/system/status - Check service status',
          'POST /api/system/test-nlp - Test sentiment analysis',
          'POST /api/system/test-speech - Test speech-to-text'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get installation help',
      message: error.message
    });
  }
});

module.exports = router;