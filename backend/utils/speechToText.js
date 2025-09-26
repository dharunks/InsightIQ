const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const localWhisper = require('./localWhisper');
// Paid services - only initialize if explicitly configured
let speech, speechSDK;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    speech = require('@google-cloud/speech');
  }
  if (process.env.AZURE_SPEECH_KEY) {
    speechSDK = require('microsoft-cognitiveservices-speech-sdk');
  }
} catch (error) {
  console.log('Paid speech services not available (using free alternatives)');
}

class SpeechToTextService {
  constructor() {
    this.googleClient = null;
    this.azureConfig = null;
    this.openaiClient = null;
    
    this.initializeServices();
  }

  async initializeServices() {
    try {
      // Initialize Local Whisper (Free)
      if (process.env.USE_LOCAL_WHISPER === 'true') {
        console.log('Local Whisper (Free) enabled');
        // localWhisper initializes itself
      }
      
      // Initialize Google Speech-to-Text (Paid)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS && speech) {
        this.googleClient = new speech.SpeechClient();
        console.log('Google Speech-to-Text initialized');
      }
      
      // Initialize Azure Speech Service (Paid)
      if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION && speechSDK) {
        this.azureConfig = speechSDK.SpeechConfig.fromSubscription(
          process.env.AZURE_SPEECH_KEY,
          process.env.AZURE_SPEECH_REGION
        );
        this.azureConfig.speechRecognitionLanguage = 'en-US';
        console.log('Azure Speech Service initialized');
      }

      // Initialize OpenAI Whisper (Paid)
      if (process.env.OPENAI_API_KEY) {
        const { OpenAI } = require('openai');
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('OpenAI Whisper initialized');
      }
      
