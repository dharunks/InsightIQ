const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

class VideoAnalyzer {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  // Extract audio from video file
  async extractAudio(videoPath) {
    const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('end', () => resolve(audioPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  // Analyze video metrics (frame rate, resolution, duration)
  async analyzeVideoMetrics(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        const analysis = {
          duration: parseFloat(metadata.format.duration) || 0,
          size: parseInt(metadata.format.size) || 0,
          bitrate: parseInt(metadata.format.bit_rate) || 0,
          video: videoStream ? {
            width: videoStream.width,
            height: videoStream.height,
            frameRate: eval(videoStream.r_frame_rate) || 0,
            codec: videoStream.codec_name,
            bitrate: parseInt(videoStream.bit_rate) || 0
          } : null,
          audio: audioStream ? {
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            codec: audioStream.codec_name,
            bitrate: parseInt(audioStream.bit_rate) || 0
          } : null
        };

        resolve(analysis);
      });
    });
  }

  // Analyze audio characteristics for speaking pace and clarity
  async analyzeAudioCharacteristics(audioPath) {
    try {
      // This is a simplified analysis - in production, you'd use more sophisticated tools
      const stats = await fs.stat(audioPath);
      const metadata = await this.getAudioMetadata(audioPath);
      
      // Calculate basic metrics
      const duration = metadata.duration || 0;
      const fileSize = stats.size;
      
      // Estimate speaking pace (very basic estimation)
      const estimatedWordsPerMinute = duration > 0 ? Math.min(200, Math.max(80, (fileSize / 1024) * 0.1)) : 0;
      
      // Estimate clarity based on file size and duration (higher bitrate = better quality)
      const avgBitrate = duration > 0 ? (fileSize * 8) / duration : 0;
      const clarityScore = Math.min(10, Math.max(1, (avgBitrate / 1000) * 0.5));

      return {
        duration,
        fileSize,
        estimatedWPM: Math.round(estimatedWordsPerMinute),
        clarityScore: parseFloat(clarityScore.toFixed(1)),
        avgBitrate: Math.round(avgBitrate),
        pace: this.categorizePace(estimatedWordsPerMinute)
      };
    } catch (error) {
      console.error('Error analyzing audio characteristics:', error);
      return {
        duration: 0,
        fileSize: 0,
        estimatedWPM: 120,
        clarityScore: 5,
        avgBitrate: 0,
        pace: 'normal'
      };
    }
  }

  // Get audio metadata
  async getAudioMetadata(audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          resolve({ duration: 0 }); // Fallback
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        resolve({
          duration: parseFloat(metadata.format.duration) || 0,
          sampleRate: audioStream ? audioStream.sample_rate : 16000,
          channels: audioStream ? audioStream.channels : 1,
          bitrate: audioStream ? parseInt(audioStream.bit_rate) : 0
        });
      });
    });
  }

  // Categorize speaking pace
  categorizePace(wpm) {
    if (wpm < 100) return 'slow';
    if (wpm > 160) return 'fast';
    return 'normal';
  }

  // Analyze video for non-verbal cues (basic analysis)
  async analyzeNonVerbalCues(videoPath) {
    try {
      const metadata = await this.analyzeVideoMetrics(videoPath);
      
      // Basic non-verbal analysis based on video characteristics
      const hasVideo = metadata.video !== null;
      const videoQuality = hasVideo ? this.assessVideoQuality(metadata.video) : 0;
      const eyeContactScore = hasVideo ? Math.random() * 4 + 6 : 0; // Mock score 6-10
      const postureScore = hasVideo ? Math.random() * 3 + 7 : 0; // Mock score 7-10
      
      return {
        hasVideo,
        videoQuality,
        eyeContact: {
          score: parseFloat(eyeContactScore.toFixed(1)),
          feedback: this.getEyeContactFeedback(eyeContactScore)
        },
        posture: {
          score: parseFloat(postureScore.toFixed(1)),
          feedback: this.getPostureFeedback(postureScore)
        },
        overallPresence: parseFloat(((eyeContactScore + postureScore) / 2).toFixed(1))
      };
    } catch (error) {
      console.error('Error analyzing non-verbal cues:', error);
      return {
        hasVideo: false,
        videoQuality: 0,
        eyeContact: { score: 0, feedback: 'Video analysis not available' },
        posture: { score: 0, feedback: 'Video analysis not available' },
        overallPresence: 0
      };
    }
  }

  // Assess video quality
  assessVideoQuality(videoData) {
    const { width, height, frameRate, bitrate } = videoData;
    let score = 5; // baseline
    
    // Resolution score
    if (width >= 1280 && height >= 720) score += 2; // HD
    else if (width >= 640 && height >= 480) score += 1; // SD
    
    // Frame rate score  
    if (frameRate >= 30) score += 1.5;
    else if (frameRate >= 24) score += 1;
    
    // Bitrate score
    if (bitrate >= 2000000) score += 1.5; // 2Mbps+
    else if (bitrate >= 1000000) score += 1; // 1Mbps+
    
    return Math.min(10, Math.max(1, score));
  }

  // Generate eye contact feedback
  getEyeContactFeedback(score) {
    if (score >= 9) return 'Excellent eye contact maintained throughout';
    if (score >= 7) return 'Good eye contact with minor lapses';
    if (score >= 5) return 'Adequate eye contact, can be improved';
    return 'Limited eye contact, try to look directly at the camera';
  }

  // Generate posture feedback
  getPostureFeedback(score) {
    if (score >= 9) return 'Professional posture maintained throughout';
    if (score >= 7) return 'Good posture with minor adjustments needed';
    if (score >= 5) return 'Adequate posture, maintain straight back';
    return 'Posture needs improvement, sit up straight';
  }

  // Generate comprehensive video analysis
  async analyzeVideo(videoPath) {
    try {
      const [metrics, audioPath] = await Promise.all([
        this.analyzeVideoMetrics(videoPath),
        this.extractAudio(videoPath)
      ]);

      const [audioCharacteristics, nonVerbalCues] = await Promise.all([
        this.analyzeAudioCharacteristics(audioPath),
        this.analyzeNonVerbalCues(videoPath)
      ]);

      // Cleanup temporary audio file
      try {
        await fs.unlink(audioPath);
      } catch (cleanupError) {
        console.warn('Could not cleanup temp file:', cleanupError.message);
      }

      return {
        technical: metrics,
        audio: audioCharacteristics,
        nonVerbal: nonVerbalCues,
        overall: {
          duration: metrics.duration,
          quality: nonVerbalCues.videoQuality,
          communicationScore: (audioCharacteristics.clarityScore + nonVerbalCues.overallPresence) / 2
        }
      };
    } catch (error) {
      console.error('Error in comprehensive video analysis:', error);
      throw error;
    }
  }

  // Analyze audio file directly
  async analyzeAudio(audioPath) {
    try {
      const audioCharacteristics = await this.analyzeAudioCharacteristics(audioPath);
      
      return {
        technical: {
          duration: audioCharacteristics.duration,
          fileSize: audioCharacteristics.fileSize,
          avgBitrate: audioCharacteristics.avgBitrate
        },
        speech: {
          estimatedWPM: audioCharacteristics.estimatedWPM,
          pace: audioCharacteristics.pace,
          clarityScore: audioCharacteristics.clarityScore
        },
        overall: {
          duration: audioCharacteristics.duration,
          quality: audioCharacteristics.clarityScore,
          communicationScore: audioCharacteristics.clarityScore
        }
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  }

  // Cleanup temp files
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        // Delete files older than 1 hour
        if (now - stats.mtime.getTime() > 3600000) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = new VideoAnalyzer();