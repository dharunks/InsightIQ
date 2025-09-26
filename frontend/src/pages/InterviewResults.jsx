import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Clock,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Share2,
  Video,
  Mic,
  Eye,
  User,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'

const InterviewResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load interview results
  useEffect(() => {
    const loadInterviewResults = async () => {
      try {
        const response = await api.get(`/interviews/${id}`)
        const interviewData = response.data.interview
        
        // Only show results for completed interviews
        if (interviewData.status !== 'completed') {
          toast.error('Interview is not completed yet')
          navigate(`/interview/${id}`)
          return
        }
        
        // Validate that interview has questions with analysis
        if (!interviewData.questions || interviewData.questions.length === 0) {
          toast.error('No questions found in this interview')
          navigate('/interviews')
          return
        }
        
        // Check if any questions have analysis
        const hasAnalysis = interviewData.questions.some(q => q.analysis)
        if (!hasAnalysis) {
          toast.error('Interview analysis is not available')
          navigate(`/interview/${id}`)
          return
        }
        
        setInterview(interviewData)
      } catch (error) {
        console.error('Failed to load interview results:', error)
        toast.error('Failed to load interview results. Please try again later.')
        setTimeout(() => navigate('/interviews'), 2000)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadInterviewResults()
    }
  }, [id, navigate])

  // Calculate overall statistics (enhanced for multimedia)
  const calculateOverallStats = (questions) => {
    const answeredQuestions = questions.filter(q => q.response && q.analysis)
    
    if (answeredQuestions.length === 0) {
      return {
        avgConfidence: 0,
        avgClarity: 0,
        avgPresence: 0,
        totalWords: 0,
        avgResponseTime: 0,
        strengthsCount: 0,
        improvementsCount: 0,
        hasMultimedia: false,
        multimediaCount: 0,
        videoCount: 0,
        audioCount: 0
      }
    }

    const avgConfidence = answeredQuestions.reduce((sum, q) => 
      sum + (q.analysis?.confidence?.score || 0), 0) / answeredQuestions.length

    const avgClarity = answeredQuestions.reduce((sum, q) => 
      sum + (q.analysis?.communication?.clarity || 0), 0) / answeredQuestions.length

    // Calculate average presence (for video responses)
    const videoQuestions = answeredQuestions.filter(q => q.analysis?.nonVerbal)
    const avgPresence = videoQuestions.length > 0 
      ? videoQuestions.reduce((sum, q) => sum + (q.analysis.nonVerbal.overallPresence || 0), 0) / videoQuestions.length
      : 0

    const totalWords = answeredQuestions.reduce((sum, q) => 
      sum + (q.analysis?.communication?.wordCount || 0), 0)

    const avgResponseTime = answeredQuestions.reduce((sum, q) => 
      sum + (q.response?.duration || 0), 0) / answeredQuestions.length

    const allStrengths = answeredQuestions.flatMap(q => q.analysis?.strengths || [])
    const allImprovements = answeredQuestions.flatMap(q => q.analysis?.suggestedImprovements || [])

    // Count multimedia responses
    const multimediaQuestions = answeredQuestions.filter(q => 
      q.response?.audioUrl || q.response?.videoUrl
    )
    const videoCount = answeredQuestions.filter(q => q.response?.videoUrl).length
    const audioCount = answeredQuestions.filter(q => q.response?.audioUrl).length

    return {
      avgConfidence: avgConfidence.toFixed(1),
      avgClarity: avgClarity.toFixed(1),
      avgPresence: avgPresence.toFixed(1),
      totalWords,
      avgResponseTime: Math.round(avgResponseTime),
      strengthsCount: allStrengths.length,
      improvementsCount: allImprovements.length,
      answeredCount: answeredQuestions.length,
      totalCount: questions.length,
      hasMultimedia: multimediaQuestions.length > 0,
      multimediaCount: multimediaQuestions.length,
      videoCount,
      audioCount
    }
  }

  // Get performance grade
  const getPerformanceGrade = (confidence, clarity) => {
    const average = (parseFloat(confidence) + parseFloat(clarity)) / 2
    if (average >= 9) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' }
    if (average >= 8.5) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (average >= 8) return { grade: 'A-', color: 'text-green-600', bg: 'bg-green-100' }
    if (average >= 7.5) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (average >= 7) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (average >= 6.5) return { grade: 'B-', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (average >= 6) return { grade: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (average >= 5.5) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { grade: 'C-', color: 'text-red-600', bg: 'bg-red-100' }
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Download interview results
  const downloadResults = () => {
    if (!interview) return

    const downloadStats = calculateOverallStats(interview.questions)
    const downloadGrade = getPerformanceGrade(downloadStats.avgConfidence, downloadStats.avgClarity)
    
    // Create downloadable content
    let content = 'INTERVIEW RESULTS REPORT\\n========================\\n\\n'
    content += 'Interview: ' + interview.title + '\\n'
    content += 'Type: ' + interview.type.charAt(0).toUpperCase() + interview.type.slice(1) + '\\n'
    content += 'Difficulty: ' + interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1) + '\\n'
    content += 'Completed: ' + new Date(interview.completedAt).toLocaleDateString() + '\\n'
    content += 'Overall Grade: ' + downloadGrade.grade + '\\n\\n'
    
    content += 'PERFORMANCE SUMMARY\\n==================\\n'
    content += 'Confidence Score: ' + downloadStats.avgConfidence + '/10\\n'
    content += 'Clarity Score: ' + downloadStats.avgClarity + '/10\\n'
    content += 'Questions Answered: ' + downloadStats.answeredCount + '/' + downloadStats.totalCount + '\\n'
    content += 'Average Response Time: ' + formatTime(downloadStats.avgResponseTime) + '\\n'
    content += 'Total Words: ' + downloadStats.totalWords + '\\n\\n'
    
    // Add AI feedback if available
    if (interview.feedback?.ai) {
      content += 'AI FEEDBACK\\n===========\\n'
      content += interview.feedback.ai.summary + '\\n\\n'
      
      if (interview.feedback.ai.recommendations?.length > 0) {
        content += 'RECOMMENDATIONS:\\n'
        interview.feedback.ai.recommendations.forEach((rec, i) => {
          content += (i + 1) + '. ' + rec + '\\n'
        })
        content += '\\n'
      }
      
      if (interview.feedback.ai.nextSteps?.length > 0) {
        content += 'NEXT STEPS:\\n'
        interview.feedback.ai.nextSteps.forEach((step, i) => {
          content += (i + 1) + '. ' + step + '\\n'
        })
        content += '\\n'
      }
    }
    
    content += 'QUESTION-BY-QUESTION ANALYSIS\\n==============================\\n'
    
    // Add each question analysis
    interview.questions.forEach((question, index) => {
      const hasResponse = question.response && question.analysis
      content += '\\nQuestion ' + (index + 1) + ': ' + question.text + '\\n'
      content += 'Category: ' + (question.category || 'General') + '\\n'
      
      if (hasResponse) {
        content += '\\nYour Response:\\n' + question.response.text + '\\n\\n'
        content += 'Response Time: ' + formatTime(question.response.duration || 0) + '\\n'
        content += 'Word Count: ' + (question.analysis.communication?.wordCount || 0) + '\\n'
        content += 'Confidence: ' + (question.analysis.confidence?.score?.toFixed(1) || 0) + '/10\\n'
        content += 'Clarity: ' + (question.analysis.communication?.clarity?.toFixed(1) || 0) + '/10\\n\\n'
        
        const strengths = question.analysis.strengths?.join(', ') || 'None identified'
        const improvements = question.analysis.suggestedImprovements?.join('; ') || 'None suggested'
        content += 'Strengths: ' + strengths + '\\n'
        content += 'Improvements: ' + improvements + '\\n'
      } else {
        content += '\\nNot answered\\n'
      }
      
      content += '\\n==================================================\\n'
    })
    
    content += '\\nGenerated on: ' + new Date().toLocaleString() + '\\n'
    content += 'Powered by InsightIQ\\n'

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = interview.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_results.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Interview results downloaded successfully!')
  }

  // Share results (copy to clipboard)
  const shareResults = async () => {
    if (!interview) return

    const shareStats = calculateOverallStats(interview.questions)
    const shareGrade = getPerformanceGrade(shareStats.avgConfidence, shareStats.avgClarity)
    
    const shareText = '🎯 Interview Results Summary\\n\\n📋 ' + interview.title + '\\n🎓 Grade: ' + shareGrade.grade + '\\n💪 Confidence: ' + shareStats.avgConfidence + '/10\\n🗣️ Clarity: ' + shareStats.avgClarity + '/10\\n✅ Completed: ' + shareStats.answeredCount + '/' + shareStats.totalCount + ' questions\\n\\nPractice makes perfect! 🚀'

    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('Results copied to clipboard!')
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Results copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p>Loading interview results...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-4">The interview results you're looking for don't exist.</p>
          <button 
            onClick={() => navigate('/interviews')}
            className="btn-primary"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    )
  }

  const stats = calculateOverallStats(interview.questions)
  const performanceGrade = getPerformanceGrade(stats.avgConfidence, stats.avgClarity)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/interviews')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Interviews</span>
          </button>
        </div>
        <div className="flex space-x-3">
          <button onClick={shareResults} className="btn-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </button>
          <button onClick={downloadResults} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {/* Interview Title & Summary */}
      <motion.div 
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{interview.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="capitalize">{interview.type} Interview</span>
              <span>•</span>
              <span className="capitalize">{interview.difficulty} Level</span>
              <span>•</span>
              <span>Completed on {new Date(interview.completedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${performanceGrade.color} mb-1`}>
              {performanceGrade.grade}
            </div>
            <div className="text-sm text-gray-600">Overall Grade</div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.avgConfidence}/10
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.avgClarity}/10
            </div>
            <div className="text-sm text-gray-600">Clarity</div>
          </div>
          {stats.hasMultimedia && stats.avgPresence > 0 && (
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.avgPresence}/10
              </div>
              <div className="text-sm text-gray-600">Presence</div>
            </div>
          )}
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {stats.answeredCount}/{stats.totalCount}
            </div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {formatTime(stats.avgResponseTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
        
        {/* Multimedia Summary */}
        {stats.hasMultimedia && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Multimedia Response Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Video className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700">{stats.videoCount} Video Response{stats.videoCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mic className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{stats.audioCount} Audio Response{stats.audioCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700">{stats.answeredCount - stats.multimediaCount} Text Only</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* AI Feedback Summary */}
      {interview.feedback?.ai && (
        <motion.div 
          className="card mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            AI Feedback Summary
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700">{interview.feedback.ai.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {interview.feedback.ai.recommendations?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Key Recommendations
                </h3>
                <ul className="space-y-2">
                  {interview.feedback.ai.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {interview.feedback.ai.nextSteps?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                  Next Steps
                </h3>
                <ul className="space-y-2">
                  {interview.feedback.ai.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Question-by-Question Analysis */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
          Question-by-Question Analysis
        </h2>

        <div className="space-y-6">
          {interview.questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Question {index + 1}
                    </h3>
                    {question.response?.videoUrl && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </span>
                    )}
                    {question.response?.audioUrl && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        <Mic className="w-3 h-3" />
                        <span>Audio</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{question.text}</p>
                  {question.category && (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {question.category}
                    </span>
                  )}
                </div>
                {question.analysis && (
                  <div className="flex space-x-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {question.analysis.confidence?.score?.toFixed(1) || 0}/10
                      </div>
                      <div className="text-xs text-gray-600">Confidence</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {question.analysis.communication?.clarity?.toFixed(1) || 0}/10
                      </div>
                      <div className="text-xs text-gray-600">Clarity</div>
                    </div>
                    {question.analysis.nonVerbal && (
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {question.analysis.nonVerbal.overallPresence?.toFixed(1) || 0}/10
                        </div>
                        <div className="text-xs text-gray-600">Presence</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {question.response ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Your Response:</h4>
                    <p className="text-gray-700">{question.response.text}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(question.response.duration || 0)}
                      </span>
                      <span>{question.analysis?.communication?.wordCount || 0} words</span>
                      {question.analysis?.communication?.wordsPerMinute && (
                        <span>{question.analysis.communication.wordsPerMinute} WPM</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Video/Audio specific analysis */}
                  {(question.response.videoUrl || question.response.audioUrl) && question.analysis && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        {question.response.videoUrl ? (
                          <>
                            <Video className="w-4 h-4 mr-2 text-blue-600" />
                            Video Analysis
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2 text-green-600" />
                            Audio Analysis
                          </>
                        )}
                      </h4>
                                          
                      {question.analysis.nonVerbal && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                              {question.analysis.nonVerbal.eyeContact?.score?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs text-gray-600 flex items-center justify-center">
                              <Eye className="w-3 h-3 mr-1" />
                              Eye Contact
                            </div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-lg font-bold text-indigo-600">
                              {question.analysis.nonVerbal.posture?.score?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs text-gray-600 flex items-center justify-center">
                              <User className="w-3 h-3 mr-1" />
                              Posture
                            </div>
                          </div>
                        </div>
                      )}
                                          
                      {question.analysis.mediaAnalysis && (
                        <div className="text-sm text-gray-700">
                          <p><span className="font-medium">Media Quality:</span> {question.analysis.mediaAnalysis.quality?.toFixed(1) || 'N/A'}/10</p>
                          <p><span className="font-medium">Duration:</span> {formatTime(question.analysis.mediaAnalysis.duration || 0)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {question.analysis && (
                    <>
                      {question.analysis.strengths?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            Strengths:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {question.analysis.strengths.map((strength, idx) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.analysis.suggestedImprovements?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1 text-blue-600" />
                            Improvement Areas:
                          </h4>
                          <ul className="space-y-1">
                            {question.analysis.suggestedImprovements.map((improvement, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Question not answered</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button 
          onClick={() => navigate('/analytics')}
          className="btn-primary"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Overall Analytics
        </button>
        <button 
          onClick={() => navigate('/interviews')}
          className="btn-secondary"
        >
          Practice Again
        </button>
      </div>
    </div>
  )
}

export default InterviewResults