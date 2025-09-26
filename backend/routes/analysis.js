const express = require('express')
const router = express.Router()
const Interview = require('../models/Interview')
const { authMiddleware } = require('../middleware/auth')

// Get gamification dashboard data
router.get('/gamification', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    
    // Get all interviews for the user
    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 })
    
    // Calculate stats
    const totalInterviews = interviews.length
    const averageConfidence = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.confidence || 0), 0) / interviews.length
      : 0
    const averageClarity = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.clarity || 0), 0) / interviews.length
      : 0
    const averageSentiment = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.sentiment || 0), 0) / interviews.length
      : 0
    
    // Calculate improvement trend (last 5 vs first 5 interviews)
    let improvementTrend = 0
    if (interviews.length >= 5) {
      const recent = interviews.slice(0, 5)
      const initial = interviews.slice(-5)
      
      const recentAvg = recent.reduce((sum, i) => sum + (i.analysis?.confidence || 0), 0) / 5
      const initialAvg = initial.reduce((sum, i) => sum + (i.analysis?.confidence || 0), 0) / 5
      
      if (initialAvg > 0) {
        improvementTrend = ((recentAvg - initialAvg) / initialAvg) * 100
      }
    }
    
    // Calculate streak (mock for now)
    const streakDays = Math.floor(Math.random() * 10) + 1
    
    // Count badges earned (mock)
    const badgesEarned = Math.min(Math.floor(totalInterviews / 2), 8)
    
    // Count perfect scores
    const perfectScores = interviews.filter(interview => 
      interview.analysis?.confidence >= 9.5 || 
      interview.analysis?.clarity >= 9.5
    ).length
    
    // Count technical interviews
    const technicalInterviews = interviews.filter(interview => 
      interview.type === 'technical'
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
    const experiencePoints = totalInterviews * 100 + perfectScores * 50 + badgesEarned * 25
    const level = Math.floor(experiencePoints / 500) + 1
    const nextLevelXP = level * 500
    
    const rank = level >= 8 ? 'Expert Interviewer' :
                 level >= 5 ? 'Advanced Interviewer' :
                 level >= 3 ? 'Intermediate Interviewer' :
                 'Beginner Interviewer'
    
    const gamificationData = {
      totalInterviews,
      averageConfidence: Number(averageConfidence.toFixed(1)),
      averageClarity: Number(averageClarity.toFixed(1)),
      averageSentiment: Number(averageSentiment.toFixed(1)),
      improvementTrend: Number(improvementTrend.toFixed(1)),
      streakDays,
      badgesEarned,
      perfectScores,
      technicalInterviews,
      todayInterviews,
      todayPracticeTime: todayInterviews * 15, // Estimate 15 min per interview
      weekInterviews,
      weekImprovement: Math.random() * 2, // Mock improvement
      monthInterviews,
      monthBadges: Math.min(badgesEarned, 3), // Max 3 badges per month
      level,
      experiencePoints,
      nextLevelXP,
      rank
    }
    
    res.json(gamificationData)
  } catch (error) {
    console.error('Error fetching gamification data:', error)
    res.status(500).json({ message: 'Failed to fetch gamification data' })
  }
})

// Get dashboard analytics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const { timeframe = '30' } = req.query
    
    const days = parseInt(timeframe)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const interviews = await Interview.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 })
    
    // Calculate basic stats
    const totalInterviews = interviews.length
    const averageConfidence = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.confidence || 0), 0) / interviews.length
      : 0
    const averageClarity = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.clarity || 0), 0) / interviews.length
      : 0
    const averageSentiment = interviews.length > 0
      ? interviews.reduce((sum, interview) => sum + (interview.analysis?.sentiment || 0), 0) / interviews.length
      : 0
    
    // Calculate improvement trend
    let improvementTrend = 0
    if (interviews.length >= 5) {
      const recent = interviews.slice(0, Math.ceil(interviews.length / 2))
      const older = interviews.slice(Math.ceil(interviews.length / 2))
      
      const recentAvg = recent.reduce((sum, i) => sum + (i.analysis?.confidence || 0), 0) / recent.length
      const olderAvg = older.reduce((sum, i) => sum + (i.analysis?.confidence || 0), 0) / older.length
      
      if (olderAvg > 0) {
        improvementTrend = ((recentAvg - olderAvg) / olderAvg) * 100
      }
    }
    
    // Generate time series data
    const confidenceOverTime = interviews.map(interview => ({
      date: interview.createdAt,
      value: interview.analysis?.confidence || 0,
      label: interview.type || 'General'
    }))
    
    const clarityOverTime = interviews.map(interview => ({
      date: interview.createdAt,
      value: interview.analysis?.clarity || 0,
      label: interview.type || 'General'
    }))
    
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
    
    const analyticsData = {
      stats: {
        totalInterviews,
        averageConfidence: Number(averageConfidence.toFixed(1)),
        averageClarity: Number(averageClarity.toFixed(1)),
        averageSentiment: Number(averageSentiment.toFixed(1)),
        improvementTrend: Number(improvementTrend.toFixed(1))
      },
      charts: {
        confidenceOverTime,
        clarityOverTime,
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
