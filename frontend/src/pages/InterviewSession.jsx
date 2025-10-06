import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Mic, 
  Video, 
  Play, 
  Pause, 
  Send, 
  SkipForward, 
  Clock, 
  Target,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Brain,
  Eye,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import InterviewMediaRecorder from '../components/MediaRecorder'
import BodyLanguageAnalyzer from '../components/BodyLanguageAnalyzer'
import MediaDeviceDebugger from '../components/MediaDeviceDebugger'
import VideoRecordingDebugger from '../components/VideoRecordingDebugger'
import api from '../utils/api'
import toast from 'react-hot-toast'

const InterviewSession = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Interview state
  const [interview, setInterview] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [responseMode, setResponseMode] = useState('text') // 'text', 'audio', 'video'
  const [recordedMedia, setRecordedMedia] = useState(null)
  const [bodyLanguageAnalysis, setBodyLanguageAnalysis] = useState(null)
  const [realtimeAnalysis, setRealtimeAnalysis] = useState(null)
  const [showMediaDebugger, setShowMediaDebugger] = useState(false)
  const [showVideoDebugger, setShowVideoDebugger] = useState(false)
  
  // Timer for tracking response time
  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Load interview data
  useEffect(() => {
    const loadInterview = async () => {
      try {
        const response = await api.get(`/interviews/${id}`)
        setInterview(response.data.interview)
        setIsLoading(false)
      } catch (error) {
        toast.error('Failed to load interview')
        navigate('/interviews')
      }
    }

    if (id) {
      loadInterview()
    }
  }, [id, navigate])

  // Start interview
  const startInterview = async () => {
    try {
      console.log('Starting interview with ID:', id)
      console.log('Current interview status:', interview.status)
      
      const response = await api.put(`/interviews/${id}/start`)
      console.log('Start interview response:', response.data)
      
      setInterview(prev => ({ ...prev, status: 'in-progress', startedAt: new Date() }))
      setIsRecording(true)
      toast.success('Interview started!')
    } catch (error) {
      console.error('Start interview error:', error)
      console.error('Error response:', error.response?.data)
      toast.error('Failed to start interview')
    }
  }

  // Submit response for current question
  const submitResponse = async () => {
    const hasText = response && response.trim().length > 0;
    const hasMedia = recordedMedia && recordedMedia.blob;
    const currentQuestionHasResponse = currentQuestion.response && 
      (currentQuestion.response.text || currentQuestion.response.audioUrl || currentQuestion.response.videoUrl);
    
    console.log('Submit response state:', {
      hasText,
      hasMedia, 
      currentQuestionHasResponse,
      currentQuestionIndex,
      totalQuestions: interview.questions.length,
      interviewStatus: interview.status
    });
    
    // If it's the last question and already has a response, complete the interview
    if (currentQuestionIndex === interview.questions.length - 1 && currentQuestionHasResponse && !hasText && !hasMedia) {
      console.log('Last question already answered, completing interview');
      completeInterview();
      return;
    }
    
    // Otherwise, check if we have current input to submit
    if (!hasText && !hasMedia) {
      toast.error('Please provide a text response or record audio/video')
      return
    }

    setIsSubmitting(true)
    try {
      const questionId = interview.questions[currentQuestionIndex].id
      
      // Create FormData for multipart upload
      const formData = new FormData()
      
      // Always append text field (even if empty) for consistency
      formData.append('text', response || '')
      formData.append('duration', recordedMedia?.duration || timeElapsed)
      
      // Add media file if available
      if (recordedMedia && recordedMedia.blob) {
        console.log('Adding media file:', recordedMedia.type, recordedMedia.blob.size, 'bytes')
        if (recordedMedia.type === 'video') {
          formData.append('video', recordedMedia.blob, `video_${questionId}.webm`)
        } else if (recordedMedia.type === 'audio') {
          formData.append('audio', recordedMedia.blob, `audio_${questionId}.webm`)
        }
        
        // Log FormData contents for debugging
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(key, typeof value === 'object' ? `${value.constructor.name} (${value.size || 0} bytes)` : value);
        }
      }
      
      console.log('Submitting response with:', { hasText, hasMedia, responseLength: response?.length || 0 })
      
      const result = await api.put(
        `/interviews/${id}/questions/${questionId}/response`,
        formData,
        {
          headers: {
            // Don't set Content-Type manually, let browser set it with boundary
          },
        }
      )

      console.log('Response submission result:', result.data);
      
      // Update the interview state to ensure it stays 'in-progress'
      setInterview(prev => ({
        ...prev,
        status: 'in-progress',
        questions: prev.questions.map((q, idx) => 
          idx === currentQuestionIndex 
            ? { ...q, response: result.data.question, analysis: result.data.analysis }
            : q
        )
      }));

      setAnalysis(result.data.analysis)
      toast.success('Response analyzed successfully!')
      
      // Move to next question after a short delay
      setTimeout(() => {
        nextQuestion()
      }, 3000)
    } catch (error) {
      console.error('Submit response error:', error)
      console.error('Error details:', error.response?.data)
      const errorMessage = error.response?.data?.message || 'Failed to submit response'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setResponse('')
      setTimeElapsed(0)
      setAnalysis(null)
      setIsRecording(true)
      setRecordedMedia(null)
    } else {
      completeInterview()
    }
  }

  // Handle media recording completion
  const handleRecordingComplete = (recordingData) => {
    setRecordedMedia(recordingData)
    setTimeElapsed(recordingData.duration)
    toast.success(`${recordingData.type} recording ready for submission`)
  }

  // Handle analysis completion from media recorder
  const handleAnalysisComplete = (analysisData) => {
    setAnalysis(analysisData)
    toast.success('Real-time analysis completed!')
  }

  // Handle body language analysis updates
  const handleBodyLanguageUpdate = (bodyLanguageData) => {
    setBodyLanguageAnalysis(bodyLanguageData)
  }

  // Switch response mode
  const switchResponseMode = (mode) => {
    setResponseMode(mode)
    setRecordedMedia(null)
    setResponse('')
  }

  // Complete the interview
  const completeInterview = async () => {
    try {
      console.log('Attempting to complete interview:', interview.id)
      console.log('Current interview status:', interview.status)
      console.log('Questions answered:', interview.questions.filter(q => q.response).length)
      
      const result = await api.put(`/interviews/${id}/complete`)
      console.log('Interview completion result:', result.data)
      
      toast.success('Interview completed!')
      
      // Navigate to results page instead of interviews list
      navigate(`/interviews/${id}/results`)
    } catch (error) {
      console.error('Complete interview error:', error)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = error.response?.data?.message || 'Failed to complete interview'
      toast.error(errorMessage)
      
      // If the interview is already completed, navigate to results
      if (error.response?.status === 400 && error.response?.data?.message?.includes('status')) {
        console.log('Interview already completed, navigating to results')
        navigate(`/interviews/${id}/results`)
      }
    }
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p>Loading interview...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-4">The interview you're looking for doesn't exist.</p>
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

  const currentQuestion = interview.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Media Device Debugger */}
      {showMediaDebugger && (
        <MediaDeviceDebugger onClose={() => setShowMediaDebugger(false)} />
      )}
      
      {/* Video Recording Debugger */}
      {showVideoDebugger && (
        <VideoRecordingDebugger onClose={() => setShowVideoDebugger(false)} />
      )}
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{interview.title}</h1>
            <p className="text-gray-600 capitalize">{interview.type} • {interview.difficulty}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {interview.questions.length}</div>
            <div className="text-lg font-semibold text-blue-600">{formatTime(timeElapsed)}</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Interview hasn't started */}
      {interview.status === 'draft' && (
        <motion.div 
          className="card text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ready to Start Your Interview?
          </h2>
          <p className="text-gray-600 mb-6">
            You'll have {interview.questions.length} questions to answer. Take your time and speak confidently!
          </p>
          <button 
            onClick={startInterview}
            className="btn-primary text-lg px-8 py-3"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Interview
          </button>
        </motion.div>
      )}

      {/* Active interview */}
      {interview.status === 'in-progress' && (
        <div className="space-y-6">
          {/* Current Question */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestionIndex}
              className="question-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {currentQuestion.text}
                  </p>
                  {currentQuestion.category && (
                    <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {currentQuestion.category}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Response Area */}
          <div className="response-area">
            {/* Show notification if current question already has a response */}
            {currentQuestion.response && (currentQuestion.response.text || currentQuestion.response.audioUrl || currentQuestion.response.videoUrl) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">
                    This question has already been answered
                    {currentQuestionIndex === interview.questions.length - 1 && 
                      " - You can finish the interview or provide an additional response"}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Your Response</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
                {isRecording && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>
            </div>

            {/* Response Mode Selector */}
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Response mode:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => switchResponseMode('text')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors bg-blue-600 text-white`}
                >
                  Text
                </button>
              </div>
            </div>

            {/* Text Response */}
            {responseMode === 'text' && (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here... Be specific and provide examples where possible."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            )}

            {/* Audio/Video Response */}
            {(responseMode === 'audio' || responseMode === 'video') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Media Recorder */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      {responseMode === 'video' ? 'Video' : 'Audio'} Recording
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowMediaDebugger(true)}
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Troubleshoot Camera/Mic
                      </button>
                      
                      {responseMode === 'video' && (
                        <button
                          type="button"
                          onClick={() => setShowVideoDebugger(true)}
                          className="text-xs flex items-center text-red-600 hover:text-red-800"
                        >
                          <Video className="w-3 h-3 mr-1" />
                          Debug Video Recording
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <InterviewMediaRecorder
                    mode={responseMode === 'video' ? 'video' : 'audio'}
                    onRecordingComplete={handleRecordingComplete}
                    onAnalysisComplete={handleAnalysisComplete}
                    maxDuration={300} // 5 minutes
                    disabled={isSubmitting}
                    enableRealTimeAnalysis={true}
                    key={responseMode} // Force re-mount when mode changes
                  />
                </div>
                
                {/* Real-time Analysis Panel */}
                <div className="space-y-4">
                  {/* Body Language Analysis for Video */}
                  {responseMode === 'video' && (
                    <BodyLanguageAnalyzer
                      isRecording={isRecording}
                      onAnalysisUpdate={handleBodyLanguageUpdate}
                      enableRealTimeAnalysis={true}
                      analysisInterval={3000}
                    />
                  )}
                  
                  {/* Speech Analysis Preview for Audio */}
                  {responseMode === 'audio' && response.trim() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-blue-900">Speech Preview</h4>
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Word Count:</span>
                          <span className="font-medium">{response.trim().split(/\s+/).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Speaking Time:</span>
                          <span className="font-medium">{Math.ceil(response.trim().split(/\s+/).length / 2.5)}s</span>
                        </div>
                        <div className="text-xs text-blue-700 mt-2">
                          Full analysis will be available after recording submission.
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Real-time Tips */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-green-900">Interview Tips</h4>
                    </div>
                    <ul className="text-xs text-green-800 space-y-1">
                      <li className="flex items-start"><span className="text-green-500 mr-1">•</span>Maintain eye contact with the camera</li>
                      <li className="flex items-start"><span className="text-green-500 mr-1">•</span>Speak clearly and at a moderate pace</li>
                      <li className="flex items-start"><span className="text-green-500 mr-1">•</span>Use specific examples in your answers</li>
                      {responseMode === 'video' && (
                        <li className="flex items-start"><span className="text-green-500 mr-1">•</span>Sit up straight and use natural gestures</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {recordedMedia && (
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{recordedMedia.type} ready • {formatTime(recordedMedia.duration)}</span>
                  </span>
                )}
                {!recordedMedia && currentQuestion.response && (
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Question already answered</span>
                    {currentQuestion.response.audioUrl && <span>• Audio response</span>}
                    {currentQuestion.response.videoUrl && <span>• Video response</span>}
                    {currentQuestion.response.text && <span>• Text response</span>}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                {currentQuestionIndex < interview.questions.length - 1 && (
                  <button 
                    onClick={nextQuestion}
                    className="btn-secondary"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Question
                  </button>
                )}
                <button 
                  onClick={submitResponse}
                  disabled={isSubmitting || (() => {
                    const hasCurrentText = response && response.trim().length > 0;
                    const hasCurrentMedia = recordedMedia && recordedMedia.blob;
                    const currentQuestionHasResponse = currentQuestion.response && 
                      (currentQuestion.response.text || currentQuestion.response.audioUrl || currentQuestion.response.videoUrl);
                    
                    // If it's the last question and current question already has a response, allow finishing
                    if (currentQuestionIndex === interview.questions.length - 1 && currentQuestionHasResponse) {
                      return false; // Enable the "Finish Interview" button
                    }
                    
                    // For other cases, check if we have current input
                    return !hasCurrentText && !hasCurrentMedia;
                  })()}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <div className="loading-spinner mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {currentQuestionIndex === interview.questions.length - 1 ? 
                    (currentQuestion.response && (currentQuestion.response.text || currentQuestion.response.audioUrl || currentQuestion.response.videoUrl) && !response?.trim() && !recordedMedia
                      ? 'Finish Interview' 
                      : 'Submit & Finish')
                    : 'Submit & Continue'}
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Analysis */}
          {analysis && (
            <motion.div 
              className="analysis-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-semibold text-gray-900">AI Analysis Complete</h4>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.confidence?.score?.toFixed(1) || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.communication?.clarity?.toFixed(1) || 0}/10
                  </div>
                  <div className="text-sm text-gray-600">Clarity</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.communication?.wordCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Words</div>
                </div>
              </div>
              
              {analysis.suggestedImprovements?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Quick Feedback:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {analysis.suggestedImprovements.slice(0, 2).map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Completed Interview */}
      {interview.status === 'completed' && (
        <motion.div 
          className="card text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Interview Completed! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Great job! You've completed all {interview.questions.length} questions.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate('/analytics')}
              className="btn-primary"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Analysis
            </button>
            <button 
              onClick={() => navigate('/interviews')}
              className="btn-secondary"
            >
              Back to Interviews
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default InterviewSession