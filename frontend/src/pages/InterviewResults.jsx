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
  Zap,
  Star
} from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { getPerformanceGrade, calculateOverallGradeFromScores } from '../utils/gradeUtils'

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
        
        setInterview(interviewData)
      } catch (error) {
        console.error('Failed to load interview results:', error)
        
        let message = 'Failed to load interview results'
        if (error.response?.data?.message) {
          message = error.response.data.message
        } else if (error.code === 'ERR_NETWORK') {
          message = 'Cannot connect to server. Please check if the backend is running.'
        }
        
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadInterviewResults()
    }
  }, [id, navigate])

  // Calculate overall statistics
  const calculateOverallStats = (questions) => {
    const answeredQuestions = questions.filter(q => q.response && q.analysis)
    
    if (answeredQuestions.length === 0) {
      return {
        avgConfidence: 0,
        avgClarity: 0,
        avgPresence: 0,
        avgAnswerScore: 0,
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

    // Calculate average answer score
    const questionsWithScores = answeredQuestions.filter(q => q.analysis?.answerScore?.score !== undefined)
    const avgAnswerScore = questionsWithScores.length > 0
      ? questionsWithScores.reduce((sum, q) => sum + (q.analysis.answerScore.score || 0), 0) / questionsWithScores.length
      : 0

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
      avgConfidence: parseFloat(avgConfidence.toFixed(1)),
      avgClarity: parseFloat(avgClarity.toFixed(1)),
      avgPresence: parseFloat(avgPresence.toFixed(1)),
      avgAnswerScore: parseFloat(avgAnswerScore.toFixed(1)),
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
    const downloadGrade = getPerformanceGrade(downloadStats.avgConfidence, downloadStats.avgClarity, downloadStats.avgAnswerScore)
    
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
    content += 'Answer Quality: ' + downloadStats.avgAnswerScore + '/10\\n'
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
        content += 'Clarity: ' + (question.analysis.communication?.clarity?.toFixed(1) || 0) + '/10\\n'
        if (question.analysis.answerScore?.score !== undefined) {
          content += 'Answer Quality: ' + question.analysis.answerScore.score.toFixed(1) + '/10 (' + (question.analysis.answerScore.grade || 'N/A') + ')\\n'
        }
        content += '\\n'
        
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
    const shareGrade = getPerformanceGrade(shareStats.avgConfidence, shareStats.avgClarity, shareStats.avgAnswerScore)
    
    const shareText = '🎯 Interview Results Summary\\n\\n📋 ' + interview.title + '\\n🎓 Grade: ' + shareGrade.grade + '\\n💪 Confidence: ' + shareStats.avgConfidence + '/10\\n🗣️ Clarity: ' + shareStats.avgClarity + '/10\\n⭐ Answer Quality: ' + shareStats.avgAnswerScore + '/10\\n✅ Completed: ' + shareStats.answeredCount + '/' + shareStats.totalCount + ' questions\\n\\nPractice makes perfect! 🚀'

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
  const performanceGrade = getPerformanceGrade(stats.avgConfidence, stats.avgClarity, stats.avgAnswerScore)

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
        <div className="flex items-center space-x-3">
          <button
            onClick={shareResults}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button
            onClick={downloadResults}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Interview Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{interview.title}</h1>
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
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {stats.avgAnswerScore}/10
            </div>
            <div className="text-sm text-gray-600">Answer Quality</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.answeredCount}/{stats.totalCount}
            </div>
            <div className="text-sm text-gray-600">Answered</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {formatTime(stats.avgResponseTime)}
            </div>
            <div className="text-sm text-gray-600">Avg. Time</div>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      {interview.feedback?.ai && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Feedback Summary</h3>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700">{interview.feedback.ai.summary}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {interview.feedback.ai.recommendations?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  Key Recommendations
                </h4>
                <ul className="space-y-2">
                  {interview.feedback.ai.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {interview.feedback.ai.nextSteps?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-green-500" />
                  Next Steps
                </h4>
                <ul className="space-y-2">
                  {interview.feedback.ai.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question-by-Question Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Question-by-Question Analysis</h3>
        
        <div className="space-y-8">
          {interview.questions.map((question, index) => {
            const hasResponse = question.response && question.analysis;
            
            return (
              <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Question {index + 1}: {question.text}
                    </h4>
                    {question.category && (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {question.category}
                      </span>
                    )}
                  </div>
                  
                  {hasResponse && question.analysis.answerScore?.grade && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      question.analysis.answerScore.grade === 'A+' || question.analysis.answerScore.grade === 'A' || question.analysis.answerScore.grade === 'A-' ? 'bg-green-100 text-green-800' :
                      question.analysis.answerScore.grade === 'B+' || question.analysis.answerScore.grade === 'B' || question.analysis.answerScore.grade === 'B-' ? 'bg-blue-100 text-blue-800' :
                      question.analysis.answerScore.grade === 'C+' || question.analysis.answerScore.grade === 'C' || question.analysis.answerScore.grade === 'C-' ? 'bg-yellow-100 text-yellow-800' :
                      question.analysis.answerScore.grade === 'D+' || question.analysis.answerScore.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.analysis.answerScore.grade}
                    </div>
                  )}
                </div>
                
                {hasResponse ? (
                  <>
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Your Response:</h5>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{question.response.text}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatTime(question.response.duration || 0)}</span>
                          <span className="mx-2">•</span>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          <span>{question.analysis.communication?.wordCount || 0} words</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {question.analysis.confidence?.score?.toFixed(1) || 0}/10
                        </div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {question.analysis.communication?.clarity?.toFixed(1) || 0}/10
                        </div>
                        <div className="text-xs text-gray-600">Clarity</div>
                      </div>
                      {question.analysis.answerScore?.score !== undefined ? (
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-lg font-bold text-yellow-600">
                            {question.analysis.answerScore.score.toFixed(1)}/10
                          </div>
                          <div className="text-xs text-gray-600">Answer Quality</div>
                        </div>
                      ) : (
                        <div className="text-center p-3 bg-gray-100 rounded-lg">
                          <div className="text-lg font-bold text-gray-500">
                            N/A
                          </div>
                          <div className="text-xs text-gray-600">Answer Quality</div>
                        </div>
                      )}
                    </div>
                    
                    {question.analysis.answerScore?.feedback && (
                      <div className="mb-6">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Answer Quality Feedback
                        </h5>
                        <p className="text-sm text-gray-700 mb-2">
                          {question.analysis.answerScore.feedback}
                        </p>
                        {question.analysis.answerScore.grade && (
                          <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                            Grade: {question.analysis.answerScore.grade}
                          </div>
                        )}
                      </div>
                    )}

                    {(question.analysis.strengths?.length > 0 || question.analysis.suggestedImprovements?.length > 0) && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {question.analysis.strengths?.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Strengths
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {question.analysis.strengths.slice(0, 3).map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {question.analysis.suggestedImprovements?.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <Target className="w-4 h-4 mr-2 text-blue-500" />
                              Improvement Areas
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {question.analysis.suggestedImprovements.slice(0, 3).map((improvement, index) => (
                                <li key={index}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Question not answered</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default InterviewResults