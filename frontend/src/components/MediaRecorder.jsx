import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Video, Square, Play, Pause, RotateCcw, Upload, AlertCircle, Brain, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const InterviewMediaRecorder = ({ 
  onRecordingComplete, 
  onAnalysisComplete,
  mode = 'both', // 'audio', 'video', or 'both'
  maxDuration = 300, // 5 minutes default
  disabled = false,
  enableRealTimeAnalysis = true
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordingMode, setRecordingMode] = useState(mode === 'audio' ? 'audio' : 'video') // Set default based on mode prop
  const [isPlaying, setIsPlaying] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [realtimeAnalysis, setRealtimeAnalysis] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Check browser compatibility on mount
  useEffect(() => {
    const checkBrowserSupport = () => {
      if (!window.MediaRecorder) {
        setBrowserSupported(false)
        setErrorMessage('MediaRecorder is not supported in this browser. Please use Chrome, Firefox, or Safari.')
        return
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setBrowserSupported(false)
        setErrorMessage('getUserMedia is not supported in this browser. Please use a modern browser.')
        return
      }
      
      setBrowserSupported(true)
      setErrorMessage('')
    }
    
    checkBrowserSupport()
    
    // Check if camera and microphone permissions are already granted
    if (navigator.permissions && navigator.permissions.query) {
      Promise.all([
        navigator.permissions.query({ name: 'camera' }),
        navigator.permissions.query({ name: 'microphone' })
      ])
      .then(([cameraPermission, microphonePermission]) => {
        if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
          setErrorMessage('Camera or microphone access has been denied. Please reset permissions in your browser settings.')
        }
      })
      .catch(err => console.error('Error checking permissions:', err))
    }
  }, [])
  
  // Initialize media devices when recording mode changes
  useEffect(() => {
    // Pre-initialize media devices when mode changes to prevent blank screen
    if (recordingMode === 'video' && !isRecording) {
      // Just request camera access to warm up the device
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      }).then(stream => {
        // Just show the stream briefly then release it
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
        }
        // Don't store this stream in streamRef as it's just for initialization
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
        }, 500);
      }).catch(err => {
        console.warn('Pre-initialization failed:', err);
        // This is just a warm-up, so we don't need to show errors
      });
    }
  }, [recordingMode, isRecording])

  // Get user media based on recording mode
  const getUserMedia = async (mode) => {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      toast.error('MediaRecorder not supported in this browser');
      throw new Error('MediaRecorder is not supported in this browser. Please use Chrome, Firefox, or Safari.');
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Media devices not supported in this browser');
      throw new Error('getUserMedia is not supported in this browser. Please use a modern browser.');
    }

    // Set a more permissive constraint to improve compatibility
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: mode === 'video' ? {
        width: { ideal: 640 }, // Lower resolution for better compatibility
        height: { ideal: 480 },
        frameRate: { ideal: 24 },
        facingMode: 'user'
      } : false
    }
    
    console.log(`Attempting to access media with constraints:`, constraints);

    try {
      // Request permission first with a timeout to handle browser delays
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Media access timeout')), 10000)
        )
      ]);
      
      streamRef.current = stream;
      
      // Verify we actually got tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log(`Stream obtained - Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`);
      
      if (mode === 'video' && videoTracks.length === 0) {
        toast.error('No video captured. Check camera connection');
        throw new Error('Camera access was granted but no video could be captured.');
      }
      
      if (audioTracks.length === 0) {
        toast.error('No audio captured. Check microphone connection');
        throw new Error('Microphone access was granted but no audio could be captured.');
      }
      
      // Initialize video element if in video mode
      if (mode === 'video' && videoRef.current) {
        // Reset video element first
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        
        // Set new stream
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute to prevent feedback
        
        // Play video with retry logic
        const playVideo = async () => {
          try {
            await videoRef.current.play();
            console.log('Video playback started successfully');
          } catch (e) {
            console.error('Error playing video:', e);
            toast.error('Error displaying camera feed. Retrying...');
            // Retry after a short delay
            setTimeout(playVideo, 1000);
          }
        };
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video element loaded metadata successfully');
          playVideo();
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          toast.error('Video error: Please refresh and try again');
        };
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      let errorMessage = `Cannot access ${mode === 'video' ? 'camera and microphone' : 'microphone'}.`;
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage += ' Please allow camera/microphone permissions and try again.';
          toast.error('Permission denied. Please check browser settings.');
          break;
        case 'NotFoundError':
          errorMessage += ' No camera or microphone found. Please check your device connections.';
          break;
        case 'NotReadableError':
          errorMessage += ' Camera or microphone is already in use by another application. Please close other applications that might be using your camera/microphone.';
          break;
        case 'OverconstrainedError':
          errorMessage += ' Your camera does not meet the required constraints. Try using a different camera.';
          break;
        case 'AbortError':
          errorMessage += ' Hardware error occurred while accessing your media devices.';
          break;
        case 'SecurityError':
          errorMessage += ' Media access is not allowed in this context. Try using HTTPS instead of HTTP.';
          break;
        case 'TypeError':
          errorMessage += ' Invalid constraints were used.';
          break;
        default:
          errorMessage += ' Please check permissions and try again.';
      }
      
      // Set the error message in component state
      setErrorMessage(errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  // Check for common media device issues
  const checkMediaDeviceIssues = async () => {
    try {
      // Check if devices are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      let issues = [];
      
      // Check for device availability
      if (recordingMode === 'video' && videoDevices.length === 0) {
        issues.push('No camera detected. Please connect a camera and refresh the page.');
      }
      
      if (audioDevices.length === 0) {
        issues.push('No microphone detected. Please connect a microphone and refresh the page.');
      }
      
      // Check for permission status if browser supports it
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = recordingMode === 'video' ? 
            await navigator.permissions.query({ name: 'camera' }) : null;
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          
          if (cameraPermission && cameraPermission.state === 'denied') {
            issues.push('Camera access is blocked. Please allow camera access in your browser settings.');
          }
          
          if (microphonePermission.state === 'denied') {
            issues.push('Microphone access is blocked. Please allow microphone access in your browser settings.');
          }
        } catch (permError) {
          console.warn('Could not check permissions:', permError);
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Error checking media device issues:', error);
      return ['Could not check media devices. Please ensure your browser supports camera and microphone access.'];
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Reset any previous errors
      setErrorMessage('');
      
      // Check for issues before attempting to record
      const issues = await checkMediaDeviceIssues();
      if (issues.length > 0) {
        setErrorMessage(issues.join('\n'));
        toast.error('Camera or microphone issues detected');
        return;
      }
      
      cleanup() // Clean up any existing streams
      chunksRef.current = []
      
      // Add a small delay before accessing media devices to ensure browser is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stream = await getUserMedia(recordingMode)
      
      // Check supported MIME types
      const mimeTypes = [
        recordingMode === 'video' ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus',
        recordingMode === 'video' ? 'video/webm;codecs=vp8,opus' : 'audio/webm',
        recordingMode === 'video' ? 'video/webm' : 'audio/wav'
      ]
      
      let selectedMimeType = null
      for (const mimeType of mimeTypes) {
        if (window.MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }
      
      if (!selectedMimeType) {
        selectedMimeType = recordingMode === 'video' ? 'video/webm' : 'audio/webm'
      }
      
      const mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: selectedMimeType
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log(`Received data chunk: ${event.data.size} bytes`)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: selectedMimeType // Use the selected MIME type for better Whisper compatibility
        })
        setRecordedBlob(blob)
        cleanup()
      }
      
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
      toast.success(`${recordingMode === 'video' ? 'Video' : 'Audio'} recording started`)
    } catch (error) {
      toast.error(error.message)
      cleanup()
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    toast.success('Recording stopped')
  }

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return
    
    if (isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      toast.success('Recording resumed')
    } else {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      toast.success('Recording paused')
    }
  }

  // Reset recording
  const resetRecording = () => {
    cleanup()
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setRecordedBlob(null)
    setIsPlaying(false)
    chunksRef.current = []
  }

  // Play recorded media
  const playRecording = () => {
    if (!recordedBlob) return
    
    const url = URL.createObjectURL(recordedBlob)
    
    if (recordingMode === 'video' && videoRef.current) {
      videoRef.current.src = url
      videoRef.current.play()
      setIsPlaying(true)
      videoRef.current.onended = () => setIsPlaying(false)
    } else if (recordingMode === 'audio' && audioRef.current) {
      audioRef.current.src = url
      audioRef.current.play()
      setIsPlaying(true)
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }

  // Submit recording
  const submitRecording = async () => {
    if (!recordedBlob) return
    
    const recordingData = {
      blob: recordedBlob,
      type: recordingMode,
      duration: recordingTime,
      size: recordedBlob.size,
      mimeType: recordingMode === 'video' ? 'video/webm' : 'audio/webm'
    }
    
    onRecordingComplete(recordingData)
    
    // Perform analysis if enabled
    if (enableRealTimeAnalysis) {
      await performAnalysis(recordingData)
    }
  }

  // Perform multimedia analysis
  const performAnalysis = async (recordingData) => {
    try {
      setIsAnalyzing(true)
      setUploadProgress(0)
      
      // Skip validation if blob type is empty - this prevents blank pages
      // We'll rely on the recordingMode which is already set correctly
      if (recordingData.blob.type) {
        const blobType = recordingData.blob.type;
        
        if (recordingMode === 'audio' && !blobType.includes('audio')) {
          toast.error('Only audio files are allowed for audio interviews')
          setIsAnalyzing(false)
          return
        }
        
        if (recordingMode === 'video' && !blobType.includes('video')) {
          toast.error('Only video files are allowed for video interviews')
          setIsAnalyzing(false)
          return
        }
      }
      
      // Enhanced logging for blob details
      console.log('Analysis blob details:', {
        type: recordingData.blob.type,
        size: recordingData.blob.size,
        lastModified: recordingData.blob.lastModified,
        duration: recordingData.duration,
        mimeType: recordingData.mimeType
      })
      
      const formData = new FormData()
      
      // Create a new blob with explicit type to ensure compatibility
      // Use a more compatible format for Whisper
      const mediaType = recordingMode === 'video' ? 'video/webm' : 'audio/webm;codecs=opus'
      const newBlob = new Blob([recordingData.blob], { type: mediaType })
      
      // Append the blob with a specific filename to help server identify format
      const filename = recordingMode === 'video' ? 
        `video_${Date.now()}.webm` : 
        `audio_${Date.now()}.webm`
      
      formData.append(recordingMode, newBlob, filename)
      console.log(`Appended ${recordingMode} blob as ${filename} with type ${mediaType}`)
      
      // Add more detailed options for better server-side handling
      const options = {
        language: 'en-US',
        includeSpeech: true,
        includeNLP: true,
        format: 'webm',
        codec: 'opus',
        sampleRate: 48000,
        duration: recordingData.duration || recordingTime || 0, // Use recordingTime as fallback
        includePerformanceScore: true // Enable performance scoring
      }
      
      formData.append('options', JSON.stringify(options))
      console.log('Analysis options:', options)
      
      // Log FormData contents for debugging
      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, typeof value === 'object' ? 
          `${value.constructor.name} (${value.size || 0} bytes)` : value)
      }
      
      const endpoint = recordingMode === 'video' ? '/multimedia/analyze-video' : '/multimedia/analyze-speech'
      console.log(`Sending request to ${endpoint}`)
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
          console.log(`Upload progress: ${progress}%`)
        },
        timeout: 60000 // 60 second timeout
      })
      
      console.log('Server response:', response.data)
      
      if (response.data.success) {
        setAnalysisResults(response.data.analysis)
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data.analysis)
        }
        toast.success('Analysis completed successfully!')
      } else {
        console.error('Analysis failed with error:', response.data.error || 'Unknown error')
        console.error('Error details:', response.data)
        
        // Show more detailed error message
        const errorMessage = response.data.message || 'Analysis failed'
        const errorDetails = response.data.details ? `: ${JSON.stringify(response.data.details)}` : ''
        toast.error(`${errorMessage}${errorDetails}`, { duration: 5000 })
        
        // Show troubleshooting tips if available
        if (response.data.troubleshooting) {
          Object.entries(response.data.troubleshooting).forEach(([key, tip]) => {
            setTimeout(() => toast.error(`Tip: ${tip}`, { duration: 4000 }), 1000)
          })
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      console.error('Error stack:', error.stack)
      console.error('Error details:', error.response?.data || error.message)
      
      // Enhanced error display
      const errorMessage = error.response?.data?.message || error.message
      toast.error(`Analysis failed: ${errorMessage}`, { duration: 5000 })
      
      // Show troubleshooting tips
      const tips = [
        'Try recording again with clearer audio',
        'Ensure your microphone is working properly',
        'Try a shorter recording'
      ]
      
      // Show tips with delay between each
      if (error.response?.status === 500) {
        setTimeout(() => toast.error('Server error: The analysis service might be temporarily unavailable', { duration: 4000 }), 1000)
      } else {
        setTimeout(() => toast.error(tips[0], { duration: 4000 }), 1000)
      }
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(0)
    }
  }

  // Real-time analysis during recording (simplified)
  const [analysisText, setAnalysisText] = useState('')
  
  const performRealtimeAnalysis = useCallback(async () => {
    if (!enableRealTimeAnalysis || !analysisText.trim()) return
    
    try {
      const response = await api.post('/multimedia/analyze-text', {
        text: analysisText,
        options: {
          realtime: true
        }
      })
      
      if (response.data.success) {
        setRealtimeAnalysis(response.data.analysis.insights)
      }
    } catch (error) {
      console.warn('Real-time analysis failed:', error.message)
    }
  }, [analysisText, enableRealTimeAnalysis])

  // Trigger real-time analysis when text changes
  useEffect(() => {
    if (enableRealTimeAnalysis && analysisText.trim() && !isRecording) {
      const debounceTimer = setTimeout(performRealtimeAnalysis, 1000)
      return () => clearTimeout(debounceTimer)
    }
  }, [analysisText, enableRealTimeAnalysis, isRecording, performRealtimeAnalysis])

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const maxTimeFormatted = formatTime(maxDuration)
  const currentTimeFormatted = formatTime(recordingTime)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Browser compatibility warning */}
      {!browserSupported && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Browser Not Supported</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {recordingMode === 'video' ? 'Video Response' : 'Audio Response'}
        </h3>
        
        {mode === 'both' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setRecordingMode('audio')}
              disabled={isRecording || disabled || !browserSupported}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                recordingMode === 'audio'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setRecordingMode('video')}
              disabled={isRecording || disabled || !browserSupported}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                recordingMode === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Display */}
      <div className="relative">
        {recordingMode === 'video' ? (
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            autoPlay
            muted={isRecording} // Mute during recording to prevent feedback
            playsInline
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Mic className={`w-16 h-16 mx-auto mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <p className="text-gray-600">
                {isRecording ? 'Recording audio...' : 'Ready to record audio'}
              </p>
            </div>
          </div>
        )}
        
        {/* Recording indicator */}
        {isRecording && !isPaused && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>REC {currentTimeFormatted}</span>
          </div>
        )}
        
        {isPaused && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
            <Pause className="w-3 h-3" />
            <span>PAUSED {currentTimeFormatted}</span>
          </div>
        )}
      </div>

      {/* Timer and Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{currentTimeFormatted}</span>
          <span className="mx-2">/</span>
          <span>{maxTimeFormatted}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isRecording && !recordedBlob && (
            <button
              onClick={startRecording}
              disabled={disabled || !browserSupported}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {recordingMode === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>Start Recording</span>
            </button>
          )}
          
          {isRecording && (
            <>
              <button
                onClick={togglePause}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </>
          )}
          
          {recordedBlob && (
            <>
              <button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>{isPlaying ? 'Playing...' : 'Play'}</span>
              </button>
              
              <button
                onClick={resetRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              
              <button
                onClick={submitRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Real-time analysis panel */}
      {enableRealTimeAnalysis && realtimeAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Real-time Analysis</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Overall Score:</span>
              <span className="ml-2 font-semibold text-blue-800">{realtimeAnalysis.overallScore}/10</span>
            </div>
            <div>
              <span className="text-gray-600">Professionalism:</span>
              <span className="ml-2 font-semibold text-blue-800">{realtimeAnalysis.keyMetrics?.professionalismScore || 'N/A'}</span>
            </div>
          </div>
          {realtimeAnalysis.improvements && realtimeAnalysis.improvements.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-1">Quick Tips:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                {realtimeAnalysis.improvements.slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Analysis progress */}
      {isAnalyzing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-yellow-600 animate-spin" />
            <h4 className="text-sm font-semibold text-yellow-900">Analyzing {recordingMode}...</h4>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing analysis...'}
          </p>
        </div>
      )}

      {/* Analysis results */}
      {analysisResults && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-semibold text-green-900">Analysis Complete</h4>
          </div>
          
          {/* Quick insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {analysisResults.insights && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {analysisResults.insights.overallScore}/10
                  </div>
                  <div className="text-xs text-gray-600">Overall Score</div>
                </div>
                
                {analysisResults.speech?.speechCharacteristics && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-700">
                      {analysisResults.speech.speechCharacteristics.wordsPerMinute} WPM
                    </div>
                    <div className="text-xs text-gray-600">Speaking Pace</div>
                  </div>
                )}
                
                {analysisResults.video?.overallAssessment && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-700">
                      {analysisResults.video.overallAssessment.grade}
                    </div>
                    <div className="text-xs text-gray-600">Body Language</div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Key findings */}
          {analysisResults.insights?.keyFindings && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Findings:</p>
              <div className="space-y-1">
                {analysisResults.insights.keyFindings.slice(0, 3).map((finding, index) => (
                  <p key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-green-500 mr-1 flex-shrink-0">✓</span>
                    {finding}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {analysisResults.insights?.improvements && analysisResults.insights.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Recommendations:</p>
              <div className="space-y-1">
                {analysisResults.insights.improvements.slice(0, 2).map((rec, index) => (
                  <p key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-1 flex-shrink-0">→</span>
                    {typeof rec === 'string' ? rec : rec.suggestion || rec}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Recording info */}
      {recordedBlob && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Recording ready:</span>
            <span>{recordingMode === 'video' ? 'Video' : 'Audio'} • {currentTimeFormatted} • {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewMediaRecorder