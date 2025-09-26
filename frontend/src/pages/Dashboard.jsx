import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  MessageSquare, 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target,
  Plus,
  ArrowRight
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalInterviews: 5,
    averageConfidence: 7.2,
    averageClarity: 8.1,
    improvementTrend: 15
  })

  const [recentInterviews] = useState([
    {
      id: 1,
      title: 'Software Engineer Technical Interview',
      type: 'technical',
      difficulty: 'intermediate',
      completedAt: '2024-01-20',
      grade: 'B+',
      confidence: 7.8,
      clarity: 8.2
    },
    {
      id: 2,
      title: 'Product Manager Behavioral Interview',
      type: 'behavioral',
      difficulty: 'beginner',
      completedAt: '2024-01-18',
      grade: 'A-',
      confidence: 8.5,
      clarity: 8.8
    },
    {
      id: 3,
      title: 'HR General Interview',
      type: 'hr',
      difficulty: 'beginner',
      completedAt: '2024-01-15',
      grade: 'B',
      confidence: 6.5,
      clarity: 7.5
    }
  ])

  const quickActions = [
    {
      title: 'Start New Interview',
      description: 'Practice with AI-powered questions',
      icon: MessageSquare,
      href: '/interviews',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress over time',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Update Profile',
      description: 'Customize your preferences',
      icon: Trophy,
      href: '/profile',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ]

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'bg-green-100 text-green-800'
      case 'B+':
      case 'B':
      case 'B-':
        return 'bg-blue-100 text-blue-800'
      case 'C+':
      case 'C':
      case 'C-':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-red-100 text-red-800'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'technical':
        return 'bg-purple-100 text-purple-800'
      case 'behavioral':
        return 'bg-green-100 text-green-800'
      case 'hr':
        return 'bg-blue-100 text-blue-800'
      case 'situational':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your interview preparation journey and track your progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageConfidence}/10</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Clarity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageClarity}/10</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Improvement</p>
              <p className="text-2xl font-bold text-gray-900">+{stats.improvementTrend}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className={`flex items-center p-3 rounded-lg ${action.color} ${action.hoverColor} text-white transition-colors group`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* New Interview CTA */}
          <div className="card mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready for your next interview?
              </h3>
              <p className="text-gray-600 mb-4">
                Start a new practice session and get AI-powered feedback.
              </p>
              <Link
                to="/interviews"
                className="btn-primary w-full"
              >
                Start New Interview
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Interviews</h3>
              <Link
                to="/interviews"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{interview.title}</h4>
                    <span className={`status-badge ${getGradeColor(interview.grade)}`}>
                      {interview.grade}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span className={`status-badge ${getTypeColor(interview.type)}`}>
                      {interview.type}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {interview.completedAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${interview.confidence * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{interview.confidence}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Clarity</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${interview.clarity * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{interview.clarity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recentInterviews.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No interviews yet</p>
                <Link to="/interviews" className="btn-primary">
                  Start Your First Interview
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard