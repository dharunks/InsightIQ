const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class LocalWhisperService {
  constructor() {
    this.isInitialized = false;
    this.whisperPath = null;
    this.modelPath = null;
    this.model = process.env.WHISPER_MODEL || 'base';
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🔍 Searching for Whisper installation...');
      
      // First, try the most direct approach which works on Windows
      const directWhisperCheck = await this.testWhisperCommand('whisper');
      if (directWhisperCheck) {
        this.whisperPath = 'whisper';
        this.isInitialized = true;
        console.log('✅ Local Whisper found and initialized: whisper');
        return;
      }
      
      // Try python module approach which is common on Windows
      const pythonWhisperCheck = await this.testWhisperCommand('python -m whisper');
      if (pythonWhisperCheck) {
        this.whisperPath = 'python -m whisper';
        this.isInitialized = true;
        console.log('✅ Local Whisper found and initialized via Python module');
        return;
      }

      console.warn('⚠️  Local Whisper not found. Install with: pip install openai-whisper');
      console.warn('💡 Make sure Python and pip are in your PATH, then restart the server.');
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to initialize local Whisper:', error.message);
      this.isInitialized = false;
    }
  }

  async testWhisperCommand(whisperPath) {
    return new Promise((resolve) => {
      // Parse the command properly
      let command, args;
      if (whisperPath.includes('python')) {
        const parts = whisperPath.split(' ');
        command = parts[0]; // 'python' or 'python3'
        args = parts.slice(1).concat(['--help']); // ['-m', 'whisper', '--help']
      } else {
        command = whisperPath;
        args = ['--help'];
      }
      
      console.log(`Testing Whisper command: ${command} ${args.join(' ')}`);
      
      const process = spawn(command, args, { shell: true });
      
      let hasOutput = false;
      let outputText = '';
      
      process.stdout.on('data', (data) => {
        const text = data.toString();
        outputText += text;
        // Check if output contains whisper-related content
        if (text.toLowerCase().includes('whisper') || 
            text.toLowerCase().includes('usage') ||
            text.toLowerCase().includes('audio file') ||
            text.toLowerCase().includes('transcribe') ||
            text.includes('--model') ||
            text.includes('--help')) {
          hasOutput = true;
        }
      });
      
      process.stderr.on('data', (data) => {
        const text = data.toString();
        outputText += text;
        // Some systems output help to stderr
        if (text.toLowerCase().includes('whisper') || 
            text.toLowerCase().includes('usage') ||
            text.toLowerCase().includes('audio file') ||
            text.toLowerCase().includes('transcribe') ||
            text.includes('--model') ||
            text.includes('--help')) {
          hasOutput = true;
        }
      });
      
      process.on('close', (code) => {
        console.log(`Whisper test result: code=${code}, hasOutput=${hasOutput}`);
        if (hasOutput) {
          console.log(`Output preview: ${outputText.substring(0, 200)}...`);
        }
        // Accept if we have relevant output, even with error codes
        // This handles cases where Whisper exists but CLI has issues
        resolve(hasOutput);
      });
      
      process.on('error', (error) => {
        console.log(`Whisper test error: ${error.message}`);
        resolve(false);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        process.kill();
        console.log('Whisper test timeout');
        resolve(false);
      }, 10000);
    });
  }

  async transcribe(audioBuffer, options = {}) {
    if (!this.isInitialized) {
      return this.getFallbackResult('Local Whisper not available');
    }

    try {
      // Save audio buffer to temporary file
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempAudioPath = path.join(tempDir, `audio_${Date.now()}.webm`);
      const outputDir = path.join(tempDir, `output_${Date.now()}`);
      
      await fs.writeFile(tempAudioPath, audioBuffer);
      await fs.mkdir(outputDir, { recursive: true });

      console.log('Transcribing with local Whisper...');
      
      // Run Whisper command
      const result = await this.runWhisperCommand(tempAudioPath, outputDir, options);
      
      // Cleanup temp files
      try {
        await fs.unlink(tempAudioPath);
        await fs.rmdir(outputDir, { recursive: true });
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError.message);
      }

      return result;
    } catch (error) {
      console.error('Local Whisper transcription error:', error.message);
      return this.getFallbackResult(error.message);
    }
  }

  async runWhisperCommand(audioPath, outputDir, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        audioPath,
        '--model', this.model,
        '--output_dir', outputDir,
        '--output_format', 'json',
        '--language', options.languageCode?.split('-')[0] || 'en'
      ];

      // Add task parameter if specified
      if (options.task) {
        args.push('--task', options.task);
      }

      const whisperProcess = spawn(this.whisperPath, args, { 
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      whisperProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      whisperProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      whisperProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`Whisper process failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Read the generated JSON file
          const audioFilename = path.basename(audioPath, path.extname(audioPath));
          const jsonPath = path.join(outputDir, `${audioFilename}.json`);
          
          const jsonContent = await fs.readFile(jsonPath, 'utf8');
          const whisperResult = JSON.parse(jsonContent);

          // Process Whisper output
          const result = this.processWhisperOutput(whisperResult);
          resolve(result);
        } catch (parseError) {
          console.error('Error parsing Whisper output:', parseError.message);
          // Try to extract text from stdout as fallback
          const textMatch = stdout.match(/\[.*?\]\s*(.+)/);
          const transcript = textMatch ? textMatch[1].trim() : '';
          
          resolve({
            provider: 'local-whisper',
            success: !!transcript,
            transcript: transcript,
            confidence: transcript ? 0.9 : 0,
            words: [],
            metadata: {
              model: this.model,
              fallback: true,
              rawOutput: stdout
            }
          });
        }
      });

      whisperProcess.on('error', (error) => {
        reject(new Error(`Failed to start Whisper process: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        whisperProcess.kill();
        reject(new Error('Whisper transcription timeout'));
      }, 300000); // 5 minute timeout
    });
  }

  processWhisperOutput(whisperResult) {
    const transcript = whisperResult.text || '';
    const segments = whisperResult.segments || [];
    
    // Extract word-level information if available
    const words = [];
    segments.forEach(segment => {
      if (segment.words) {
        segment.words.forEach(word => {
          words.push({
            word: word.word,
            startTime: word.start,
            endTime: word.end,
            confidence: word.probability || 0.9 // Whisper doesn't always provide probability
          });
        });
      }
    });

    // Calculate average confidence
    const avgConfidence = words.length > 0 
      ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
      : 0.9; // Default high confidence for Whisper

    return {
      provider: 'local-whisper',
      success: true,
      transcript: transcript.trim(),
      confidence: avgConfidence,
      words: words,
      segments: segments,
      metadata: {
        model: this.model,
        language: whisperResult.language,
        duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
        wordCount: transcript.trim().split(/\s+/).length
      }
    };
  }

  getFallbackResult(errorMessage) {
    return {
      provider: 'local-whisper',
      success: false,
      error: errorMessage,
      transcript: '',
      confidence: 0,
      words: [],
      metadata: {
        model: this.model,
        fallback: true,
        installationHelp: 'Install Whisper with: pip install openai-whisper'
      }
    };
  }

  // Check if local Whisper is available
  isAvailable() {
    return this.isInitialized;
  }

  // Get installation instructions
  getInstallationInstructions() {
    return {
      title: 'Install Local Whisper (Free Speech-to-Text)',
      requirements: [
        'Python 3.7 or higher',
        'pip package manager',
        'FFmpeg (for audio processing)'
      ],
      steps: [
        '1. Install Python from https://python.org',
        '2. Install FFmpeg from https://ffmpeg.org',
        '3. Install Whisper: pip install openai-whisper',
        '4. Test installation: whisper --help',
        '5. Restart the backend server'
      ],
      models: {
        tiny: 'Fastest, lowest quality (~1GB VRAM)',
        base: 'Good balance of speed and quality (~1GB VRAM)',
        small: 'Better quality, slower (~2GB VRAM)',
        medium: 'High quality (~5GB VRAM)',
        large: 'Best quality, slowest (~10GB VRAM)'
      },
      notes: [
        'First run will download the model (~100MB-3GB depending on model)',
        'Larger models provide better accuracy but are slower',
        'Completely free and runs offline'
      ]
    };
  }

  // Get service status
  getStatus() {
    return {
      available: this.isInitialized,
      whisperPath: this.whisperPath,
      model: this.model,
      installationInstructions: this.isInitialized ? null : this.getInstallationInstructions()
    };
  }
}

module.exports = new LocalWhisperService();