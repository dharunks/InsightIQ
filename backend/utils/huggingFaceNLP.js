const { HfInference } = require('@huggingface/inference');

class HuggingFaceNLPService {
  constructor() {
    this.hf = null;
    this.initializeService();
    
    // Model configurations for different tasks
    this.models = {
      sentiment: {
        primary: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        fallback: 'nlptown/bert-base-multilingual-uncased-sentiment'
      },
      emotion: {
        primary: 'j-hartmann/emotion-english-distilroberta-base',
        fallback: 'SamLowe/roberta-base-go_emotions'
      },
      toxicity: {
        primary: 'unitary/toxic-bert',
        fallback: 'martin-ha/toxic-comment-model'
      },
      confidence: {
        primary: 'microsoft/DialoGPT-medium',
        fallback: 'facebook/blenderbot-400M-distill'
      },
      summarization: {
        primary: 'facebook/bart-large-cnn',
        fallback: 't5-small'
      },
      keywordExtraction: {
        primary: 'ml6team/keyphrase-extraction-kbir-inspec',
        fallback: 'dbmdz/bert-large-cased-finetuned-conll03-english'
      }
    };
  }

  async initializeService() {
    try {
      if (process.env.HUGGINGFACE_API_KEY) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        console.log('HuggingFace NLP Service initialized');
      } else {
        console.warn('HuggingFace API key not found. Using free tier with rate limits.');
        this.hf = new HfInference(); // Free tier
      }
    } catch (error) {
      console.error('Failed to initialize HuggingFace service:', error.message);
    }
  }

  // Advanced sentiment analysis with multiple models
  async analyzeSentiment(text, options = {}) {
    if (!this.hf) {
      return this.getFallbackSentimentAnalysis(text);
    }

    try {
      console.log('Analyzing sentiment with HuggingFace...');
      
      // Try primary model first
      const result = await this.hf.textClassification({
        model: this.models.sentiment.primary,
        inputs: text
      });

      // Process results
      const sentimentScores = {};
      result.forEach(item => {
        const label = item.label.toLowerCase();
        sentimentScores[label] = item.score;
      });

      // Normalize sentiment labels
      const normalizedSentiment = this.normalizeSentimentLabels(sentimentScores);

      return {
        provider: 'huggingface',
        model: this.models.sentiment.primary,
        success: true,
        sentiment: normalizedSentiment,
        confidence: Math.max(...Object.values(sentimentScores)),
        rawScores: sentimentScores,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
    } catch (error) {
      console.warn('Primary sentiment model failed, trying fallback...', error.message);
      return await this.analyzeSentimentFallback(text);
    }
  }

  // Fallback sentiment analysis
  async analyzeSentimentFallback(text) {
    try {
      const result = await this.hf.textClassification({
        model: this.models.sentiment.fallback,
        inputs: text
      });

      const sentimentScores = {};
      result.forEach(item => {
        sentimentScores[item.label.toLowerCase()] = item.score;
      });

      const normalizedSentiment = this.normalizeSentimentLabels(sentimentScores);

      return {
        provider: 'huggingface',
        model: this.models.sentiment.fallback,
        success: true,
        sentiment: normalizedSentiment,
        confidence: Math.max(...Object.values(sentimentScores)),
        rawScores: sentimentScores,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
    } catch (error) {
      console.error('Fallback sentiment analysis failed:', error.message);
      return this.getFallbackSentimentAnalysis(text);
    }
  }

  // Emotion detection
  async analyzeEmotion(text, options = {}) {
    if (!this.hf) {
      return this.getFallbackEmotionAnalysis(text);
    }

    try {
      console.log('Analyzing emotions with HuggingFace...');
      
      const result = await this.hf.textClassification({
        model: this.models.emotion.primary,
        inputs: text
      });

      // Process emotion results
      const emotions = {};
      let dominantEmotion = { label: 'neutral', score: 0 };

      result.forEach(item => {
        const emotion = item.label.toLowerCase();
        emotions[emotion] = item.score;
        
        if (item.score > dominantEmotion.score) {
          dominantEmotion = { label: emotion, score: item.score };
        }
      });

      return {
        provider: 'huggingface',
        model: this.models.emotion.primary,
        success: true,
        dominantEmotion: dominantEmotion,
        emotions: emotions,
        confidence: dominantEmotion.score,
        emotionalProfile: this.generateEmotionalProfile(emotions),
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
    } catch (error) {
      console.error('Emotion analysis failed:', error.message);
      return this.getFallbackEmotionAnalysis(text);
    }
  }

  // Toxicity and professionalism check
  async analyzeToxicity(text, options = {}) {
    if (!this.hf) {
      return this.getFallbackToxicityAnalysis(text);
    }

    try {
      console.log('Analyzing toxicity with HuggingFace...');
      
      const result = await this.hf.textClassification({
        model: this.models.toxicity.primary,
        inputs: text
      });

      const toxicityScores = {};
      let isToxic = false;
      let maxToxicityScore = 0;

      result.forEach(item => {
        const label = item.label.toLowerCase();
        toxicityScores[label] = item.score;
        
        if (label.includes('toxic') && item.score > 0.5) {
          isToxic = true;
          maxToxicityScore = Math.max(maxToxicityScore, item.score);
        }
      });

      // Calculate professionalism score (inverse of toxicity)
      const professionalismScore = Math.max(0, 10 - (maxToxicityScore * 10));

      return {
        provider: 'huggingface',
        model: this.models.toxicity.primary,
        success: true,
        isToxic: isToxic,
        toxicityScore: maxToxicityScore,
        professionalismScore: parseFloat(professionalismScore.toFixed(1)),
        categories: toxicityScores,
        recommendation: this.getToxicityRecommendation(maxToxicityScore),
        text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      };
    } catch (error) {
      console.error('Toxicity analysis failed:', error.message);
      return this.getFallbackToxicityAnalysis(text);
    }
  }

  // Advanced text summarization
  async summarizeText(text, options = {}) {
    if (!this.hf || text.length < 100) {
      return {
        provider: 'local',
        success: true,
        summary: text.length < 100 ? text : text.substring(0, 200) + '...',
        keyPoints: this.extractSimpleKeyPoints(text)
      };
    }

    try {
      console.log('Summarizing text with HuggingFace...');
      
      const maxLength = options.maxLength || Math.min(150, Math.floor(text.length / 4));
      const minLength = options.minLength || Math.min(50, Math.floor(maxLength / 3));

      const result = await this.hf.summarization({
        model: this.models.summarization.primary,
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: minLength,
          do_sample: false
        }
      });

      return {
        provider: 'huggingface',
        model: this.models.summarization.primary,
        success: true,
        summary: result.summary_text,
        originalLength: text.length,
        summaryLength: result.summary_text.length,
        compressionRatio: parseFloat((result.summary_text.length / text.length).toFixed(2)),
        keyPoints: await this.extractKeyPoints(text)
      };
    } catch (error) {
      console.error('Text summarization failed:', error.message);
      return {
        provider: 'local',
        success: true,
        summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        keyPoints: this.extractSimpleKeyPoints(text),
        error: 'Advanced summarization not available'
      };
    }
  }

  // Extract key points and keywords
  async extractKeyPoints(text, options = {}) {
    if (!this.hf) {
      return this.extractSimpleKeyPoints(text);
    }

    try {
      // Use keyword extraction model
      const result = await this.hf.tokenClassification({
        model: this.models.keywordExtraction.primary,
        inputs: text
      });

      // Process results to extract meaningful keywords
      const keywords = [];
      const entities = [];

      result.forEach(item => {
        if (item.score > 0.5) {
          if (item.entity.includes('KEY')) {
            keywords.push({
              word: item.word,
              confidence: item.score,
              position: { start: item.start, end: item.end }
            });
          } else {
            entities.push({
              entity: item.entity,
              word: item.word,
              confidence: item.score,
              position: { start: item.start, end: item.end }
            });
          }
        }
      });

      return {
        keywords: keywords.slice(0, 10), // Top 10 keywords
        entities: entities.slice(0, 10), // Top 10 entities
        topics: this.identifyTopics(keywords, entities)
      };
    } catch (error) {
      console.warn('Advanced keyword extraction failed, using simple method:', error.message);
      return this.extractSimpleKeyPoints(text);
    }
  }

  // Comprehensive text analysis combining all methods
  async analyzeComprehensive(text, options = {}) {
    try {
      console.log('Starting comprehensive NLP analysis...');
      
      const [sentiment, emotion, toxicity, summary] = await Promise.all([
        this.analyzeSentiment(text, options),
        this.analyzeEmotion(text, options),
        this.analyzeToxicity(text, options),
        this.summarizeText(text, options)
      ]);

      // Calculate overall communication score
      const communicationScore = this.calculateCommunicationScore({
        sentiment: sentiment.confidence,
        emotion: emotion.confidence,
        professionalism: toxicity.professionalismScore,
        clarity: this.assessClarity(text)
      });

      return {
        provider: 'huggingface-comprehensive',
        success: true,
        text: {
          original: text,
          wordCount: text.split(/\s+/).length,
          characterCount: text.length
        },
        sentiment: sentiment,
        emotion: emotion,
        toxicity: toxicity,
        summary: summary,
        communicationScore: communicationScore,
        recommendations: this.generateRecommendations({
          sentiment,
          emotion,
          toxicity,
          communicationScore
        }),
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Comprehensive analysis failed:', error.message);
      return {
        provider: 'huggingface-comprehensive',
        success: false,
        error: error.message,
        fallback: this.getFallbackComprehensiveAnalysis(text)
      };
    }
  }

  // Utility methods
  normalizeSentimentLabels(scores) {
    const normalized = { positive: 0, negative: 0, neutral: 0 };
    
    Object.keys(scores).forEach(label => {
      if (label.includes('pos') || label.includes('1') || label === 'label_2') {
        normalized.positive = Math.max(normalized.positive, scores[label]);
      } else if (label.includes('neg') || label.includes('0') || label === 'label_0') {
        normalized.negative = Math.max(normalized.negative, scores[label]);
      } else {
        normalized.neutral = Math.max(normalized.neutral, scores[label]);
      }
    });

    return normalized;
  }

  generateEmotionalProfile(emotions) {
    const profile = {
      primary: null,
      secondary: null,
      intensity: 'moderate',
      balance: 'balanced'
    };

    const sortedEmotions = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a);

    if (sortedEmotions.length >= 1) {
      profile.primary = sortedEmotions[0][0];
    }
    if (sortedEmotions.length >= 2) {
      profile.secondary = sortedEmotions[1][0];
    }

    // Determine intensity
    const maxScore = sortedEmotions[0]?.[1] || 0;
    if (maxScore > 0.8) profile.intensity = 'high';
    else if (maxScore < 0.4) profile.intensity = 'low';

    // Determine balance
    const topTwoSum = (sortedEmotions[0]?.[1] || 0) + (sortedEmotions[1]?.[1] || 0);
    if (topTwoSum < 0.6) profile.balance = 'scattered';
    else if (maxScore > 0.7) profile.balance = 'focused';

    return profile;
  }

  getToxicityRecommendation(score) {
    if (score < 0.1) return 'Excellent professional communication';
    if (score < 0.3) return 'Good professional tone with minor improvements possible';
    if (score < 0.5) return 'Consider using more professional language';
    if (score < 0.7) return 'Needs improvement in professional communication';
    return 'Requires significant improvement in professional tone';
  }

  extractSimpleKeyPoints(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    // Simple frequency analysis
    const wordCount = {};
    words.forEach(word => {
      if (word.length > 3 && !this.isStopWord(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const keywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => ({ word, confidence: 0.8 }));

    return {
      keywords,
      keyPoints: sentences.slice(0, 3),
      topics: keywords.slice(0, 3).map(k => k.word)
    };
  }

  identifyTopics(keywords, entities) {
    const topics = new Set();
    
    keywords.forEach(k => {
      if (k.confidence > 0.6) topics.add(k.word);
    });
    
    entities.forEach(e => {
      if (e.confidence > 0.6) topics.add(e.word);
    });

    return Array.from(topics).slice(0, 5);
  }

  calculateCommunicationScore(scores) {
    const weights = {
      sentiment: 0.25,
      emotion: 0.25,
      professionalism: 0.3,
      clarity: 0.2
    };

    const weightedScore = 
      (scores.sentiment * weights.sentiment) +
      (scores.emotion * weights.emotion) +
      (scores.professionalism * weights.professionalism) +
      (scores.clarity * weights.clarity);

    return {
      overall: parseFloat(weightedScore.toFixed(1)),
      breakdown: scores,
      interpretation: this.interpretCommunicationScore(weightedScore)
    };
  }

  interpretCommunicationScore(score) {
    if (score >= 8.5) return 'Excellent communication skills';
    if (score >= 7.5) return 'Very good communication with minor areas for improvement';
    if (score >= 6.5) return 'Good communication with some areas for development';
    if (score >= 5.5) return 'Adequate communication needing improvement';
    return 'Communication skills need significant development';
  }

  assessClarity(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(1, sentences.length);
    
    let clarityScore = 8; // Base score
    
    // Adjust based on sentence length
    if (avgWordsPerSentence > 25) clarityScore -= 1;
    if (avgWordsPerSentence < 8) clarityScore -= 0.5;
    
    // Check for clarity indicators
    const clarityIndicators = text.match(/\b(therefore|however|furthermore|moreover|additionally|consequently)\b/gi) || [];
    if (clarityIndicators.length > 0) clarityScore += 0.5;
    
    return Math.max(0, Math.min(10, clarityScore));
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Sentiment recommendations
    if (analysis.sentiment.sentiment.negative > 0.6) {
      recommendations.push('Consider using more positive language to convey enthusiasm');
    }
    
    // Emotion recommendations
    if (analysis.emotion.dominantEmotion.label === 'fear' || analysis.emotion.dominantEmotion.label === 'nervousness') {
      recommendations.push('Practice relaxation techniques to build confidence');
    }
    
    // Professionalism recommendations
    if (analysis.toxicity.professionalismScore < 7) {
      recommendations.push('Use more formal and professional language');
    }
    
    // Overall communication recommendations
    if (analysis.communicationScore.overall < 7) {
      recommendations.push('Focus on clear, concise communication with specific examples');
    }
    
    return recommendations;
  }

  // Fallback methods for when HuggingFace is not available
  getFallbackSentimentAnalysis(text) {
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
    const result = sentiment.analyze(text);
    
    const normalizedScore = Math.max(-1, Math.min(1, result.score / 10));
    const positive = Math.max(0, normalizedScore);
    const negative = Math.max(0, -normalizedScore);
    const neutral = 1 - Math.abs(normalizedScore);

    return {
      provider: 'local',
      success: true,
      sentiment: { positive, negative, neutral },
      confidence: 0.7,
      rawScores: { positive, negative, neutral }
    };
  }

  getFallbackEmotionAnalysis(text) {
    // Simple emotion detection based on keywords
    const emotionKeywords = {
      joy: ['happy', 'excited', 'pleased', 'satisfied', 'delighted'],
      sadness: ['sad', 'disappointed', 'upset', 'down', 'dejected'],
      anger: ['angry', 'frustrated', 'annoyed', 'irritated', 'furious'],
      fear: ['worried', 'anxious', 'nervous', 'concerned', 'afraid'],
      surprise: ['surprised', 'amazed', 'shocked', 'astonished'],
      disgust: ['disgusted', 'revolted', 'appalled', 'sickened']
    };

    const emotions = {};
    const lowerText = text.toLowerCase();

    Object.keys(emotionKeywords).forEach(emotion => {
      let score = 0;
      emotionKeywords[emotion].forEach(keyword => {
        if (lowerText.includes(keyword)) score += 0.3;
      });
      emotions[emotion] = Math.min(1, score);
    });

    const dominantEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0] || ['neutral', 0.5];

    return {
      provider: 'local',
      success: true,
      dominantEmotion: { label: dominantEmotion[0], score: dominantEmotion[1] },
      emotions,
      confidence: dominantEmotion[1]
    };
  }

  getFallbackToxicityAnalysis(text) {
    const toxicKeywords = ['stupid', 'idiot', 'hate', 'awful', 'terrible', 'worst'];
    const lowerText = text.toLowerCase();
    
    let toxicityScore = 0;
    toxicKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) toxicityScore += 0.2;
    });

    toxicityScore = Math.min(1, toxicityScore);
    const professionalismScore = Math.max(0, 10 - (toxicityScore * 10));

    return {
      provider: 'local',
      success: true,
      isToxic: toxicityScore > 0.3,
      toxicityScore,
      professionalismScore: parseFloat(professionalismScore.toFixed(1)),
      recommendation: this.getToxicityRecommendation(toxicityScore)
    };
  }

  getFallbackComprehensiveAnalysis(text) {
    return {
      sentiment: this.getFallbackSentimentAnalysis(text),
      emotion: this.getFallbackEmotionAnalysis(text),
      toxicity: this.getFallbackToxicityAnalysis(text),
      summary: {
        provider: 'local',
        success: true,
        summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        keyPoints: this.extractSimpleKeyPoints(text)
      }
    };
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return stopWords.includes(word.toLowerCase());
  }

  // Get service status
  getServiceStatus() {
    return {
      huggingface: !!this.hf,
      apiKeyConfigured: !!process.env.HUGGINGFACE_API_KEY,
      models: this.models
    };
  }
}

module.exports = new HuggingFaceNLPService();