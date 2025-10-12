const Sentiment = require('sentiment');
const simpleMediaAnalyzer = require('./simpleMediaAnalysis');
const path = require('path');
const fs = require('fs').promises;

// Advanced sentiment analysis with multiple metrics
class SentimentAnalyzer {
  constructor() {
    this.sentiment = new Sentiment();
    
    // Custom words for interview context
    this.interviewWords = {
      'confident': 3,
      'excited': 3,
      'passionate': 3,
      'experienced': 2,
      'skilled': 2,
      'motivated': 2,
      'enthusiastic': 3,
      'dedicated': 2,
      'professional': 2,
      'capable': 2,
      'nervous': -2,
      'unsure': -2,
      'confused': -2,
      'worried': -2,
      'anxious': -2,
      'uncertain': -1,
      'hesitant': -1
    };
  }

  // Analyze text sentiment with detailed metrics
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return this.getDefaultAnalysis();
    }

    // Basic sentiment analysis
    const result = this.sentiment.analyze(text);
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    // Apply custom interview-specific words
    let customScore = result.score;
    for (const [word, score] of Object.entries(this.interviewWords)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        customScore += matches.length * score;
      }
    }

    // Calculate confidence indicators
    const confidenceKeywords = [
      'confident', 'sure', 'certain', 'definitely', 'absolutely',
      'experienced', 'skilled', 'capable', 'proficient', 'expert'
    ];
    
    const uncertaintyKeywords = [
      'maybe', 'perhaps', 'might', 'possibly', 'probably',
      'i think', 'i guess', 'not sure', 'unsure', 'uncertain'
    ];

    const fillerWords = [
      'um', 'uh', 'er', 'like', 'you know', 'actually',
      'basically', 'literally', 'sort of', 'kind of'
    ];

    // Count occurrences
    const confidenceCount = this.countKeywords(text, confidenceKeywords);
    const uncertaintyCount = this.countKeywords(text, uncertaintyKeywords);
    const fillerCount = this.countKeywords(text, fillerWords);

    // Normalize sentiment score to 0-1 range
    const normalizedScore = Math.max(0, Math.min(1, (customScore + 10) / 20));
    
    // Calculate confidence score (0-10) based on actual text content
    // Start with a dynamic baseline based on text length and sentiment
    const textLengthFactor = Math.min(1, Math.max(0.3, wordCount / 100)); // Normalize by expected word count
    let confidenceScore = 5 * textLengthFactor * (0.7 + normalizedScore * 0.3); // Dynamic baseline
    
    // Adjust based on confidence indicators
    confidenceScore += confidenceCount * 0.5;
    confidenceScore -= uncertaintyCount * 0.5; // Increased penalty for uncertainty
    confidenceScore -= (fillerCount / Math.max(1, wordCount)) * 15; // Increased penalty for fillers
    
    // Add slight randomness to avoid identical scores (±0.5)
    confidenceScore += (Math.random() - 0.5);
    confidenceScore = Math.max(0, Math.min(10, confidenceScore));

    // Calculate clarity score based on structure and filler words
    // First, detect nonsensical or random text
    const realWordPattern = /\b[a-z]{3,}\b/g;
    const realWords = text.toLowerCase().match(realWordPattern) || [];
    const realWordRatio = realWords.length / Math.max(1, wordCount);
    
    let clarityScore;
    
    // If text appears to be nonsensical (few real words or very short)
    if (text.length < 15 || realWordRatio < 0.5 || realWords.length < 2) {
      clarityScore = 2.0; // Very low clarity score for nonsensical text
    } else {
      // Dynamic baseline based on text structure
      const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const avgWordsPerSentence = wordCount / Math.max(1, sentenceCount);
      const sentenceStructureFactor = Math.min(1, Math.max(0.5, 20 / Math.max(1, avgWordsPerSentence))); // Optimal ~15-20 words per sentence
      
      clarityScore = 7 * sentenceStructureFactor; // Dynamic baseline
      
      // Apply penalties with safeguards against extreme values
      const fillerPenalty = Math.min(5, (fillerCount / Math.max(1, wordCount)) * 25); // Cap filler penalty at 5
      const uncertaintyPenalty = Math.min(3, uncertaintyCount * 0.3); // Cap uncertainty penalty at 3
      
      clarityScore -= fillerPenalty;
      clarityScore -= uncertaintyPenalty;
      
      // Add slight randomness to avoid identical scores (±0.5)
      clarityScore += (Math.random() - 0.5);
    }
    
    // Ensure score is within valid range
    clarityScore = Math.max(0, Math.min(10, clarityScore));

    // Determine emotional tone
    const positivity = Math.max(0, customScore / Math.max(1, Math.abs(customScore)));
    const negativity = Math.max(0, -customScore / Math.max(1, Math.abs(customScore)));
    const neutrality = 1 - Math.abs(customScore / Math.max(1, Math.abs(customScore)));

    return {
      sentiment: {
        overall: this.normalizeToRange(customScore, -10, 10, -1, 1),
        confidence: normalizedScore,
        positivity: positivity,
        negativity: negativity,
        neutrality: neutrality
      },
      communication: {
        clarity: parseFloat(clarityScore.toFixed(1)),
        fluency: this.calculateFluency(text, fillerCount),
        pace: this.determinePace(wordCount, text.length),
        fillerWords: fillerCount,
        wordCount: wordCount
      },
      confidence: {
        score: parseFloat(confidenceScore.toFixed(1)),
        indicators: this.getConfidenceIndicators(confidenceCount, uncertaintyCount, fillerCount),
        improvements: this.getImprovementSuggestions(confidenceScore, clarityScore, fillerCount)
      },
      keywords: this.extractKeywords(text),
      suggestedImprovements: this.generateImprovements(confidenceScore, clarityScore, fillerCount, wordCount)
    };
  }

  // Helper methods
  countKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  normalizeToRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  calculateFluency(text, fillerWords) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = text.split(/\s+/).length / Math.max(1, sentences.length);
    
    let fluencyScore = 7; // baseline
    fluencyScore += Math.min(2, (avgWordsPerSentence - 10) / 5); // optimal 10-15 words per sentence
    fluencyScore -= (fillerWords / text.split(/\s+/).length) * 10;
    
    return Math.max(0, Math.min(10, parseFloat(fluencyScore.toFixed(1))));
  }

  determinePace(wordCount, textLength) {
    const avgWordLength = textLength / Math.max(1, wordCount);
    
    if (wordCount < 50 || avgWordLength > 6) return 'slow';
    if (wordCount > 150 || avgWordLength < 4) return 'fast';
    return 'normal';
  }

  getConfidenceIndicators(confidenceCount, uncertaintyCount, fillerCount) {
    const indicators = [];
    
    if (confidenceCount > 2) indicators.push('Uses confident language');
    if (uncertaintyCount > 3) indicators.push('Shows uncertainty in responses');
    if (fillerCount > 5) indicators.push('Frequent use of filler words');
    if (confidenceCount > uncertaintyCount) indicators.push('Generally confident tone');
    
    return indicators;
  }

  getImprovementSuggestions(confidenceScore, clarityScore, fillerCount) {
    const suggestions = [];
    
    if (confidenceScore < 6) {
      suggestions.push('Use more assertive language');
      suggestions.push('Practice expressing your accomplishments confidently');
    }
    
    if (clarityScore < 7) {
      suggestions.push('Structure your answers more clearly');
      suggestions.push('Use specific examples to support your points');
    }
    
    if (fillerCount > 3) {
      suggestions.push('Reduce filler words like "um" and "uh"');
      suggestions.push('Pause briefly instead of using filler words');
    }
    
    return suggestions;
  }

  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top 5 most frequent keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  isStopWord(word) {
    const stopWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  generateImprovements(confidenceScore, clarityScore, fillerCount, wordCount) {
    const improvements = [];
    
    if (confidenceScore < 7) {
      improvements.push('Practice speaking with more conviction about your achievements');
      improvements.push('Use action words to describe your experiences');
    }
    
    if (clarityScore < 7) {
      improvements.push('Use the STAR method (Situation, Task, Action, Result) for storytelling');
      improvements.push('Practice organizing your thoughts before speaking');
    }
    
    if (fillerCount / wordCount > 0.05) {
      improvements.push('Record yourself practicing to identify filler word patterns');
      improvements.push('Take brief pauses to collect your thoughts instead of using fillers');
    }
    
    if (wordCount < 30) {
      improvements.push('Provide more detailed examples to support your answers');
      improvements.push('Elaborate on your experiences with specific details');
    }
    
    return improvements;
  }

  getDefaultAnalysis() {
    return {
      sentiment: {
        overall: 0,
        confidence: 0,
        positivity: 0,
        negativity: 0,
        neutrality: 0
      },
      communication: {
        clarity: 0,
        fluency: 0,
        pace: 'none',
        fillerWords: 0,
        wordCount: 0
      },
      confidence: {
        score: 0,
        indicators: [],
        improvements: ['Provide a response to get detailed feedback']
      },
      keywords: [],
      suggestedImprovements: ['Please provide a valid response with speech content to analyze']
    };
  }

  // Analyze multimedia response (text + audio/video)
  async analyzeMultimediaResponse(textResponse, mediaFile = null, mediaType = null) {
    try {
      // Start with text analysis
      const textAnalysis = this.analyzeText(textResponse);
      
      // If no media file or type provided, return text-only analysis
      if (!mediaFile || !mediaType) {
        console.log('No media file or type provided, using text-only analysis');
        return {
          ...textAnalysis,
          mediaAnalysis: null,
          overallScore: this.calculateOverallScore(textAnalysis)
        };
      }

      // Validate media file path
      try {
        const fs = require('fs').promises;
        await fs.access(mediaFile);
        console.log(`Media file validated: ${mediaFile}`);
      } catch (accessError) {
        console.error(`Media file not accessible: ${mediaFile}`, accessError.message);
        return {
          ...textAnalysis,
          mediaAnalysis: {
            type: mediaType,
            duration: 0,
            quality: 5,
            error: `Media file not accessible: ${accessError.message}`
          },
          overallScore: this.calculateOverallScore(textAnalysis)
        };
      }

      let mediaAnalysis = null;
      
      try {
        // Analyze media based on type
        if (mediaType === 'video') {
          console.log(`Analyzing video file: ${mediaFile}`);
          mediaAnalysis = await simpleMediaAnalyzer.analyzeVideo(mediaFile);
        } else if (mediaType === 'audio') {
          console.log(`Analyzing audio file: ${mediaFile}`);
          mediaAnalysis = await simpleMediaAnalyzer.analyzeAudio(mediaFile);
        } else {
          console.warn(`Unsupported media type: ${mediaType}`);
          throw new Error(`Unsupported media type: ${mediaType}`);
        }
      } catch (mediaAnalysisError) {
        console.warn('Media analysis failed, using text-only analysis:', mediaAnalysisError.message);
        // Return text analysis with minimal media info
        return {
          ...textAnalysis,
          mediaAnalysis: {
            type: mediaType,
            duration: 0,
            quality: 5,
            error: `Media analysis failed: ${mediaAnalysisError.message}`
          },
          overallScore: this.calculateOverallScore(textAnalysis)
        };
      }

      // Combine text and media analysis
      const combinedAnalysis = this.combineAnalyses(textAnalysis, mediaAnalysis, mediaType);
      
      return {
        ...combinedAnalysis,
        mediaAnalysis,
        overallScore: this.calculateOverallScore(combinedAnalysis, mediaAnalysis)
      };
    } catch (error) {
      console.error('Error in multimedia analysis:', error);
      // Fallback to text-only analysis
      const textAnalysis = this.analyzeText(textResponse);
      return {
        ...textAnalysis,
        mediaAnalysis: null,
        error: `Multimedia analysis failed: ${error.message}`,
        overallScore: this.calculateOverallScore(textAnalysis)
      };
    }
  }

  // Combine text and media analyses
  combineAnalyses(textAnalysis, mediaAnalysis, mediaType) {
    if (!mediaAnalysis) return textAnalysis;

    const combined = { ...textAnalysis };

    // Check if media analysis indicates empty or invalid audio
    if (mediaAnalysis.overall && mediaAnalysis.overall.quality === 0) {
      // Return zero scores for empty audio
      combined.communication.clarity = 0;
      combined.confidence.score = 0;
      combined.communication.fluency = 0;
      combined.communication.wordCount = 0;
      combined.suggestedImprovements = ['Please provide a valid audio recording with speech content'];
      return combined;
    }

    // Fix word count for audio/video responses - use transcribed text if available
    if (mediaAnalysis.transcription && mediaAnalysis.transcription.transcript) {
      const transcribedText = mediaAnalysis.transcription.transcript.trim();
      const transcribedWordCount = transcribedText.split(/\s+/).filter(word => word.length > 0).length;
      
      // Update word count with the actual transcribed words
      combined.communication.wordCount = transcribedWordCount;
      
      // If text response is empty or minimal, use transcribed text for analysis
      if (!textAnalysis.communication.wordCount || textAnalysis.communication.wordCount < 5) {
        const transcriptAnalysis = this.analyzeText(transcribedText);
        combined.communication.clarity = transcriptAnalysis.communication.clarity;
        combined.communication.fluency = transcriptAnalysis.communication.fluency;
        combined.communication.fillerWords = transcriptAnalysis.communication.fillerWords;
        combined.confidence.score = transcriptAnalysis.confidence.score;
        combined.keywords = transcriptAnalysis.keywords;
        combined.suggestedImprovements = transcriptAnalysis.suggestedImprovements;
      }
    }

    // Enhance communication scores with media data
    if (mediaType === 'video' && mediaAnalysis.nonVerbal) {
      // Factor in non-verbal communication
      combined.communication.clarity = this.weightedAverage(
        combined.communication.clarity, 0.6,
        mediaAnalysis.nonVerbal.overallPresence, 0.4
      );
      
      // Add video-specific metrics
      combined.nonVerbal = {
        eyeContact: mediaAnalysis.nonVerbal.eyeContact,
        posture: mediaAnalysis.nonVerbal.posture,
        overallPresence: mediaAnalysis.nonVerbal.overallPresence,
        videoQuality: mediaAnalysis.nonVerbal.videoQuality
      };
    }

    if (mediaAnalysis.speech || mediaAnalysis.audio) {
      const speechData = mediaAnalysis.speech || mediaAnalysis.audio;
      
      // Update pace based on actual audio analysis
      if (speechData.pace) {
        combined.communication.pace = speechData.pace;
      }
      
      // Adjust clarity based on audio quality
      if (speechData.clarityScore) {
        combined.communication.clarity = this.weightedAverage(
          combined.communication.clarity, 0.7,
          speechData.clarityScore, 0.3
        );
      }

      // Add speaking rate
      if (speechData.estimatedWPM) {
        combined.communication.wordsPerMinute = speechData.estimatedWPM;
      }
    }

    // Update confidence score based on media analysis
    if (mediaType === 'video' && mediaAnalysis.nonVerbal) {
      combined.confidence.score = this.weightedAverage(
        combined.confidence.score, 0.6,
        mediaAnalysis.nonVerbal.overallPresence, 0.4
      );
      
      // Add video-specific improvements
      const videoImprovements = this.getVideoImprovements(mediaAnalysis.nonVerbal);
      combined.suggestedImprovements = [
        ...combined.suggestedImprovements,
        ...videoImprovements
      ];
    }

    // Add media duration
    if (mediaAnalysis.overall && mediaAnalysis.overall.duration) {
      combined.mediaDuration = mediaAnalysis.overall.duration;
    }

    return combined;
  }

  // Calculate weighted average
  weightedAverage(value1, weight1, value2, weight2) {
    return parseFloat(((value1 * weight1) + (value2 * weight2)).toFixed(1));
  }

  // Get video-specific improvement suggestions
  getVideoImprovements(nonVerbalData) {
    const improvements = [];
    
    if (nonVerbalData.eyeContact && nonVerbalData.eyeContact.score < 7) {
      improvements.push('Maintain better eye contact by looking directly at the camera');
    }
    
    if (nonVerbalData.posture && nonVerbalData.posture.score < 7) {
      improvements.push('Improve posture by sitting up straight and keeping shoulders back');
    }
    
    if (nonVerbalData.videoQuality < 6) {
      improvements.push('Consider improving lighting and camera quality for better video presentation');
    }
    
    return improvements;
  }

  // Calculate overall multimedia score based on performance
  calculateOverallScore(analysis, mediaAnalysis = null) {
    // Performance-based text score with higher weight on confidence and clarity
    const textScore = (
      analysis.confidence.score * 0.4 +
      analysis.communication.clarity * 0.4 +
      analysis.communication.fluency * 0.2
    );

    if (!mediaAnalysis) {
      // Add slight randomness to avoid identical scores (±0.3)
      const randomFactor = (Math.random() - 0.5) * 0.6;
      return parseFloat((textScore + randomFactor).toFixed(1));
    }

    let mediaScore = 0;
    let mediaWeight = 0;

    // Include non-verbal performance metrics with higher weight
    if (mediaAnalysis.nonVerbal) {
      // Prioritize presence and posture as key performance indicators
      const presenceScore = mediaAnalysis.nonVerbal.overallPresence || 0;
      const postureScore = mediaAnalysis.nonVerbal.posture?.score || 0;
      const eyeContactScore = mediaAnalysis.nonVerbal.eyeContact?.score || 0;
      
      // Weight presence more heavily as it's a critical performance factor
      mediaScore += (presenceScore * 0.5) + (postureScore * 0.25) + (eyeContactScore * 0.25);
      mediaWeight += 1;
    }

    // Include speech performance metrics
    if (mediaAnalysis.speech && mediaAnalysis.speech.clarityScore) {
      mediaScore += mediaAnalysis.speech.clarityScore;
      mediaWeight += 1;
    }

    if (mediaWeight > 0) {
      mediaScore /= mediaWeight;
      // Adjust weights to emphasize performance (70% text, 30% media)
      return parseFloat(this.weightedAverage(textScore, 0.7, mediaScore, 0.3).toFixed(1));
    }

    return parseFloat(textScore.toFixed(1));
  }

  // Generate comprehensive feedback based on performance metrics
  generateComprehensiveFeedback(analysis, mediaAnalysis = null) {
    const feedback = {
      strengths: [...(analysis.strengths || [])],
      improvements: [...(analysis.suggestedImprovements || [])],
      summary: '',
      scores: {
        confidence: analysis.confidence?.score || 0,
        clarity: analysis.communication?.clarity || 0,
        fluency: analysis.communication?.fluency || 0
      },
      performanceMetrics: {
        contentQuality: 0,
        deliveryEffectiveness: 0,
        overallImpression: 0
      }
    };

    // Calculate content quality based on confidence and clarity
    feedback.performanceMetrics.contentQuality = 
      ((analysis.confidence?.score || 0) * 0.6) + 
      ((analysis.communication?.clarity || 0) * 0.4);
    
    // Calculate delivery effectiveness
    let deliveryScore = analysis.communication?.fluency || 0;
    
    // Add media-specific feedback and performance metrics
    if (mediaAnalysis) {
      if (mediaAnalysis.nonVerbal) {
        feedback.scores.presence = mediaAnalysis.nonVerbal.overallPresence || 0;
        feedback.scores.eyeContact = mediaAnalysis.nonVerbal.eyeContact?.score || 0;
        feedback.scores.posture = mediaAnalysis.nonVerbal.posture?.score || 0;
        
        // Add performance-based strengths
        if ((mediaAnalysis.nonVerbal.eyeContact?.score || 0) >= 8) {
          feedback.strengths.push('Excellent eye contact demonstrates confidence and engagement');
        }
        if ((mediaAnalysis.nonVerbal.posture?.score || 0) >= 8) {
          feedback.strengths.push('Professional posture enhances your credibility');
        }
        
        // Factor non-verbal cues into delivery effectiveness
        deliveryScore = (
          (deliveryScore * 0.4) + 
          (mediaAnalysis.nonVerbal.overallPresence * 0.3) + 
          (mediaAnalysis.nonVerbal.eyeContact?.score || 0) * 0.15 + 
          (mediaAnalysis.nonVerbal.posture?.score || 0) * 0.15
        );
      }

      if (mediaAnalysis.speech) {
        feedback.scores.speechClarity = mediaAnalysis.speech.clarityScore || 0;
        feedback.scores.speakingPace = mediaAnalysis.speech.estimatedWPM || 0;
        
        // Add performance-based strengths for speech
        if (mediaAnalysis.speech.pace === 'normal') {
          feedback.strengths.push('Well-paced delivery enhances audience comprehension');
        }
        
        // Factor speech metrics into delivery effectiveness
        if (mediaAnalysis.speech.clarityScore) {
          deliveryScore = (deliveryScore * 0.7) + (mediaAnalysis.speech.clarityScore * 0.3);
        }
      }
    }
    
    feedback.performanceMetrics.deliveryEffectiveness = parseFloat(deliveryScore.toFixed(1));
    
    // Calculate overall impression (weighted combination of content and delivery)
    feedback.performanceMetrics.overallImpression = parseFloat(
      ((feedback.performanceMetrics.contentQuality * 0.6) + 
       (feedback.performanceMetrics.deliveryEffectiveness * 0.4)).toFixed(1)
    );

    // Generate performance-based summary
    const overallScore = feedback.performanceMetrics.overallImpression;
    
    if (overallScore >= 8.5) {
      feedback.summary = 'Outstanding performance with exceptional communication skills and professional presence. Your content was well-structured and delivery was highly effective.';
    } else if (overallScore >= 7.5) {
      feedback.summary = 'Strong performance with effective communication skills. Your content was clear and your delivery was engaging, with only minor areas for improvement.';
    } else if (overallScore >= 6.5) {
      feedback.summary = 'Good performance with solid communication fundamentals. With focused practice on specific areas, you can further enhance your effectiveness.';
    } else if (overallScore >= 5.5) {
      feedback.summary = 'Satisfactory performance with several areas for development. Focus on improving both content structure and delivery techniques.';
    } else {
      feedback.summary = 'Your performance shows potential but needs significant improvement in content organization and delivery techniques. Focused practice will help you develop these skills.';
    }

    return feedback;
  }
}

module.exports = new SentimentAnalyzer();