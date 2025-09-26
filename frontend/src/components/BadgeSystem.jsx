import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Award, 
  Star, 
  Target, 
  Zap, 
  Trophy, 
  Crown, 
  Shield,
  Flame,
  Heart,
  Lightbulb
} from 'lucide-react'

const BadgeSystem = ({ userStats, onBadgeEarned }) => {
  const [badges, setBadges] = useState([])
  const [newBadges, setNewBadges] = useState([])

  // Badge definitions
  const badgeDefinitions = [
    {
      id: 'first_interview',
      name: 'First Steps',
      description: 'Complete your first interview',
      icon: Star,
      requirement: { type: 'interviews_completed', value: 1 },
      rarity: 'common',
      color: 'bg-blue-500'
    },
    {
      id: 'interview_streak_3',
      name: 'Getting Started',
      description: 'Complete 3 interviews',
      icon: Target,
      requirement: { type: 'interviews_completed', value: 3 },
      rarity: 'common',
      color: 'bg-green-500'
    },
    {
      id: 'interview_streak_10',
      name: 'Dedicated Learner',
      description: 'Complete 10 interviews',
      icon: Zap,
      requirement: { type: 'interviews_completed', value: 10 },
      rarity: 'uncommon',
      color: 'bg-purple-500'
    },
    {
      id: 'confidence_master',
      name: 'Confidence Master',
      description: 'Achieve confidence score above 8.0',
      icon: Trophy,
      requirement: { type: 'average_confidence', value: 8.0 },
      rarity: 'rare',
      color: 'bg-yellow-500'
    },
    {
      id: 'clarity_champion',
      name: 'Clarity Champion',
      description: 'Achieve clarity score above 8.5',
      icon: Crown,
      requirement: { type: 'average_clarity', value: 8.5 },
      rarity: 'rare',
      color: 'bg-indigo-500'
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Score perfect 10 in any category',
      icon: Shield,
      requirement: { type: 'perfect_score', value: 10 },
      rarity: 'epic',
      color: 'bg-red-500'
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      description: 'Complete interviews 7 days in a row',
      icon: Flame,
      requirement: { type: 'streak_days', value: 7 },
      rarity: 'uncommon',
      color: 'bg-orange-500'
    },
    {
      id: 'improvement_seeker',
      name: 'Improvement Seeker',
      description: 'Show 20% improvement in any skill',
      icon: Heart,
      requirement: { type: 'improvement_percentage', value: 20 },
      rarity: 'rare',
      color: 'bg-pink-500'
    },
    {
      id: 'technical_expert',
      name: 'Technical Expert',
      description: 'Complete 5 technical interviews',
      icon: Lightbulb,
      requirement: { type: 'technical_interviews', value: 5 },
      rarity: 'uncommon',
      color: 'bg-cyan-500'
    }
  ]

  useEffect(() => {
    if (!userStats) return

    const earnedBadges = []
    const newlyEarned = []

    badgeDefinitions.forEach(badge => {
      const isEarned = checkBadgeRequirement(badge.requirement, userStats)
      const wasAlreadyEarned = badges.find(b => b.id === badge.id)

      if (isEarned && !wasAlreadyEarned) {
        earnedBadges.push({ ...badge, earnedAt: new Date() })
        newlyEarned.push(badge)
      } else if (wasAlreadyEarned) {
        earnedBadges.push(wasAlreadyEarned)
      }
    })

    setBadges(earnedBadges)
    
    if (newlyEarned.length > 0) {
      setNewBadges(newlyEarned)
      onBadgeEarned?.(newlyEarned)
      
      // Clear new badges after showing them
      setTimeout(() => setNewBadges([]), 5000)
    }
  }, [userStats])

  const checkBadgeRequirement = (requirement, stats) => {
    switch (requirement.type) {
      case 'interviews_completed':
        return stats.totalInterviews >= requirement.value
      case 'average_confidence':
        return stats.averageConfidence >= requirement.value
      case 'average_clarity':
        return stats.averageClarity >= requirement.value
      case 'perfect_score':
        return stats.perfectScores >= 1
      case 'streak_days':
        return stats.streakDays >= requirement.value
      case 'improvement_percentage':
        return stats.improvementTrend >= requirement.value
      case 'technical_interviews':
        return stats.technicalInterviews >= requirement.value
      default:
        return false
    }
  }

  const getRarityStyles = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50'
      case 'uncommon':
        return 'border-green-300 bg-green-50'
      case 'rare':
        return 'border-blue-300 bg-blue-50'
      case 'epic':
        return 'border-purple-300 bg-purple-50'
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const BadgeCard = ({ badge, earned = false }) => {
    const Icon = badge.icon
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
          earned 
            ? `${getRarityStyles(badge.rarity)} shadow-md` 
            : 'border-gray-200 bg-gray-100 opacity-50'
        }`}
      >
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
            earned ? badge.color : 'bg-gray-400'
          }`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className={`font-semibold text-sm mb-1 ${
            earned ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {badge.name}
          </h3>
          <p className={`text-xs ${
            earned ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {badge.description}
          </p>
          {badge.rarity && earned && (
            <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
              badge.rarity === 'common' ? 'bg-gray-200 text-gray-800' :
              badge.rarity === 'uncommon' ? 'bg-green-200 text-green-800' :
              badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
              badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
              'bg-yellow-200 text-yellow-800'
            }`}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </span>
          )}
        </div>
        {earned && badge.earnedAt && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Badge Notifications */}
      {newBadges.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${badge.color}`}>
                  <badge.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Badge Earned!</h4>
                  <p className="text-sm text-gray-600">{badge.name}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Badge Collection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Badge Collection</h2>
          <div className="text-sm text-gray-600">
            {badges.length} / {badgeDefinitions.length} earned
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {badgeDefinitions.map(badge => {
            const earned = badges.find(b => b.id === badge.id)
            return (
              <BadgeCard 
                key={badge.id} 
                badge={earned || badge} 
                earned={!!earned} 
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BadgeSystem