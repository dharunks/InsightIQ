import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Clock,
  MessageSquare,
  Calendar,
  Download
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import api from '../utils/api'
import { useAuthStore } from '../stores/authStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Analytics = () => {
  const { user } = useAuthStore()
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeframe, setTimeframe] = useState('30')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get(`/analysis/dashboard?timeframe=${timeframe}`)
        setAnalyticsData(response.data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
        // Use mock data for demonstration
        setAnalyticsData({
          stats: {
            totalInterviews: 12,
            averageConfidence: 7.3,
            averageClarity: 8.1,
            averageSentiment: 6.8,
            improvementTrend: 15.2
          },
          charts: {
            confidenceOverTime: [
              { date: '2024-01-15', value: 6.2, label: 'HR Interview' },
              { date: '2024-01-18', value: 7.5, label: 'Behavioral' },
              { date: '2024-01-20', value: 7.8, label: 'Technical' },
              { date: '2024-01-22', value: 8.1, label: 'Situational' }
            ],
            clarityOverTime: [
              { date: '2024-01-15', value: 7.1, label: 'HR Interview' },
              { date: '2024-01-18', value: 8.2, label: 'Behavioral' },
              { date: '2024-01-20', value: 8.5, label: 'Technical' },
              { date: '2024-01-22', value: 8.8, label: 'Situational' }
            ],
            interviewTypeDistribution: [
              { type: 'hr', count: 4, percentage: '33.3' },
              { type: 'behavioral', count: 3, percentage: '25.0' },
              { type: 'technical', count: 3, percentage: '25.0' },
              { type: 'situational', count: 2, percentage: '16.7' }
            ],
            strengthsFrequency: [
              { strength: 'Clear communication', count: 8 },
              { strength: 'Detailed responses', count: 6 },
              { strength: 'Confident delivery', count: 5 },
              { strength: 'Positive attitude', count: 4 }
            ],
            improvementAreas: [
              { improvement: 'Reduce filler words', count: 6 },
              { improvement: 'Provide more examples', count: 4 },
              { improvement: 'Speak with more conviction', count: 3 }
            ]
          }
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [timeframe])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Analytics Data</h2>
          <p className="text-gray-600">Complete some interviews to see your analytics.</p>
        </div>
      </div>
    )
  }

  const { stats, charts } = analyticsData

  // Chart configurations
  const confidenceChartData = {
    labels: charts.confidenceOverTime.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Confidence Score',
        data: charts.confidenceOverTime.map(item => item.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const clarityChartData = {
    labels: charts.clarityOverTime.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Clarity Score',
        data: charts.clarityOverTime.map(item => item.value),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const interviewTypeChartData = {
    labels: charts.interviewTypeDistribution.map(item => item.type.charAt(0).toUpperCase() + item.type.slice(1)),
    datasets: [
      {
        data: charts.interviewTypeDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  }

  const strengthsChartData = {
    labels: charts.strengthsFrequency.map(item => item.strength),
    datasets: [
      {
        label: 'Frequency',
        data: charts.strengthsFrequency.map(item => item.count),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${
              trend < 0 ? 'transform rotate-180' : ''
            }`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-600">{subtitle}</p>
      )}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Track your interview performance and improvement over time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={MessageSquare}
            title="Total Interviews"
            value={stats.totalInterviews}
            subtitle="Practice sessions completed"
          />
          <StatCard
            icon={Target}
            title="Avg Confidence"
            value={`${stats.averageConfidence}/10`}
            trend={stats.improvementTrend}
            subtitle="Self-assessment score"
          />
          <StatCard
            icon={Award}
            title="Avg Clarity"
            value={`${stats.averageClarity}/10`}
            subtitle="Communication clarity"
          />
          <StatCard
            icon={TrendingUp}
            title="Sentiment Score"
            value={`${stats.averageSentiment}/10`}
            subtitle="Overall positivity"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Confidence Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Progression</h3>
            <Line data={confidenceChartData} options={chartOptions} />
          </motion.div>

          {/* Clarity Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clarity Progression</h3>
            <Line data={clarityChartData} options={chartOptions} />
          </motion.div>

          {/* Interview Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Types</h3>
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <Doughnut data={interviewTypeChartData} options={doughnutOptions} />
              </div>
            </div>
          </motion.div>

          {/* Strengths Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Strengths</h3>
            <Bar data={strengthsChartData} options={barChartOptions} />
          </motion.div>
        </div>

        {/* Improvement Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Areas for Improvement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {charts.improvementAreas.map((area, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">{area.improvement}</span>
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    {area.count} times
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Analytics