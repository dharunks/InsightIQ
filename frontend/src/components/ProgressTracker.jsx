import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award,
  Flame,
  Star,
  CheckCircle,
  Clock
} from 'lucide-react'

const ProgressTracker = ({ userStats, goals, onGoalUpdate }) => {
  const [dailyGoals, setDailyGoals] = useState([])
  const [weeklyGoals, setWeeklyGoals] = useState([])
  const [monthlyGoals, setMonthlyGoals] = useState([])

  useEffect(() => {
    // Initialize goals with default values if not provided
    if (!goals) {
      setDailyGoals([
        { id: 'daily_interview', name: 'Complete 1 interview', target: 1, current: 0, type: 'interviews' },
        { id: 'daily_practice', name: 'Practice 30 minutes', target: 30, current: 0, type: 'time' }
      ])
      
      setWeeklyGoals([
        { id: 'weekly_interviews', name: 'Complete 5 interviews', target: 5, current: 0, type: 'interviews' },
        { id: 'weekly_improvement', name: 'Improve confidence by 0.5', target: 0.5, current: 0, type: 'improvement' }
      ])
      
      setMonthlyGoals([
        { id: 'monthly_interviews', name: 'Complete 20 interviews', target: 20, current: 0, type: 'interviews' },
        { id: 'monthly_badges', name: 'Earn 3 new badges', target: 3, current: 0, type: 'badges' }
      ])
    } else {
      setDailyGoals(goals.daily || [])
      setWeeklyGoals(goals.weekly || [])
      setMonthlyGoals(goals.monthly || [])
    }
  }, [goals])

  useEffect(() => {
    if (userStats) {
      updateGoalProgress(userStats)
    }
  }, [userStats])

  const updateGoalProgress = (stats) => {
    // Update daily goals
    setDailyGoals(prev => prev.map(goal => {
      switch (goal.type) {
        case 'interviews':
          return { ...goal, current: stats.todayInterviews || 0 }
        case 'time':
          return { ...goal, current: stats.todayPracticeTime || 0 }
        default:
          return goal
      }
    }))

    // Update weekly goals
    setWeeklyGoals(prev => prev.map(goal => {
      switch (goal.type) {
        case 'interviews':
          return { ...goal, current: stats.weekInterviews || 0 }
        case 'improvement':
          return { ...goal, current: stats.weekImprovement || 0 }
        default:
          return goal
      }
    }))

    // Update monthly goals
    setMonthlyGoals(prev => prev.map(goal => {
      switch (goal.type) {
        case 'interviews':
          return { ...goal, current: stats.monthInterviews || stats.totalInterviews || 0 }
        case 'badges':
          return { ...goal, current: stats.monthBadges || 0 }
        default:
          return goal
      }
    }))
  }

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const isGoalCompleted = (current, target) => {
    return current >= target
  }

  const getStreakInfo = () => {
    const streak = userStats?.streakDays || 0
    const streakEmoji = streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'
    
    return {
      current: streak,
      emoji: streakEmoji,
      message: streak >= 7 ? 'You\'re on fire!' : 
               streak >= 3 ? 'Great momentum!' : 
               streak >= 1 ? 'Keep it up!' : 'Start your streak today!'
    }
  }

  const GoalCard = ({ goal, period }) => {
    const progress = getProgressPercentage(goal.current, goal.target)
    const completed = isGoalCompleted(goal.current, goal.target)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
          completed 
            ? 'border-green-300 bg-green-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{goal.name}</h4>
          {completed && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{goal.current} / {goal.target}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-500 ${
                completed ? 'bg-green-500' : 'bg-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          {period}
        </div>
      </motion.div>
    )
  }

  const streak = getStreakInfo()

  return (
    <div className="space-y-6">
      {/* Streak Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Practice Streak</h3>
            <p className="text-orange-100">{streak.message}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              {streak.current} <span className="text-2xl">{streak.emoji}</span>
            </div>
            <p className="text-orange-100 text-sm">days</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Goals */}
      <div>
        <div className="flex items-center mb-4">
          <Target className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dailyGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} period="Today" />
          ))}
        </div>
      </div>

      {/* Weekly Goals */}
      <div>
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} period="This Week" />
          ))}
        </div>
      </div>

      {/* Monthly Goals */}
      <div>
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Monthly Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthlyGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} period="This Month" />
          ))}
        </div>
      </div>

      {/* Overall Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats?.totalInterviews || 0}</div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userStats?.averageConfidence?.toFixed(1) || '0.0'}</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats?.badgesEarned || 0}</div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{streak.current}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ProgressTracker