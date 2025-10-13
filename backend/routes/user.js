const express = require('express');
const User = require('../models/User');
const Interview = require('../models/Interview');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with stats
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Get interview statistics
    const totalInterviews = await Interview.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });

    // Count technical interviews
    const technicalInterviews = await Interview.countDocuments({
      user: userId,
      status: 'completed',
      type: 'technical'
    });

    const recentInterviews = await Interview.find({ 
      user: userId, 
      status: 'completed' 
    })
    .sort({ completedAt: -1 })
    .limit(5)
    .select('title type difficulty completedAt overallAnalysis.grade');

    // Calculate averages from completed interviews
    const completedInterviews = await Interview.find({
      user: userId,
      status: 'completed'
    });

    let avgConfidence = 0;
    let avgClarity = 0;
    let improvementTrend = 0;

    if (completedInterviews.length > 0) {
      avgConfidence = completedInterviews.reduce((sum, interview) => 
        sum + (interview.overallAnalysis?.averageConfidence || 0), 0) / completedInterviews.length;
      
      avgClarity = completedInterviews.reduce((sum, interview) => 
        sum + (interview.overallAnalysis?.averageClarity || 0), 0) / completedInterviews.length;

      // Calculate trend (last 5 vs previous 5)
      if (completedInterviews.length >= 10) {
        const recent5 = completedInterviews.slice(0, 5);
        const previous5 = completedInterviews.slice(5, 10);
        
        const recentAvg = recent5.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5;
        const previousAvg = previous5.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / 5;
        
        improvementTrend = ((recentAvg - previousAvg) / Math.max(previousAvg, 1)) * 100;
      }
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      'stats.totalInterviews': totalInterviews,
      'stats.technicalInterviews': technicalInterviews,
      'stats.averageConfidence': parseFloat(avgConfidence.toFixed(1)),
      'stats.averageClarity': parseFloat(avgClarity.toFixed(1)),
      'stats.improvementTrend': parseFloat(improvementTrend.toFixed(1))
    });

    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences,
        stats: updatedUser.stats,
        badges: updatedUser.badges,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt
      },
      recentInterviews,
      summary: {
        totalInterviews,
        averageGrade: calculateAverageGrade(completedInterviews),
        strongestSkill: getStrongestSkill(completedInterviews),
        improvementArea: getImprovementArea(completedInterviews)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, profile, preferences } = req.body;

    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    if (profile) {
      updateData.profile = {
        ...req.user.profile,
        ...profile
      };
    }
    
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        profile: user.profile,
        preferences: user.preferences,
        stats: user.stats,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/users/badges
// @desc    Get user badges and check for new achievements
// @access  Private
router.get('/badges', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('badges stats');

    // Check for new badge achievements
    const newBadges = await checkForNewBadges(userId);
    
    if (newBadges.length > 0) {
      // Add new badges to user
      user.badges.push(...newBadges);
      await user.save();
    }

    res.json({
      badges: user.badges,
      newBadges: newBadges,
      availableBadges: getAvailableBadges()
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch badges'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements and progress
// @access  Private
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('stats badges');
    const interviews = await Interview.find({ user: userId, status: 'completed' });

    // Calculate achievement progress
    const achievements = calculateAchievements(user, interviews);

    res.json({
      achievements,
      stats: user.stats,
      badges: user.badges,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch achievements'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard (anonymized)
// @access  Private
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all'; // 'week', 'month', 'all'
    
    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { lastLogin: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { lastLogin: { $gte: monthAgo } };
    }

    const users = await User.find({ 
      isActive: true, 
      'stats.totalInterviews': { $gt: 0 },
      ...dateFilter
    })
    .select('username stats badges createdAt')
    .sort({ 'stats.averageConfidence': -1 })
    .limit(50);

    const currentUser = await User.findById(req.user._id).select('stats');
    
    // Anonymize and rank users
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username === req.user.username ? user.username : `User${user._id.toString().slice(-4)}`,
      isCurrentUser: user.username === req.user.username,
      stats: {
        totalInterviews: user.stats.totalInterviews,
        averageConfidence: user.stats.averageConfidence,
        averageClarity: user.stats.averageClarity,
        improvementTrend: user.stats.improvementTrend
      },
      badgeCount: user.badges.length,
      joinedAt: user.createdAt
    }));

    // Find current user's rank
    const currentUserRank = leaderboard.findIndex(entry => entry.isCurrentUser) + 1;

    res.json({
      leaderboard,
      currentUserRank: currentUserRank || null,
      timeframe,
      totalUsers: users.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Helper functions
function calculateAverageGrade(interviews) {
  if (interviews.length === 0) return 'N/A';
  
  const gradeValues = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D': 1.0, 'F': 0.0
  };

  const totalGradePoints = interviews.reduce((sum, interview) => {
    const grade = interview.overallAnalysis?.grade || 'F';
    return sum + (gradeValues[grade] || 0);
  }, 0);

  const avgGradePoint = totalGradePoints / interviews.length;
  
  // Convert back to letter grade
  if (avgGradePoint >= 3.7) return 'A';
  if (avgGradePoint >= 3.3) return 'B+';
  if (avgGradePoint >= 3.0) return 'B';
  if (avgGradePoint >= 2.7) return 'B-';
  if (avgGradePoint >= 2.3) return 'C+';
  if (avgGradePoint >= 2.0) return 'C';
  if (avgGradePoint >= 1.7) return 'C-';
  if (avgGradePoint >= 1.0) return 'D';
  return 'F';
}

function getStrongestSkill(interviews) {
  if (interviews.length === 0) return 'None';
  
  const avgConfidence = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / interviews.length;
  const avgClarity = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.averageClarity || 0), 0) / interviews.length;
  const avgSentiment = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.sentimentScore || 0), 0) / interviews.length;

  const scores = { confidence: avgConfidence, clarity: avgClarity, sentiment: avgSentiment };
  return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

