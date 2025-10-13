import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Target, TrendingUp } from 'lucide-react'
import BadgeSystem from '../components/BadgeSystem'
import ProgressTracker from '../components/ProgressTracker'
import { useAuthStore } from '../stores/authStore'
import api from '../utils/api'

const Gamification = () => {
  const { user } = useAuthStore()
  const [userStats, setUserStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('progress')

  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        const response = await api.get('/analysis/gamification')
        console.log('Gamification data:', response.data) // Add logging to see the actual data
        console.log('Badges earned:', response.data.badgesEarned)
        setUserStats(response.data)
        setError(null)
      } catch (error) {
        console.error('Failed to load gamification data:', error)
        setError('Failed to load gamification data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    loadGamificationData()
  }, [])

  const handleBadgeEarned = (newBadges) => {
    // Handle badge earning logic
    console.log('New badges earned:', newBadges)
    // You could show notifications, update XP, etc.
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
          <p className="text-gray-600">Complete some interviews to see your progress.</p>
        </div>
      </div>
    )
  }

  const getXPPercentage = () => {
    if (!userStats) return 0
    return (userStats.experiencePoints / userStats.nextLevelXP) * 100
  }

  const tabs = [
    { id: 'progress', name: 'Progress', icon: Target },
    { id: 'badges', name: 'Badges', icon: Trophy },
    { id: 'leaderboard', name: 'Leaderboard', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Journey</h1>
          <p className="mt-2 text-gray-600">
            Track your progress, earn badges, and level up your interview skills
          </p>
        </div>

        {/* Level and XP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Level {userStats?.level}</h2>
              <p className="text-blue-100">{userStats?.rank}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {userStats?.experiencePoints} XP
              </div>
              <p className="text-blue-100 text-sm">
                {userStats?.nextLevelXP - userStats?.experiencePoints} XP to next level
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-100 mb-1">
              <span>Progress to Level {userStats?.level + 1}</span>
              <span>{getXPPercentage().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-3">
              <motion.div
                className="bg-white h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getXPPercentage()}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'progress' && (
            <ProgressTracker userStats={userStats} />
          )}
          
          {activeTab === 'badges' && (
            <BadgeSystem 
              userStats={userStats} 
              onBadgeEarned={handleBadgeEarned} 
            />
          )}
          
          {activeTab === 'leaderboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Global Leaderboard</h2>
              <div className="space-y-4">
                {/* Mock leaderboard data */}
                {[
                  { rank: 1, name: 'Alex Chen', level: 8, xp: 4250, badge: '👑' },
                  { rank: 2, name: 'Sarah Johnson', level: 7, xp: 3890, badge: '🥈' },
                  { rank: 3, name: 'Mike Rodriguez', level: 6, xp: 3420, badge: '🥉' },
                  { rank: 4, name: user?.username || 'You', level: userStats?.level, xp: userStats?.experiencePoints, badge: '⭐', isCurrentUser: true },
                  { rank: 5, name: 'Emma Wilson', level: 5, xp: 2890, badge: '🌟' }
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      player.isCurrentUser 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{player.badge}</div>
                      <div>
                        <h3 className={`font-semibold ${
                          player.isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          #{player.rank} {player.name}
                          {player.isCurrentUser && ' (You)'}
                        </h3>
                        <p className={`text-sm ${
                          player.isCurrentUser ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          Level {player.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        player.isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {player.xp} XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Gamification