const express = require('express')
const router = express.Router()
const Interview = require('../models/Interview')
const { authMiddleware } = require('../middleware/auth')

// Get gamification dashboard data
router.get('/gamification', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id  // This is correct
    
    // Get all interviews for the user
    // Fix: Use 'user' field instead of 'userId' to match the Interview model
    const interviews = await Interview.find({ user: userId }).sort({ createdAt: -1 })
    
    // Calculate stats
    const totalInterviews = interviews.length
    const averageConfidence = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.averageConfidence || 0), 0) / interviews.length
      : 0
    const averageClarity = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.averageClarity || 0), 0) / interviews.length
      : 0
    const averageSentiment = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.sentimentScore || 0), 0) / interviews.length
      : 0
    
    // Calculate average answer score
    let averageAnswerScore = 0
    let totalAnswerScores = 0
    let answerScoreCount = 0
    
    interviews.forEach(interview => {
      if (interview.questions && Array.isArray(interview.questions)) {
        interview.questions.forEach(question => {
          // Fix: Access answerScore correctly from the question analysis
          if (question.analysis?.answerScore?.score !== undefined && question.analysis?.answerScore?.score !== null) {
            totalAnswerScores += question.analysis.answerScore.score
            answerScoreCount++
          }
        })
      }
    })
    
    if (answerScoreCount > 0) {
      averageAnswerScore = totalAnswerScores / answerScoreCount
    }
    
    // Calculate improvement trend (last 5 vs first 5 interviews)
    let improvementTrend = 0
    if (interviews.length >= 5) {
      const recent = interviews.slice(0, 5)
      const initial = interviews.slice(-5)
      
      const recentAvg = recent.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5
      const initialAvg = initial.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5
      
      if (initialAvg > 0) {
        improvementTrend = ((recentAvg - initialAvg) / initialAvg) * 100
      }
    }
    
    // Calculate streak (based on actual interview dates)
    const calculateStreak = (interviews) => {
      if (interviews.length === 0) return 0;
      
      // Get completed interviews only
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      if (completedInterviews.length === 0) return 0;
      
      // Create a set of interview dates for quick lookup
      const interviewDates = new Set();
      completedInterviews.forEach(interview => {
        const interviewDate = new Date(interview.createdAt);
        interviewDate.setHours(0, 0, 0, 0);
        interviewDates.add(interviewDate.getTime());
      });
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check consecutive days starting from today (or yesterday if no interview today)
      let currentDate = new Date(today);
      // First check if there's an interview today
      if (interviewDates.has(currentDate.getTime())) {
        streak = 1;
      } else {
        // If no interview today, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
        if (interviewDates.has(currentDate.getTime())) {
          streak = 1;
        }
      }
      
      // Continue checking previous days
      if (streak > 0) {
        currentDate.setDate(currentDate.getDate() - 1);
        while (interviewDates.has(currentDate.getTime())) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }
      
      return streak;
    };
    
    const streakDays = calculateStreak(interviews);
    
    // Calculate weekly improvement properly
    const calculateWeeklyImprovement = (interviews) => {
      if (interviews.length === 0) return 0;
      
      // Get completed interviews only
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      if (completedInterviews.length < 2) return 0;
      
      // Get interviews from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentInterviews = completedInterviews.filter(interview => 
        new Date(interview.createdAt) >= oneWeekAgo
      );
      
      if (recentInterviews.length < 2) return 0;
      
      // Sort by date (oldest first)
      recentInterviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Calculate average confidence for first half and second half
      const midIndex = Math.floor(recentInterviews.length / 2);
      const firstHalf = recentInterviews.slice(0, midIndex);
      const secondHalf = recentInterviews.slice(midIndex);
      
      if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
      
      const firstHalfAvg = firstHalf.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / secondHalf.length;
      
      // Calculate improvement (difference, not percentage)
      return secondHalfAvg - firstHalfAvg;
    };
    
    const weekImprovement = calculateWeeklyImprovement(interviews);
    
    // Count technical interviews (needed for badge calculation)
    const technicalInterviews = interviews.filter(interview => 
      interview.type === 'technical'
    ).length
    
    // Count perfect scores
    const perfectScores = interviews.filter(interview => 
      interview.overallAnalysis?.averageConfidence >= 9.5 || 
      interview.overallAnalysis?.averageClarity >= 9.5 ||
      averageAnswerScore >= 9.5
    ).length
    
    // Calculate daily/weekly/monthly stats (mock for demo)
    const today = new Date()
    const todayInterviews = interviews.filter(interview => {
      const interviewDate = new Date(interview.createdAt)
      return interviewDate.toDateString() === today.toDateString()
    }).length
    
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const weekInterviews = interviews.filter(interview => {
      const interviewDate = new Date(interview.createdAt)
      return interviewDate >= weekStart
    }).length
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthInterviews = interviews.filter(interview => {
      const interviewDate = new Date(interview.createdAt)
      return interviewDate >= monthStart
    }).length
    
    // Calculate level and XP
    const experiencePoints = totalInterviews * 100 + perfectScores * 50 + technicalInterviews * 10
    const level = Math.floor(experiencePoints / 500) + 1
    const nextLevelXP = level * 500
    
    const rank = level >= 8 ? 'Expert Interviewer' :
                 level >= 5 ? 'Advanced Interviewer' :
                 level >= 3 ? 'Intermediate Interviewer' :
                 'Beginner Interviewer'
    
    // Get user to fetch badges
    const User = require('../models/User')
    const user = await User.findById(userId).select('badges')
    
    // Check for new badges
    const userRoutes = require('./user')
    const newBadges = await userRoutes.checkForNewBadges(userId)
    
    if (newBadges.length > 0) {
      // Add new badges to user
      user.badges.push(...newBadges)
      await user.save()
    }
    
    // Calculate badges earned this month
    const monthBadges = user.badges.filter(badge => {
      const badgeDate = new Date(badge.earnedAt)
      return badgeDate >= monthStart
    }).length
    
    console.log('User badges:', user.badges)
    console.log('Total badges earned:', user.badges.length)
    console.log('Month badges:', monthBadges)
    
    const gamificationData = {
      totalInterviews,
      technicalInterviews,
      averageConfidence: Number(averageConfidence.toFixed(1)),
      averageClarity: Number(averageClarity.toFixed(1)),
      averageSentiment: Number(averageSentiment.toFixed(1)),
      averageAnswerScore: Number(averageAnswerScore.toFixed(1)),
      improvementTrend: Number(improvementTrend.toFixed(1)),
      streakDays,
      badgesEarned: user.badges.length,
      perfectScores,
      todayInterviews,
      todayPracticeTime: todayInterviews * 15, // Estimate 15 min per interview
      weekInterviews,
      weekImprovement: Number(weekImprovement.toFixed(4)), // Use the calculated value
      monthInterviews,
      monthBadges,
      level,
      experiencePoints,
      nextLevelXP,
      rank
    }
    
    console.log('Gamification data being sent:', gamificationData)
    res.json(gamificationData)
  } catch (error) {
    console.error('Error fetching gamification data:', error)
    res.status(500).json({ message: 'Failed to fetch gamification data' })
  }
})