function getImprovementArea(interviews) {
  if (interviews.length === 0) return 'Practice more interviews';
  
  const avgConfidence = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.averageConfidence || 0), 0) / interviews.length;
  const avgClarity = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.averageClarity || 0), 0) / interviews.length;
  const avgSentiment = interviews.reduce((sum, i) => sum + (i.overallAnalysis?.sentimentScore || 0), 0) / interviews.length;

  const scores = { confidence: avgConfidence, clarity: avgClarity, sentiment: avgSentiment };
  return Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
}

async function checkForNewBadges(userId) {
  const user = await User.findById(userId);
  const interviews = await Interview.find({ user: userId, status: 'completed' });
  
  const existingBadgeNames = user.badges.map(badge => badge.name);
  const newBadges = [];

  // Define badge criteria
  const badgeCriteria = [
    {
      name: 'First Steps',
      description: 'Complete your first interview',
      icon: '🎯',
      criteria: () => interviews.length >= 1
    },
    {
      name: 'Confidence Builder',
      description: 'Achieve 8+ confidence score',
      icon: '💪',
      criteria: () => interviews.some(i => (i.overallAnalysis?.averageConfidence || 0) >= 8)
    },
    {
      name: 'Clear Communicator',
      description: 'Achieve 8+ clarity score',
      icon: '🗣️',
      criteria: () => interviews.some(i => (i.overallAnalysis?.averageClarity || 0) >= 8)
    },
    {
      name: 'Interview Veteran',
      description: 'Complete 10 interviews',
      icon: '🏆',
      criteria: () => interviews.length >= 10
    },
    {
      name: 'Perfectionist',
      description: 'Get an A+ grade',
      icon: '⭐',
      criteria: () => interviews.some(i => i.overallAnalysis?.grade === 'A+')
    },
    {
      name: 'Consistent Performer',
      description: 'Complete 5 interviews in a week',
      icon: '📈',
      criteria: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentInterviews = interviews.filter(i => new Date(i.createdAt) >= weekAgo);
        return recentInterviews.length >= 5;
      }
    },
    {
      name: 'Technical Expert',
      description: 'Complete 5 technical interviews',
      icon: '⚙️',
      criteria: () => {
        const technicalInterviews = interviews.filter(i => i.type === 'technical');
        return technicalInterviews.length >= 5;
      }
    }
  ];

  // Check each badge criteria
  badgeCriteria.forEach(badge => {
    if (!existingBadgeNames.includes(badge.name) && badge.criteria()) {
      newBadges.push({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date()
      });
    }
  });

  return newBadges;
}

function getAvailableBadges() {
  return [
    { name: 'First Steps', description: 'Complete your first interview', icon: '🎯' },
    { name: 'Confidence Builder', description: 'Achieve 8+ confidence score', icon: '💪' },
    { name: 'Clear Communicator', description: 'Achieve 8+ clarity score', icon: '🗣️' },
    { name: 'Interview Veteran', description: 'Complete 10 interviews', icon: '🏆' },
    { name: 'Perfectionist', description: 'Get an A+ grade', icon: '⭐' },
    { name: 'Consistent Performer', description: 'Complete 5 interviews in a week', icon: '📈' },
    { name: 'Technical Expert', description: 'Complete 5 technical interviews', icon: '⚙️' },
    { name: 'People Person', description: 'Excel in behavioral interviews', icon: '👥' },
    { name: 'Improvement Master', description: 'Show 50% improvement trend', icon: '📊' },
    { name: 'Marathon Runner', description: 'Complete 25 interviews', icon: '🏃' }
  ];
}

function calculateAchievements(user, interviews) {
  const achievements = [
    {
      name: 'Interview Count',
      current: interviews.length,
      target: 25,
      progress: Math.min((interviews.length / 25) * 100, 100),
      description: 'Complete interview practice sessions'
    },
    {
      name: 'Confidence Level',
      current: user.stats.averageConfidence,
      target: 9,
      progress: Math.min((user.stats.averageConfidence / 9) * 100, 100),
      description: 'Achieve high confidence scores'
    },
    {
      name: 'Communication Clarity',
      current: user.stats.averageClarity,
      target: 9,
      progress: Math.min((user.stats.averageClarity / 9) * 100, 100),
      description: 'Master clear communication'
    },
    {
      name: 'Badge Collection',
      current: user.badges.length,
      target: 10,
      progress: Math.min((user.badges.length / 10) * 100, 100),
      description: 'Earn achievement badges'
    }
  ];

  return achievements;
}

// Export the router as default and functions as named exports
module.exports = router;
module.exports.checkForNewBadges = checkForNewBadges;
module.exports.getAvailableBadges = getAvailableBadges;
module.exports.calculateAchievements = calculateAchievements;
