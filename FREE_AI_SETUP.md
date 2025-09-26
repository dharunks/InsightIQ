# Free AI Services Setup Guide

This guide helps you set up **completely free** alternatives to paid services like Google Cloud Speech-to-Text and Azure Speech Service.

## 🎯 Current Setup (Free Services)

Your application is already configured to use free services:

### ✅ Speech-to-Text: Local Whisper (Free)
- **Status**: Enabled in `.env` with `USE_LOCAL_WHISPER=true`
- **Cost**: Completely free
- **Quality**: Excellent (OpenAI's state-of-the-art model)
- **Privacy**: Runs locally, no data sent to cloud

### ✅ Sentiment Analysis: Hugging Face (Free)
- **Status**: Already configured and working
- **Cost**: Free tier available
- **Quality**: High-quality transformer models
- **API Key**: Optional (you have one configured)

## 🚀 Quick Setup Instructions

### 1. Install Local Whisper (Speech-to-Text)

**Prerequisites:**
- Python 3.7+ (Download from [python.org](https://python.org))
- pip (comes with Python)

**Installation:**
```bash
# Install Whisper
pip install openai-whisper

# Install FFmpeg (required for audio processing)
# Windows (using chocolatey):
choco install ffmpeg
# OR download from: https://ffmpeg.org/download.html

# macOS:
brew install ffmpeg

# Linux:
sudo apt install ffmpeg
```

**Test Installation:**
```bash
whisper --help
```

**Available Models:**
- `tiny` - Fastest, 39 MB download
- `base` - Good balance, 74 MB download ⭐ **Recommended**
- `small` - Better quality, 244 MB download
- `medium` - High quality, 769 MB download
- `large` - Best quality, 1550 MB download

### 2. Verify Hugging Face Setup

Your Hugging Face setup is already working! The application uses:
- **Free tier**: Works without API key
- **Your API key**: `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` (already configured)

## 🔧 Configuration Details

### Current Environment Variables

```env
# Speech-to-Text (Free)
USE_LOCAL_WHISPER=true
WHISPER_MODEL=base

# Sentiment Analysis (Free/Paid hybrid)
HUGGINGFACE_API_KEY=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

# Paid services (disabled)
# GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
# AZURE_SPEECH_KEY=your-azure-speech-key
```

### Service Priority Order

The application tries services in this order:
1. **Local Whisper** (Free) ⭐
2. **OpenAI Whisper API** (Paid, if API key provided)
3. **Google Speech-to-Text** (Paid, if credentials provided)
4. **Azure Speech Service** (Paid, if key provided)
5. **Local Fallback** (Basic placeholder)

## 🎬 How It Works

### Speech-to-Text Flow:
1. **Audio Recording**: User records audio/video in browser
2. **Local Processing**: Audio sent to your local Whisper installation
3. **Transcription**: Whisper processes audio completely offline
4. **Analysis**: Hugging Face analyzes the transcribed text
5. **Results**: User gets comprehensive feedback

### Sentiment Analysis Flow:
1. **Text Input**: From speech transcription or typed responses
2. **HuggingFace Processing**: Multiple AI models analyze:
   - Sentiment (positive/negative/neutral)
   - Emotions (joy, sadness, anger, etc.)
   - Professionalism score
   - Communication clarity
3. **Comprehensive Report**: User gets detailed feedback

## 🚨 Troubleshooting

### Whisper Installation Issues

**Problem**: `whisper: command not found`
**Solution**: 
```bash
# Try these alternatives:
python -m whisper --help
python3 -m whisper --help
pip install --upgrade openai-whisper
```

**Problem**: `FFmpeg not found`
**Solution**: Install FFmpeg:
- Windows: Download from https://ffmpeg.org/download.html
- Add FFmpeg to your system PATH

**Problem**: Model download fails
**Solution**: 
```bash
# Pre-download the model:
whisper --model base --help
```

### HuggingFace Issues

**Problem**: Rate limiting
**Solution**: The app has fallback mechanisms and your API key should provide higher limits

**Problem**: Model loading fails
**Solution**: The app automatically falls back to simpler models

## ✨ Advantages of This Setup

### Cost Comparison:
- **Google Speech-to-Text**: ~$0.006 per 15 seconds
- **Azure Speech Service**: ~$1.00 per hour
- **Local Whisper**: **FREE** ✅

### Privacy Benefits:
- **Local Processing**: Audio never leaves your server
- **No Cloud Dependencies**: Works offline
- **Data Control**: Your interview data stays private

### Quality Benefits:
- **Whisper**: State-of-the-art accuracy (often better than paid services)
- **HuggingFace**: Access to latest transformer models
- **Multi-language**: Supports 99+ languages

## 🔄 Testing Your Setup

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check the logs** for:
   ```
   ✅ Local Whisper (Free) enabled
   ✅ HuggingFace NLP Service initialized
   ```

3. **Test interview recording**:
   - Create a new interview
   - Record audio/video response
   - Check if transcription works

4. **Monitor console** for transcription attempts:
   ```
   Available speech providers (free first): local-whisper, local
   Attempting transcription with local-whisper...
   Transcription successful with local-whisper
   ```

## 🎯 Next Steps

1. **Install Whisper** following the instructions above
2. **Restart your backend server**
3. **Test with a short interview**
4. **Enjoy free, high-quality AI analysis!**

## 📞 Need Help?

If you encounter issues:
1. Check the backend console for error messages
2. Verify Python and pip installation: `python --version` and `pip --version`
3. Test Whisper directly: `whisper audio_file.wav`
4. The application will fall back to text-only analysis if speech-to-text fails

---

**Remember**: This setup gives you professional-quality AI analysis completely free, with the privacy benefit of local processing!