// Get dashboard analytics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id  // Changed from req.user.userId to req.user._id for consistency
    const { timeframe = '30' } = req.query
    
    const days = parseInt(timeframe)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Fix: Use 'user' field instead of 'userId' to match the Interview model
    const interviews = await Interview.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 })
    
    // Calculate basic stats
    const totalInterviews = interviews.length
    const averageConfidence = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.averageConfidence || 0), 0) / interviews.length
      : 0
    const averageClarity = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.averageClarity || 0), 0) / interviews.length
      : 0
    const averageSentiment = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.overallAnalysis?.sentimentScore || 0), 0) / interviews.length
      : 0
    
    // Calculate average answer score
    let averageAnswerScore = 0
    let totalAnswerScores = 0
    let answerScoreCount = 0
    
    interviews.forEach(interview => {
      if (interview.questions && Array.isArray(interview.questions)) {
        interview.questions.forEach(question => {
          // Fix: Access answerScore correctly from the question analysis
          if (question.analysis?.answerScore?.score !== undefined && question.analysis?.answerScore?.score !== null) {
            totalAnswerScores += question.analysis.answerScore.score
            answerScoreCount++
          }
        })
      }
    })
    
    if (answerScoreCount > 0) {
      averageAnswerScore = totalAnswerScores / answerScoreCount
    }
    
    // Calculate improvement trend (last 5 vs first 5 interviews)
    let improvementTrend = 0
    if (interviews.length >= 5) {
      const recent = interviews.slice(0, 5)
      const initial = interviews.slice(-5)
      
      const recentAvg = recent.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5
      const initialAvg = initial.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5
      
      if (initialAvg > 0) {
        improvementTrend = ((recentAvg - initialAvg) / initialAvg) * 100
      }
    }
    
    // Count technical interviews
    const technicalInterviews = interviews.filter(interview => 
      interview.type === 'technical'
    ).length
    
    // Count perfect scores
    const perfectScores = interviews.filter(interview => 
      interview.overallAnalysis?.averageConfidence >= 9.5 || 
      interview.overallAnalysis?.averageClarity >= 9.5 ||
      averageAnswerScore >= 9.5
    ).length
    
    // Generate time series data
    const confidenceOverTime = interviews
      .filter(interview => interview.overallAnalysis?.averageConfidence !== undefined)
      .map(interview => ({
        date: interview.createdAt,
        value: interview.overallAnalysis.averageConfidence,
        label: interview.type || 'General'
      }))
    
    const clarityOverTime = interviews
      .filter(interview => interview.overallAnalysis?.averageClarity !== undefined)
      .map(interview => ({
        date: interview.createdAt,
        value: interview.overallAnalysis.averageClarity,
        label: interview.type || 'General'
      }))
    
    // Generate answer score over time data
    const answerScoreOverTime = []
    interviews
      .filter(interview => interview.status === 'completed')
      .forEach(interview => {
        if (interview.questions && Array.isArray(interview.questions)) {
          // Calculate average answer score for this interview
          let interviewTotalScore = 0
          let interviewScoreCount = 0
          
          interview.questions.forEach(question => {
            // Fix: Access answerScore correctly from the question analysis
            if (question.analysis?.answerScore?.score !== undefined && question.analysis?.answerScore?.score !== null) {
              interviewTotalScore += question.analysis.answerScore.score
              interviewScoreCount++
            }
          })
          
          if (interviewScoreCount > 0) {
            answerScoreOverTime.push({
              date: interview.createdAt,
              value: interviewTotalScore / interviewScoreCount,
              label: interview.type || 'General'
            })
          }
        }
      })
    
    // Interview type distribution
    const typeDistribution = interviews.reduce((acc, interview) => {
      const type = interview.type || 'general'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    const interviewTypeDistribution = Object.entries(typeDistribution).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalInterviews) * 100).toFixed(1)
    }))
    
    // Mock strengths and improvement areas
    const strengthsFrequency = [
      { strength: 'Clear communication', count: Math.floor(totalInterviews * 0.7) },
      { strength: 'Detailed responses', count: Math.floor(totalInterviews * 0.5) },
      { strength: 'Confident delivery', count: Math.floor(totalInterviews * 0.4) },
      { strength: 'Positive attitude', count: Math.floor(totalInterviews * 0.3) }
    ]
    
    const improvementAreas = [
      { improvement: 'Reduce filler words', count: Math.floor(totalInterviews * 0.4) },
      { improvement: 'Provide more examples', count: Math.floor(totalInterviews * 0.3) },
      { improvement: 'Speak with more conviction', count: Math.floor(totalInterviews * 0.2) }
    ]
    
    // Calculate weekly improvement properly
    const calculateWeeklyImprovement = (interviews) => {
      if (interviews.length === 0) return 0;
      
      // Get completed interviews only
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      if (completedInterviews.length < 2) return 0;
      
      // Get interviews from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentInterviews = completedInterviews.filter(interview => 
        new Date(interview.createdAt) >= oneWeekAgo
      );
      
      if (recentInterviews.length < 2) return 0;
      
      // Sort by date (oldest first)
      recentInterviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Calculate average confidence for first half and second half
      const midIndex = Math.floor(recentInterviews.length / 2);
      const firstHalf = recentInterviews.slice(0, midIndex);
      const secondHalf = recentInterviews.slice(midIndex);
      
      if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
      
      const firstHalfAvg = firstHalf.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / secondHalf.length;
      
      // Calculate improvement (difference, not percentage)
      return secondHalfAvg - firstHalfAvg;
    };
    
    const weekImprovement = calculateWeeklyImprovement(interviews);
    
    const analyticsData = {
      stats: {
        totalInterviews,
        technicalInterviews,
        averageConfidence: Number(averageConfidence.toFixed(1)),
        averageClarity: Number(averageClarity.toFixed(1)),
        averageSentiment: Number(averageSentiment.toFixed(1)),
        averageAnswerScore: Number(averageAnswerScore.toFixed(1)),
        improvementTrend: Number(improvementTrend.toFixed(1))
      },
      charts: {
        confidenceOverTime,
        clarityOverTime,
        answerScoreOverTime,
        interviewTypeDistribution,
        strengthsFrequency,
        improvementAreas
      }
    }
    
    res.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    res.status(500).json({ message: 'Failed to fetch analytics data' })
  }
})

module.exports = router