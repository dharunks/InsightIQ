import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Filter, Search, MessageSquare, Clock, Target, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'

const Interview = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false)
  const [newInterview, setNewInterview] = useState({
    title: '',
    type: 'hr',
    difficulty: 'beginner',
    questionCount: 5
  })
  const [isCreating, setIsCreating] = useState(false)

  // Load interviews from API
  useEffect(() => {
    const loadInterviews = async () => {
      try {
        const response = await api.get('/interviews')
        console.log('Loaded interviews:', response.data)
        const interviews = response.data.interviews?.map(interview => ({
          ...interview,
          id: interview._id || interview.id, // Map _id to id for frontend compatibility
          questionCount: interview.questions?.length || interview.questionCount || 0
        })) || []
        setInterviews(interviews)
      } catch (error) {
        console.error('Failed to load interviews:', error)
        // Use mock data if API fails
        setInterviews([
          {
            id: 1,
            title: 'Frontend Developer Technical Interview',
            type: 'technical',
            difficulty: 'intermediate',
            status: 'completed',
            completedAt: '2024-01-20',
            grade: 'B+',
            questionCount: 8
          },
          {
            id: 2,
            title: 'Product Manager Behavioral Questions',
            type: 'behavioral',
            difficulty: 'beginner',
            status: 'completed',
            completedAt: '2024-01-18',
            grade: 'A-',
            questionCount: 6
          },
          {
            id: 3,
            title: 'Marketing Role HR Interview',
            type: 'hr',
            difficulty: 'beginner',
            status: 'draft',
            questionCount: 5
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadInterviews()
  }, [])

  // Create new interview
  const createInterview = async () => {
    if (!newInterview.title.trim()) {
      toast.error('Please enter an interview title')
      return
    }
    
    setIsCreating(true)
    try {
      console.log('Creating interview with data:', newInterview)
      const response = await api.post('/interviews', newInterview)
      console.log('Interview creation response:', response.data)
      
      setInterviews(prev => [response.data.interview, ...prev])
      setShowNewInterviewModal(false)
      setNewInterview({
        title: '',
        type: 'hr',
        difficulty: 'beginner',
        questionCount: 5
      })
      navigate(`/interview/${response.data.interview.id}`)
      toast.success('Interview created successfully!')
    } catch (error) {
      console.error('Failed to create interview:', error)
      
      let message = 'Failed to create interview'
      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running.'
      } else if (error.code === 'ECONNABORTED') {
        message = 'Connection timeout. Please check your internet connection.'
      }
      
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  // Start interview
  const startQuickInterview = async (type) => {
    const interviewData = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Interview Practice`,
      type: type,
      difficulty: 'beginner',
      questionCount: 5
    }
    
    try {
      const response = await api.post('/interviews', interviewData)
      navigate(`/interview/${response.data.interview.id}`)
      toast.success('Interview created! Let\'s start practicing.')
    } catch (error) {
      console.error('Quick interview creation failed:', error)
      
      let message = 'Failed to create interview'
      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if the backend is running.'
      }
      
      toast.error(message)
    }
  }
  const interviewTypes = [
    { value: 'technical', label: 'Technical', icon: '⚙️', description: 'Coding, system design, algorithms' },
    { value: 'behavioral', label: 'Behavioral', icon: '👥', description: 'Past experiences, soft skills' },
    { value: 'hr', label: 'HR', icon: '💼', description: 'Company culture, motivation' },
    { value: 'situational', label: 'Situational', icon: '💡', description: 'Hypothetical scenarios' }
  ]

  // Delete interview
  const deleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) {
      return
    }
    
    try {
      await api.delete(`/interviews/${interviewId}`)
      setInterviews(prev => prev.filter(interview => interview.id !== interviewId && interview._id !== interviewId))
      toast.success('Interview deleted successfully')
    } catch (error) {
      console.error('Delete interview error:', error)
      toast.error('Failed to delete interview')
    }
  }

  // Practice again (create new interview based on existing one)
  const practiceAgain = async (interview) => {
    const interviewData = {
      title: `${interview.title} (Practice Again)`,
      type: interview.type,
      difficulty: interview.difficulty,
      questionCount: interview.questionCount
    }
    
    try {
      const response = await api.post('/interviews', interviewData)
      navigate(`/interview/${response.data.interview.id}`)
      toast.success('New practice session started!')
    } catch (error) {
      console.error('Practice again failed:', error)
      
      let message = 'Failed to start practice session'
      if (error.response?.data?.message) {
        message = error.response.data.message
      }
      
      toast.error(message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'behavioral': return 'bg-green-100 text-green-800'
      case 'hr': return 'bg-blue-100 text-blue-800'
      case 'situational': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || interview.type === filterType
    const matchesDifficulty = filterDifficulty === 'all' || interview.difficulty === filterDifficulty
    return matchesSearch && matchesType && matchesDifficulty
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Practice</h1>
          <p className="text-gray-600 mt-2">
            Practice interviews and improve your skills with AI-powered feedback
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <button 
            onClick={() => setShowNewInterviewModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Interview
          </button>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {interviewTypes.map((type) => (
          <div key={type.value} className="card-hover group cursor-pointer">
            <div className="text-center">
              <div className="text-3xl mb-3">{type.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{type.label}</h3>
              <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              <button 
                onClick={() => startQuickInterview(type.value)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors"
              >
                Start Practice
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search interviews..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="hr">HR</option>
              <option value="situational">Situational</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Interviews</h3>
        
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div
              key={interview.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{interview.title}</h4>
                <div className="flex items-center space-x-2">
                  {interview.grade && (
                    <span className="status-badge bg-green-100 text-green-800">
                      {interview.grade}
                    </span>
                  )}
                  <span className={`status-badge ${getStatusColor(interview.status)}`}>
                    {interview.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span className={`status-badge ${getTypeColor(interview.type)}`}>
                  {interview.type}
                </span>
                <span className="capitalize">{interview.difficulty}</span>
                <span className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {interview.questionCount} questions
                </span>
                {interview.completedAt && (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(interview.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  {interview.status === 'completed' ? (
                    <Link
                      to={`/interview/${interview.id}/results`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Results
                    </Link>
                  ) : (
                    <Link
                      to={`/interview/${interview.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {interview.status === 'draft' ? 'Start Interview' : 'Continue'}
                    </Link>
                  )}
                  <button 
                    onClick={() => deleteInterview(interview.id)}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
                {interview.status === 'completed' && (
                  <button 
                    onClick={() => practiceAgain(interview)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Practice Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterDifficulty !== 'all' 
                ? 'No interviews match your filters' 
                : 'No interviews yet'
              }
            </p>
            <button 
              onClick={() => setShowNewInterviewModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Interview
            </button>
          </div>
        )}
      </div>

      {/* New Interview Modal */}
      {showNewInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Interview</h3>
              <button
                onClick={() => setShowNewInterviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createInterview(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Title
                  </label>
                  <input
                    type="text"
                    value={newInterview.title}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer Interview"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Type
                  </label>
                  <select
                    value={newInterview.type}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="hr">HR</option>
                    <option value="situational">Situational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={newInterview.difficulty}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={newInterview.questionCount}
                    onChange={(e) => setNewInterview(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={3}>3 Questions (Quick)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={8}>8 Questions (Comprehensive)</option>
                    <option value={10}>10 Questions (Full)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewInterviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Interview