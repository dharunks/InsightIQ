import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Camera, Video, CheckCircle, XCircle } from 'lucide-react';

const VideoRecordingDebugger = ({ onClose }) => {
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    recordedChunks: [],
    recordingTime: 0,
    error: null
  });
  const [testResults, setTestResults] = useState({
    canRecord: null,
    videoMimeTypes: [],
    estimatedStorage: null,
    testRecordingUrl: null
  });
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  
  useEffect(() => {
    checkRecordingCapabilities();
    
    return () => {
      stopRecording();
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (testResults.testRecordingUrl) {
        URL.revokeObjectURL(testResults.testRecordingUrl);
      }
    };
  }, []);
  
  const checkRecordingCapabilities = async () => {
    setLoading(true);
    try {
      // Check if MediaRecorder is supported
      const isMediaRecorderSupported = 'MediaRecorder' in window;
      
      // Get supported MIME types
      const videoTypes = [
        'video/webm',
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264',
        'video/mp4',
        'video/mp4;codecs=h264'
      ];
      
      const supportedTypes = videoTypes.filter(type => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch (e) {
          return false;
        }
      });
      
      // Estimate available storage
      let storageEstimate = null;
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        storageEstimate = {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          availableMB: Math.round((estimate.quota - estimate.usage) / (1024 * 1024))
        };
      }
      
      setTestResults({
        canRecord: isMediaRecorderSupported,
        videoMimeTypes: supportedTypes,
        estimatedStorage: storageEstimate,
        testRecordingUrl: null
      });
    } catch (error) {
      console.error('Error checking recording capabilities:', error);
      setTestResults({
        canRecord: false,
        videoMimeTypes: [],
        estimatedStorage: null,
        testRecordingUrl: null,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  const startTestRecording = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const options = { mimeType: testResults.videoMimeTypes[0] || '' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      const recordedChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        
        if (testResults.testRecordingUrl) {
          URL.revokeObjectURL(testResults.testRecordingUrl);
        }
        
        setTestResults(prev => ({
          ...prev,
          testRecordingUrl: url
        }));
        
        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          recordedChunks
        }));
      };
      
      mediaRecorder.start(1000);
      
      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingState(prev => ({
          ...prev,
          recordingTime: time
        }));
        
        // Auto-stop after 5 seconds
        if (time >= 5) {
          stopRecording();
        }
      }, 1000);
      
      setRecordingState({
        isRecording: true,
        recordedChunks: [],
        recordingTime: 0,
        error: null
      });
    } catch (error) {
      console.error('Error starting test recording:', error);
      setRecordingState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };
  
  const stopRecording = () => {
    clearInterval(timerRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const renderStatusIcon = (isAvailable) => {
    if (isAvailable) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Video Recording Diagnostics</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Testing video recording capabilities...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recording Capabilities */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Recording Capabilities
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>MediaRecorder API Support</span>
                    {renderStatusIcon(testResults.canRecord)}
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Supported Video Formats</span>
                    <span className="text-sm text-gray-600">
                      {testResults.videoMimeTypes.length > 0 
                        ? `${testResults.videoMimeTypes.length} formats` 
                        : 'None detected'}
                    </span>
                  </div>
                  
                  {testResults.estimatedStorage && (
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Available Storage</span>
                      <span className="text-sm text-gray-600">
                        {formatBytes(testResults.estimatedStorage.available)}
                      </span>
                    </div>
                  )}
                </div>
                
                {testResults.videoMimeTypes.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-1">Supported MIME Types:</h4>
                    <div className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {testResults.videoMimeTypes.map((type, index) => (
                        <div key={index} className="mb-1">{type}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Test Recording */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Test Recording
                </h3>
                
                <div className="space-y-4">
                  {recordingState.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span>Error: {recordingState.error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    {recordingState.isRecording ? (
                      <div className="text-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          muted 
                          className="w-full max-w-md h-auto border rounded"
                        ></video>
                        <div className="mt-2 text-red-500 font-medium flex items-center justify-center">
                          <span className="animate-pulse mr-2">●</span>
                          Recording: {recordingState.recordingTime}s
                        </div>
                        <button
                          onClick={stopRecording}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Stop Recording
                        </button>
                      </div>
                    ) : testResults.testRecordingUrl ? (
                      <div className="text-center">
                        <video 
                          src={testResults.testRecordingUrl} 
                          controls 
                          className="w-full max-w-md h-auto border rounded"
                        ></video>
                        <p className="mt-2 text-sm text-gray-600">
                          Test recording complete - {recordingState.recordedChunks.length} chunks recorded
                        </p>
                        <button
                          onClick={startTestRecording}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Record Again
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={startTestRecording}
                        disabled={!testResults.canRecord}
                        className={`px-4 py-2 rounded ${
                          testResults.canRecord 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Start Test Recording (5s)
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={checkRecordingCapabilities}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Tests
                </button>
                
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecordingDebugger;