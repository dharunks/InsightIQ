import { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, User, Activity, AlertTriangle, CheckCircle, Target, TrendingUp, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const BodyLanguageAnalyzer = ({ 
  videoStream = null, 
  isRecording = false,
  onAnalysisUpdate = null,
  enableRealTimeAnalysis = true,
  analysisInterval = 2000 // Analyze every 2 seconds
}) => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [overallTrends, setOverallTrends] = useState({
    posture: [],
    eyeContact: [],
    gestures: [],
    expressions: []
  })

  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const analysisIntervalRef = useRef(null)
  const frameCount = useRef(0)

  // Simulate real-time body language analysis
  const simulateBodyLanguageAnalysis = useCallback(async () => {
    if (!enableRealTimeAnalysis || !isRecording) return

    setIsAnalyzing(true)
    
    // Simulate analysis processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate realistic analysis data based on current frame count
    const timestamp = Date.now()
    const frameVariation = Math.sin(frameCount.current * 0.1) * 0.5 + 0.5 // Smooth variation
    
    const analysis = {
      timestamp,
      posture: {
        score: Math.max(1, Math.min(10, 6.5 + frameVariation * 3 + (Math.random() - 0.5))),
        alignment: 'good',
        confidence: 0.75 + Math.random() * 0.2
      },
      eyeContact: {
        score: Math.max(1, Math.min(10, 7 + frameVariation * 2 + (Math.random() - 0.5))),
        directness: frameVariation > 0.6 ? 'excellent' : frameVariation > 0.3 ? 'good' : 'fair',
        consistency: 0.7 + frameVariation * 0.3
      },
      facialExpression: {
        dominant: frameVariation > 0.7 ? 'confident' : frameVariation > 0.4 ? 'neutral' : frameVariation > 0.2 ? 'focused' : 'slight_concern',
        appropriateness: frameVariation > 0.3 ? 'appropriate' : 'could_improve',
        intensity: frameVariation * 0.8 + 0.2
      },
      gestures: {
        score: Math.max(1, Math.min(10, 6 + frameVariation * 3.5 + (Math.random() - 0.5))),
        naturalness: frameVariation > 0.5 ? 'natural' : 'slightly_tense',
        frequency: Math.floor(frameVariation * 5) + 1
      },
      engagement: {
        level: Math.max(1, Math.min(10, 7.5 + frameVariation * 2 + (Math.random() - 0.5))),
        indicators: ['active_listening', 'responsive_expressions'],
        overall: frameVariation > 0.6 ? 'highly_engaged' : frameVariation > 0.3 ? 'engaged' : 'moderately_engaged'
      },
      overall: {
        score: 0,
        grade: 'B',
        confidence: 0.8
      }
    }

    // Calculate overall score
    analysis.overall.score = (
      analysis.posture.score + 
      analysis.eyeContact.score + 
      analysis.gestures.score + 
      analysis.engagement.level
    ) / 4

    analysis.overall.grade = getGradeFromScore(analysis.overall.score)

    setCurrentAnalysis(analysis)
    setAnalysisHistory(prev => [...prev.slice(-19), analysis]) // Keep last 20 analyses
    
    // Update trends
    setOverallTrends(prev => ({
      posture: [...prev.posture.slice(-9), analysis.posture.score],
      eyeContact: [...prev.eyeContact.slice(-9), analysis.eyeContact.score],
      gestures: [...prev.gestures.slice(-9), analysis.gestures.score],
      expressions: [...prev.expressions.slice(-9), analysis.facialExpression.intensity * 10]
    }))

    if (onAnalysisUpdate) {
      onAnalysisUpdate(analysis)
    }

    frameCount.current++
    setIsAnalyzing(false)
  }, [enableRealTimeAnalysis, isRecording, onAnalysisUpdate])

  // Start/stop analysis based on recording state
  useEffect(() => {
    if (isRecording && enableRealTimeAnalysis) {
      // Start analysis interval
      analysisIntervalRef.current = setInterval(simulateBodyLanguageAnalysis, analysisInterval)
      
      return () => {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current)
          analysisIntervalRef.current = null
        }
      }
    } else {
      // Stop analysis
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
        analysisIntervalRef.current = null
      }
    }
  }, [isRecording, enableRealTimeAnalysis, simulateBodyLanguageAnalysis, analysisInterval])

  // Helper functions
  const getGradeFromScore = (score) => {
    if (score >= 9) return 'A+'
    if (score >= 8.5) return 'A'
    if (score >= 8) return 'A-'
    if (score >= 7.5) return 'B+'
    if (score >= 7) return 'B'
    if (score >= 6.5) return 'B-'
    if (score >= 6) return 'C+'
    return 'C'
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100 border-green-200'
    if (score >= 6.5) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  const getTrendIcon = (scores) => {
    if (scores.length < 3) return <Activity className="w-4 h-4 text-gray-500" />
    
    const recent = scores.slice(-3)
    const trend = recent[2] - recent[0]
    
    if (trend > 0.5) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend < -0.5) return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getRecommendation = (analysis) => {
    if (!analysis) return null

    const recommendations = []
    
    if (analysis.posture.score < 7) {
      recommendations.push('Straighten your posture')
    }
    if (analysis.eyeContact.score < 7) {
      recommendations.push('Maintain eye contact with camera')
    }
    if (analysis.gestures.naturalness === 'slightly_tense') {
      recommendations.push('Relax your hand gestures')
    }
    if (analysis.facialExpression.appropriateness === 'could_improve') {
      recommendations.push('Show more confident expressions')
    }

    return recommendations.length > 0 ? recommendations[0] : 'Great body language! Keep it up!'
  }

  if (!enableRealTimeAnalysis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Camera className="w-5 h-5" />
          <span className="text-sm">Real-time analysis disabled</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold">Body Language Analysis</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
            <span className="text-white text-xs">
              {isRecording ? 'Live Analysis' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Analysis Dashboard */}
        {currentAnalysis ? (
          <>
            {/* Overall Score */}
            <div className={`rounded-lg border p-4 ${getScoreBgColor(currentAnalysis.overall.score)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-800">Overall Performance</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-2xl font-bold ${getScoreColor(currentAnalysis.overall.score)}`}>
                      {currentAnalysis.overall.score.toFixed(1)}/10
                    </span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${getScoreColor(currentAnalysis.overall.score)} bg-white`}>
                      {currentAnalysis.overall.grade}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="font-semibold text-gray-800">
                    {Math.round(currentAnalysis.overall.confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {/* Posture */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Posture</span>
                  </div>
                  {getTrendIcon(overallTrends.posture)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(currentAnalysis.posture.score)}`}>
                    {currentAnalysis.posture.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-blue-700 capitalize">
                    {currentAnalysis.posture.alignment}
                  </span>
                </div>
              </div>

              {/* Eye Contact */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Eye Contact</span>
                  </div>
                  {getTrendIcon(overallTrends.eyeContact)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(currentAnalysis.eyeContact.score)}`}>
                    {currentAnalysis.eyeContact.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-green-700 capitalize">
                    {currentAnalysis.eyeContact.directness}
                  </span>
                </div>
              </div>

              {/* Gestures */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Gestures</span>
                  </div>
                  {getTrendIcon(overallTrends.gestures)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(currentAnalysis.gestures.score)}`}>
                    {currentAnalysis.gestures.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-purple-700 capitalize">
                    {currentAnalysis.gestures.naturalness.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Engagement</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${getScoreColor(currentAnalysis.engagement.level)}`}>
                    {currentAnalysis.engagement.level.toFixed(1)}
                  </span>
                  <span className="text-xs text-orange-700 capitalize">
                    {currentAnalysis.engagement.overall.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Recommendation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-800 mb-1">Real-time Tip</div>
                  <div className="text-sm text-gray-600">
                    {getRecommendation(currentAnalysis)}
                  </div>
                </div>
              </div>
            </div>

            {/* Facial Expression */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-medium text-indigo-800">Expression</span>
                </div>
                <span className="text-sm text-indigo-700 capitalize">
                  {currentAnalysis.facialExpression.dominant.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-indigo-600">
                  {currentAnalysis.facialExpression.appropriateness === 'appropriate' ? 'Appropriate' : 'Could improve'}
                </div>
                <div className="text-xs text-indigo-600">
                  Intensity: {Math.round(currentAnalysis.facialExpression.intensity * 10)}/10
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Waiting State */
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mb-3" />
            <div className="text-center">
              <div className="font-medium mb-1">Ready for Analysis</div>
              <div className="text-sm">
                {isRecording ? 'Analyzing your body language...' : 'Start recording to begin real-time analysis'}
              </div>
            </div>
          </div>
        )}

        {/* Analysis History Summary */}
        {analysisHistory.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Session Summary</span>
              <span className="text-xs text-gray-500">{analysisHistory.length} analyses</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-500">Avg Posture</div>
                <div className="font-semibold text-blue-600">
                  {(overallTrends.posture.reduce((a, b) => a + b, 0) / overallTrends.posture.length || 0).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Eye Contact</div>
                <div className="font-semibold text-green-600">
                  {(overallTrends.eyeContact.reduce((a, b) => a + b, 0) / overallTrends.eyeContact.length || 0).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Gestures</div>
                <div className="font-semibold text-purple-600">
                  {(overallTrends.gestures.reduce((a, b) => a + b, 0) / overallTrends.gestures.length || 0).toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Consistency</div>
                <div className="font-semibold text-gray-600">
                  {analysisHistory.length > 3 ? 'Good' : 'Building...'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BodyLanguageAnalyzer