      console.log('Speech-to-Text services initialized with free options prioritized');
    } catch (error) {
      console.warn('Some speech services failed to initialize:', error.message);
    }
  }

  // Google Speech-to-Text implementation
  async transcribeWithGoogle(audioBuffer, options = {}) {
    if (!this.googleClient) {
      throw new Error('Google Speech-to-Text not initialized');
    }

    try {
      const audioBytes = audioBuffer.toString('base64');
      
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: options.encoding || 'WEBM_OPUS',
          sampleRateHertz: options.sampleRate || 48000,
          languageCode: options.languageCode || 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
          model: 'latest_long', // Better for interview responses
          useEnhanced: true,
        },
      };

      console.log('Sending request to Google Speech API...');
      const [response] = await this.googleClient.recognize(request);
      
      const transcriptions = response.results
        .map(result => result.alternatives[0])
        .filter(alternative => alternative);

      if (transcriptions.length === 0) {
        return this.getEmptyResult('google');
      }

      const fullTranscript = transcriptions.map(t => t.transcript).join(' ');
      const confidence = transcriptions.reduce((sum, t) => sum + (t.confidence || 0), 0) / transcriptions.length;
      
      // Extract word-level timing and confidence
      const words = transcriptions.flatMap(t => t.words || []).map(word => ({
        word: word.word,
        startTime: word.startTime ? parseFloat(word.startTime.seconds || 0) + parseFloat(word.startTime.nanos || 0) / 1e9 : 0,
        endTime: word.endTime ? parseFloat(word.endTime.seconds || 0) + parseFloat(word.endTime.nanos || 0) / 1e9 : 0,
        confidence: word.confidence || 0
      }));

      return {
        provider: 'google',
        success: true,
        transcript: fullTranscript.trim(),
        confidence: confidence,
        words: words,
        metadata: {
          language: request.config.languageCode,
          sampleRate: request.config.sampleRateHertz,
          encoding: request.config.encoding
        }
      };
    } catch (error) {
      console.error('Google Speech-to-Text error:', error.message);
      return {
        provider: 'google',
        success: false,
        error: error.message,
        transcript: '',
        confidence: 0
      };
    }
  }

  // Azure Speech Service implementation
  async transcribeWithAzure(audioBuffer, options = {}) {
    if (!this.azureConfig) {
      throw new Error('Azure Speech Service not initialized');
    }

    return new Promise((resolve) => {
      try {
        // Create audio config from buffer
        const pushStream = speechSDK.AudioInputStream.createPushStream();
        pushStream.write(audioBuffer);
        pushStream.close();
        
        const audioConfig = speechSDK.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new speechSDK.SpeechRecognizer(this.azureConfig, audioConfig);

        let transcript = '';
        let confidence = 0;
        let words = [];

        recognizer.recognized = (s, e) => {
          if (e.result.reason === speechSDK.ResultReason.RecognizedSpeech) {
            transcript += e.result.text;
            confidence = e.result.confidence || 0;
            
            // Extract word-level information if available
            if (e.result.json) {
              try {
                const json = JSON.parse(e.result.json);
                if (json.NBest && json.NBest[0] && json.NBest[0].Words) {
                  words = json.NBest[0].Words.map(word => ({
                    word: word.Word,
                    startTime: word.Offset / 10000000, // Convert from 100ns to seconds
                    endTime: (word.Offset + word.Duration) / 10000000,
                    confidence: word.Confidence || 0
                  }));
                }
              } catch (parseError) {
                console.warn('Could not parse Azure word-level data:', parseError.message);
              }
            }
          }
        };

        recognizer.canceled = (s, e) => {
          console.warn('Azure Speech recognition canceled:', e.reason);
          recognizer.close();
          resolve({
            provider: 'azure',
            success: false,
            error: e.errorDetails || 'Recognition canceled',
            transcript: '',
            confidence: 0
          });
        };

        recognizer.sessionStopped = (s, e) => {
          recognizer.close();
          resolve({
            provider: 'azure',
            success: true,
            transcript: transcript.trim(),
            confidence: confidence,
            words: words,
            metadata: {
              language: this.azureConfig.speechRecognitionLanguage,
              sessionId: e.sessionId
            }
          });
        };

        recognizer.startContinuousRecognitionAsync();
        
        // Stop recognition after a timeout
        setTimeout(() => {
          recognizer.stopContinuousRecognitionAsync();
        }, 30000); // 30 second timeout

      } catch (error) {
        console.error('Azure Speech Service error:', error.message);
        resolve({
          provider: 'azure',
          success: false,
          error: error.message,
          transcript: '',
          confidence: 0
        });
      }
    });
  }

  // OpenAI Whisper implementation
  async transcribeWithOpenAI(audioBuffer, options = {}) {
    if (!this.openaiClient) {
      throw new Error('OpenAI not initialized');
    }

    try {
      // Save buffer to temporary file (Whisper API requires file input)
      const tempFilePath = path.join(__dirname, '../temp', `audio_${Date.now()}.webm`);
      await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
      await fs.writeFile(tempFilePath, audioBuffer);

      console.log('Sending request to OpenAI Whisper API...');
      const response = await this.openaiClient.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: options.languageCode?.split('-')[0] || 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      });

      // Cleanup temp file
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Could not cleanup temp file:', cleanupError.message);
      }

      const words = response.words?.map(word => ({
        word: word.word,
        startTime: word.start,
        endTime: word.end,
        confidence: 1.0 // Whisper doesn't provide confidence scores
      })) || [];

      return {
        provider: 'openai',
        success: true,
        transcript: response.text.trim(),
        confidence: 0.95, // Whisper generally has high accuracy
        words: words,
        metadata: {
          language: response.language,
          duration: response.duration,
          model: 'whisper-1'
        }
      };
    } catch (error) {
      console.error('OpenAI Whisper error:', error.message);
      return {
        provider: 'openai',
        success: false,
        error: error.message,
        transcript: '',
        confidence: 0
      };
    }
  }

  // Fallback local speech recognition (basic implementation)
  async transcribeLocally(audioBuffer, options = {}) {
    try {
      // This is a very basic fallback - in a real implementation, 
      // you might use a local Whisper model or other offline solution
      console.log('Using fallback local transcription...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a placeholder response indicating manual transcription needed
      return {
        provider: 'local',
        success: true,
        transcript: '[Audio detected - Please provide manual transcription or configure a speech-to-text service]',
        confidence: 0.1,
        words: [],
        metadata: {
          note: 'This is a fallback response. Configure Google, Azure, or OpenAI for actual transcription.',
          bufferSize: audioBuffer.length,
          estimatedDuration: Math.max(1, audioBuffer.length / 16000) // Rough estimate
        }
      };
    } catch (error) {
      console.error('Local transcription error:', error.message);
      return {
        provider: 'local',
        success: false,
        error: error.message,
        transcript: '',
        confidence: 0
      };
    }
  }

  // Main transcription method with FREE services prioritized
  async transcribe(audioBuffer, options = {}) {
    const providers = [];
    
    // Prioritize FREE services first
    if (process.env.USE_LOCAL_WHISPER === 'true' && localWhisper.isAvailable()) {
      providers.push('local-whisper');
    }
    
    // Then paid services if configured
    if (this.openaiClient) providers.push('openai');
    if (this.googleClient) providers.push('google');
    if (this.azureConfig) providers.push('azure');
    
    // Always have local fallback
    providers.push('local');

    console.log(`Available speech providers (free first): ${providers.join(', ')}`);

    // Try providers in order of preference (free first)
    for (const provider of providers) {
      try {
        console.log(`Attempting transcription with ${provider}...`);
        let result;

        switch (provider) {
          case 'local-whisper':
            result = await localWhisper.transcribe(audioBuffer, options);
            break;
          case 'google':
            result = await this.transcribeWithGoogle(audioBuffer, options);
            break;
          case 'azure':
            result = await this.transcribeWithAzure(audioBuffer, options);
            break;
          case 'openai':
            result = await this.transcribeWithOpenAI(audioBuffer, options);
            break;
          case 'local':
            result = await this.transcribeLocally(audioBuffer, options);
            break;
        }

        if (result.success && result.transcript.length > 0) {
          console.log(`Transcription successful with ${provider}`);
          return result;
        } else {
          console.log(`Transcription failed with ${provider}:`, result.error || 'No text detected');
        }
      } catch (error) {
        console.error(`Error with ${provider}:`, error.message);
        continue;
      }
    }

    // If all providers fail, return error with installation help
    return {
      provider: 'none',
      success: false,
      error: 'All speech-to-text providers failed',
      transcript: '',
      confidence: 0,
      metadata: {
        attemptedProviders: providers,
        installationHelp: localWhisper.getInstallationInstructions()
      }
    };
  }

  // Analyze speech characteristics from transcription data
  analyzeSpeechCharacteristics(transcriptionResult) {
    if (!transcriptionResult.success || !transcriptionResult.words || transcriptionResult.words.length === 0) {
      return {
        wordsPerMinute: 0,
        totalWords: 0,
        totalDuration: 0,
        averageWordDuration: 0,
        pauseAnalysis: {
          totalPauses: 0,
          averagePauseLength: 0,
          longestPause: 0
        },
        fluencyScore: 0
      };
    }

    const words = transcriptionResult.words;
    const totalWords = words.length;
    const totalDuration = words.length > 0 ? words[words.length - 1].endTime - words[0].startTime : 0;
    
    // Calculate words per minute
    const wordsPerMinute = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60) : 0;
    
    // Calculate average word duration
    const wordDurations = words.map(w => w.endTime - w.startTime);
    const averageWordDuration = wordDurations.reduce((sum, dur) => sum + dur, 0) / totalWords;
    
    // Analyze pauses (gaps between words)
    const pauses = [];
    for (let i = 1; i < words.length; i++) {
      const pauseLength = words[i].startTime - words[i - 1].endTime;
      if (pauseLength > 0.1) { // Consider pauses longer than 100ms
        pauses.push(pauseLength);
      }
    }
    
    const pauseAnalysis = {
      totalPauses: pauses.length,
      averagePauseLength: pauses.length > 0 ? pauses.reduce((sum, p) => sum + p, 0) / pauses.length : 0,
      longestPause: pauses.length > 0 ? Math.max(...pauses) : 0
    };
    
    // Calculate fluency score (0-10)
    let fluencyScore = 8; // Base score
    
    // Adjust based on speaking rate
    if (wordsPerMinute < 100) fluencyScore -= 1;
    if (wordsPerMinute > 180) fluencyScore -= 1;
    
    // Adjust based on pause frequency
    const pauseRate = pauses.length / totalDuration;
    if (pauseRate > 2) fluencyScore -= 1; // More than 2 significant pauses per second
    
    // Adjust based on average pause length
    if (pauseAnalysis.averagePauseLength > 1) fluencyScore -= 1;
    if (pauseAnalysis.longestPause > 3) fluencyScore -= 1;
    
    fluencyScore = Math.max(0, Math.min(10, fluencyScore));
    
    return {
      wordsPerMinute,
      totalWords,
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      averageWordDuration: parseFloat(averageWordDuration.toFixed(3)),
      pauseAnalysis: {
        totalPauses: pauseAnalysis.totalPauses,
        averagePauseLength: parseFloat(pauseAnalysis.averagePauseLength.toFixed(2)),
        longestPause: parseFloat(pauseAnalysis.longestPause.toFixed(2))
      },
      fluencyScore: parseFloat(fluencyScore.toFixed(1))
    };
  }

  // Get empty result template
  getEmptyResult(provider) {
    return {
      provider,
      success: false,
      transcript: '',
      confidence: 0,
      words: [],
      error: 'No speech detected'
    };
  }

  // Get service status
  getServiceStatus() {
    return {
      // Free services
      localWhisper: localWhisper.isAvailable(),
      local: true, // Always available
      
      // Paid services
      google: !!this.googleClient,
      azure: !!this.azureConfig,
      openai: !!this.openaiClient,
      
      // Configuration status
      prefersFreeServices: process.env.USE_LOCAL_WHISPER === 'true',
      whisperStatus: localWhisper.getStatus()
    };
  }
}

module.exports = new SpeechToTextService();