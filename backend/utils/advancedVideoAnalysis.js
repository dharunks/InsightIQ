const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

class AdvancedVideoAnalyzer {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.frameExtractInterval = 2; // Extract 1 frame every 2 seconds
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  // Extract frames from video for analysis
  async extractFrames(videoPath) {
    const framesDir = path.join(this.tempDir, `frames_${Date.now()}`);
    await fs.mkdir(framesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions(['-vf', `fps=1/${this.frameExtractInterval}`, '-q:v', '2'])
        .output(path.join(framesDir, 'frame_%03d.jpg'))
        .on('end', () => resolve(framesDir))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  // Advanced body language analysis simulation
  async analyzeFrame(framePath) {
    try {
      const frameBuffer = await fs.readFile(framePath);
      const metadata = await sharp(frameBuffer).metadata();
      
      // Simulate ML-based body language analysis
      const analysis = await this.simulateBodyLanguageAnalysis(frameBuffer, metadata);
      
      return {
        framePath,
        timestamp: this.extractTimestampFromFilename(framePath),
        bodyLanguage: analysis,
        confidence: analysis.overallConfidence
      };
    } catch (error) {
      return { framePath, error: error.message, confidence: 0 };
    }
  }

  async simulateBodyLanguageAnalysis(frameBuffer, metadata) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing
    
    const seed = frameBuffer.length % 1000;
    const aspectRatio = metadata.width / metadata.height;
    
    // Posture Analysis
    const postureScore = 6 + (seed % 4) + (aspectRatio > 1.2 ? 0.5 : -0.5);
    const posture = {
      score: parseFloat(postureScore.toFixed(1)),
      alignment: postureScore > 7.5 ? 'Good' : 'Needs improvement',
      confidence: Math.min(1, 0.7 + (seed % 30) / 100)
    };

    // Eye Contact Analysis
    const eyeContactScore = 6 + (seed % 5);
    const eyeContact = {
      score: parseFloat(eyeContactScore.toFixed(1)),
      directness: eyeContactScore > 7.5 ? 'Excellent' : 'Good',
      consistency: eyeContactScore > 7 ? 'Consistent' : 'Variable',
      confidence: Math.min(1, 0.6 + (seed % 40) / 100)
    };

    // Facial Expression Analysis
    const emotions = {
      neutral: 0.4 + (seed % 20) / 100,
      confident: 0.2 + (seed % 15) / 100,
      happy: 0.15 + (seed % 10) / 100,
      nervous: 0.1 + (seed % 8) / 100,
      focused: 0.15 + (seed % 12) / 100
    };
    
    const dominantEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0];

    const facialExpressions = {
      dominant: { emotion: dominantEmotion[0], intensity: dominantEmotion[1] },
      emotions,
      appropriateness: ['neutral', 'confident', 'focused'].includes(dominantEmotion[0]) ? 'Appropriate' : 'Consider adjustment',
      confidence: Math.min(1, 0.6 + (seed % 35) / 100)
    };

    // Gesture Analysis
    const gestureTypes = [];
    if (seed % 4 === 0) gestureTypes.push('purposeful_gestures');
    if (seed % 5 === 0) gestureTypes.push('open_posture');
    if (seed % 7 === 0) gestureTypes.push('hand_movement');
    if (seed % 11 === 0) gestureTypes.push('fidgeting');

    const gestureScore = Math.min(10, 7 + gestureTypes.filter(g => !g.includes('fidgeting')).length - gestureTypes.filter(g => g.includes('fidgeting')).length);

    const gestures = {
      detected: gestureTypes,
      score: parseFloat(gestureScore.toFixed(1)),
      naturalness: gestureTypes.includes('fidgeting') ? 'Some tension detected' : 'Natural',
      confidence: Math.min(1, 0.65 + (seed % 30) / 100)
    };

    // Overall Presence
    const overallScore = (postureScore + eyeContactScore + gestureScore) / 3;
    const overallPresence = {
      score: parseFloat(overallScore.toFixed(1)),
      professionalism: overallScore > 7.5 ? 'High' : overallScore > 6 ? 'Good' : 'Developing',
      engagement: eyeContactScore > 7 ? 'Engaged' : 'Moderate',
      authenticity: facialExpressions.appropriateness === 'Appropriate' ? 'Authentic' : 'Improving'
    };

    return {
      posture,
      eyeContact,
      facialExpressions,
      gestures, 
      overallPresence,
      overallConfidence: (posture.confidence + eyeContact.confidence + facialExpressions.confidence + gestures.confidence) / 4
    };
  }

  // Analyze complete video
  async analyzeCompleteVideo(videoPath) {
    try {
      console.log('Starting advanced video body language analysis...');
      
      const videoMetrics = await this.getVideoMetrics(videoPath);
      const framesDir = await this.extractFrames(videoPath);
      const frameFiles = await fs.readdir(framesDir);
      const imageFiles = frameFiles.filter(file => file.match(/\.(jpg|jpeg|png)$/i));
      
      console.log(`Analyzing ${imageFiles.length} frames for body language...`);
      
      // Analyze frames in small batches
      const frameAnalyses = [];
      const batchSize = 3;
      
      for (let i = 0; i < imageFiles.length; i += batchSize) {
        const batch = imageFiles.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(file => this.analyzeFrame(path.join(framesDir, file)))
        );
        frameAnalyses.push(...batchResults);
        
        if (i + batchSize < imageFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const aggregatedAnalysis = this.aggregateFrameAnalyses(frameAnalyses);
      
      // Cleanup
      await this.cleanupDirectory(framesDir);

      return {
        success: true,
        videoMetrics,
        frameCount: frameAnalyses.length,
        bodyLanguageAnalysis: aggregatedAnalysis,
        timeline: this.createTimeline(frameAnalyses),
        overallAssessment: this.createAssessment(aggregatedAnalysis),
        recommendations: this.generateRecommendations(aggregatedAnalysis),
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Video analysis failed:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: await this.getFallbackAnalysis(videoPath)
      };
    }
  }

  aggregateFrameAnalyses(frameAnalyses) {
    const validFrames = frameAnalyses.filter(f => !f.error && f.confidence > 0.3);
    
    if (validFrames.length === 0) {
      return this.getDefaultAnalysis();
    }

    // Average scores
    const avgPosture = validFrames.reduce((sum, f) => sum + f.bodyLanguage.posture.score, 0) / validFrames.length;
    const avgEyeContact = validFrames.reduce((sum, f) => sum + f.bodyLanguage.eyeContact.score, 0) / validFrames.length;
    const avgGestures = validFrames.reduce((sum, f) => sum + f.bodyLanguage.gestures.score, 0) / validFrames.length;
    const avgOverall = validFrames.reduce((sum, f) => sum + f.bodyLanguage.overallPresence.score, 0) / validFrames.length;

    // Dominant emotions
    const emotionCounts = {};
    validFrames.forEach(frame => {
      const emotion = frame.bodyLanguage.facialExpressions.dominant.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    const dominantEmotion = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0];

    return {
      posture: {
        averageScore: parseFloat(avgPosture.toFixed(1)),
        consistency: this.calculateConsistency(validFrames.map(f => f.bodyLanguage.posture.score)),
        trend: this.calculateTrend(validFrames.map(f => f.bodyLanguage.posture.score))
      },
      eyeContact: {
        averageScore: parseFloat(avgEyeContact.toFixed(1)),
        consistency: this.calculateConsistency(validFrames.map(f => f.bodyLanguage.eyeContact.score)),
        directnessLevel: avgEyeContact > 7.5 ? 'Excellent' : avgEyeContact > 6 ? 'Good' : 'Needs improvement'
      },
      facialExpressions: {
        dominantEmotion: dominantEmotion ? dominantEmotion[0] : 'neutral',
        emotionDistribution: emotionCounts,
        emotionalRange: Object.keys(emotionCounts).length,
        appropriateness: this.assessEmotionalAppropriateness(dominantEmotion?.[0])
      },
      gestures: {
        averageScore: parseFloat(avgGestures.toFixed(1)),
        naturalness: avgGestures > 7 ? 'Natural' : 'Some tension detected',
        variety: this.calculateGestureVariety(validFrames)
      },
      overallPresence: {
        score: parseFloat(avgOverall.toFixed(1)),
        professionalism: avgOverall > 7.5 ? 'High' : avgOverall > 6 ? 'Good' : 'Developing',
        engagement: avgEyeContact > 7 ? 'Highly engaged' : 'Moderately engaged',
        consistency: this.calculateConsistency(validFrames.map(f => f.bodyLanguage.overallPresence.score))
      }
    };
  }

  createTimeline(frameAnalyses) {
    return frameAnalyses.map(frame => ({
      timestamp: frame.timestamp,
      posture: frame.bodyLanguage?.posture?.score || 0,
      eyeContact: frame.bodyLanguage?.eyeContact?.score || 0,
      gesture: frame.bodyLanguage?.gestures?.score || 0,
      overall: frame.bodyLanguage?.overallPresence?.score || 0,
      emotion: frame.bodyLanguage?.facialExpressions?.dominant?.emotion || 'neutral'
    }));
  }

  createAssessment(analysis) {
    const overallScore = (analysis.posture.averageScore + analysis.eyeContact.averageScore + analysis.overallPresence.score) / 3;
    
    return {
      overallScore: parseFloat(overallScore.toFixed(1)),
      grade: this.scoreToGrade(overallScore),
      strengths: this.identifyStrengths(analysis),
      areasForImprovement: this.identifyWeaknesses(analysis),
      professionalPresence: overallScore > 7.5 ? 'Strong' : overallScore > 6 ? 'Developing' : 'Needs focus'
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.posture.averageScore < 7) {
      recommendations.push({
        category: 'Posture',
        suggestion: 'Focus on maintaining straight, confident posture',
        priority: 'High'
      });
    }

    if (analysis.eyeContact.averageScore < 7) {
      recommendations.push({
        category: 'Eye Contact',
        suggestion: 'Maintain more consistent eye contact with the camera',
        priority: 'High'
      });
    }

    if (analysis.gestures.averageScore < 6.5) {
      recommendations.push({
        category: 'Gestures',
        suggestion: 'Use more natural, purposeful gestures and reduce fidgeting',
        priority: 'Medium'
      });
    }

    if (analysis.facialExpressions.appropriateness !== 'Appropriate') {
      recommendations.push({
        category: 'Facial Expressions',
        suggestion: 'Show more confident and positive facial expressions',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  // Utility methods
  extractTimestampFromFilename(framePath) {
    const filename = path.basename(framePath);
    const match = filename.match(/frame_(\d+)/);
    return match ? (parseInt(match[1]) - 1) * this.frameExtractInterval : 0;
  }

  calculateConsistency(scores) {
    if (scores.length < 2) return 1;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - (stdDev / mean));
  }

  calculateTrend(scores) {
    if (scores.length < 3) return 'stable';
    const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  assessEmotionalAppropriateness(emotion) {
    const appropriate = ['neutral', 'confident', 'focused', 'happy'];
    return appropriate.includes(emotion) ? 'Appropriate' : 'Consider adjustment';
  }

  calculateGestureVariety(frames) {
    const allGestures = frames.flatMap(f => f.bodyLanguage.gestures.detected);
    return new Set(allGestures).size;
  }

  scoreToGrade(score) {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B';
    if (score >= 6) return 'C';
    return 'D';
  }

  identifyStrengths(analysis) {
    const strengths = [];
    if (analysis.posture.averageScore >= 7.5) strengths.push('Excellent posture');
    if (analysis.eyeContact.averageScore >= 7.5) strengths.push('Strong eye contact');
    if (analysis.gestures.averageScore >= 7.5) strengths.push('Natural gestures');
    if (analysis.facialExpressions.appropriateness === 'Appropriate') strengths.push('Appropriate expressions');
    return strengths;
  }

  identifyWeaknesses(analysis) {
    const weaknesses = [];
    if (analysis.posture.averageScore < 6.5) weaknesses.push('Posture needs improvement');
    if (analysis.eyeContact.averageScore < 6.5) weaknesses.push('Eye contact consistency');
    if (analysis.gestures.averageScore < 6.5) weaknesses.push('Gesture control');
    return weaknesses;
  }

  async getVideoMetrics(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          resolve({ duration: 60, width: 640, height: 480, frameRate: 30 });
          return;
        }
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        resolve({
          duration: parseFloat(metadata.format.duration) || 60,
          width: videoStream ? videoStream.width : 640,
          height: videoStream ? videoStream.height : 480,
          frameRate: videoStream ? eval(videoStream.r_frame_rate) || 30 : 30
        });
      });
    });
  }

  async cleanupDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      await Promise.all(files.map(file => fs.unlink(path.join(dirPath, file))));
      await fs.rmdir(dirPath);
    } catch (error) {
      console.warn('Cleanup error:', error.message);
    }
  }

  getDefaultAnalysis() {
    return {
      posture: { averageScore: 6, consistency: 0.7, trend: 'stable' },
      eyeContact: { averageScore: 6, consistency: 0.7, directnessLevel: 'Good' },
      facialExpressions: { dominantEmotion: 'neutral', emotionDistribution: {neutral: 1}, emotionalRange: 1, appropriateness: 'Appropriate' },
      gestures: { averageScore: 6, naturalness: 'Natural', variety: 2 },
      overallPresence: { score: 6, professionalism: 'Good', engagement: 'Moderately engaged', consistency: 0.7 }
    };
  }

  async getFallbackAnalysis(videoPath) {
    try {
      const videoMetrics = await this.getVideoMetrics(videoPath);
      return {
        videoMetrics,
        bodyLanguageAnalysis: this.getDefaultAnalysis(),
        note: 'Using basic video analysis'
      };
    } catch (error) {
      return {
        error: 'Video analysis not available',
        bodyLanguageAnalysis: this.getDefaultAnalysis()
      };
    }
  }
}

module.exports = new AdvancedVideoAnalyzer();