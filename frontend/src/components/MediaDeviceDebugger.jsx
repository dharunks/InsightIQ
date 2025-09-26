import React, { useState, useEffect, useRef } from 'react';
import { testMediaDevices, listMediaDevices } from '../utils/mediaDeviceTest';
import { AlertCircle, Camera, Mic, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const MediaDeviceDebugger = ({ onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLiveTest, setShowLiveTest] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  useEffect(() => {
    runTests();
    return () => {
      // Clean up any active streams when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const runTests = async () => {
    setLoading(true);
    try {
      const results = await testMediaDevices();
      const devicesList = await listMediaDevices();
      
      setTestResults(results);
      setDevices(devicesList);
    } catch (error) {
      console.error('Error running media device tests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const startLiveTest = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setShowLiveTest(true);
    } catch (error) {
      console.error('Error starting live test:', error);
      alert(`Could not start live test: ${error.message}`);
    }
  };
  
  const stopLiveTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowLiveTest(false);
  };
  
  const renderStatusIcon = (isAvailable, error = null) => {
    if (isAvailable) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" title={error || 'Not available'} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Media Device Diagnostics</h2>
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
              <p>Testing media devices...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Browser Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Browser Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Browser:</div>
                  <div>{testResults?.browser?.name} {testResults?.browser?.version}</div>
                  <div>MediaDevices API:</div>
                  <div className="flex items-center">
                    {testResults?.browser?.supported ? 
                      <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Supported</span> : 
                      <span className="flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1" /> Not supported</span>}
                  </div>
                </div>
              </div>
              
              {/* Device Status */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Device Status</h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Camera Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Camera className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium">Camera</span>
                      </div>
                      {renderStatusIcon(testResults?.camera?.available, testResults?.camera?.error?.userMessage)}
                    </div>
                    
                    {testResults?.camera?.error && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <div className="font-medium">Error:</div>
                        <div>{testResults.camera.error.userMessage || testResults.camera.error.message}</div>
                      </div>
                    )}
                    
                    {devices?.videoinput && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Available cameras ({devices.videoinput.length}):</div>
                        <ul className="text-xs text-gray-600">
                          {devices.videoinput.map((device, index) => (
                            <li key={device.deviceId} className="truncate">{device.label || `Camera ${index + 1}`}</li>
                          ))}
                          {devices.videoinput.length === 0 && <li className="text-red-500">No cameras detected</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Microphone Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Mic className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium">Microphone</span>
                      </div>
                      {renderStatusIcon(testResults?.microphone?.available, testResults?.microphone?.error?.userMessage)}
                    </div>
                    
                    {testResults?.microphone?.error && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <div className="font-medium">Error:</div>
                        <div>{testResults.microphone.error.userMessage || testResults.microphone.error.message}</div>
                      </div>
                    )}
                    
                    {devices?.audioinput && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Available microphones ({devices.audioinput.length}):</div>
                        <ul className="text-xs text-gray-600">
                          {devices.audioinput.map((device, index) => (
                            <li key={device.deviceId} className="truncate">{device.label || `Microphone ${index + 1}`}</li>
                          ))}
                          {devices.audioinput.length === 0 && <li className="text-red-500">No microphones detected</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Permissions */}
              {testResults?.permissions && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Permission Status</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Camera permission:</div>
                    <div>
                      {testResults.permissions.camera === 'granted' && <span className="text-green-600">Granted</span>}
                      {testResults.permissions.camera === 'denied' && <span className="text-red-600">Denied</span>}
                      {testResults.permissions.camera === 'prompt' && <span className="text-yellow-600">Not asked yet</span>}
                    </div>
                    <div>Microphone permission:</div>
                    <div>
                      {testResults.permissions.microphone === 'granted' && <span className="text-green-600">Granted</span>}
                      {testResults.permissions.microphone === 'denied' && <span className="text-red-600">Denied</span>}
                      {testResults.permissions.microphone === 'prompt' && <span className="text-yellow-600">Not asked yet</span>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Live Test */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Live Camera & Microphone Test</h3>
                
                {showLiveTest ? (
                  <div className="space-y-4">
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      If you can see yourself and hear audio, your camera and microphone are working correctly.
                    </div>
                    <button
                      onClick={stopLiveTest}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Stop Test
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startLiveTest}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={!testResults?.browser?.supported}
                  >
                    Start Live Test
                  </button>
                )}
              </div>
              
              {/* Troubleshooting */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Troubleshooting Steps</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">1.</span>
                    <span>Check that your camera and microphone are properly connected and not being used by another application.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">2.</span>
                    <span>Ensure you've granted camera and microphone permissions to this website in your browser settings.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">3.</span>
                    <span>Try refreshing the page or using a different browser (Chrome or Firefox recommended).</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">4.</span>
                    <span>Check if your antivirus or security software is blocking camera/microphone access.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">5.</span>
                    <span>Restart your computer if the issue persists.</span>
                  </li>
                </ul>
              </div>
              
              {/* Actions */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={runTests}
                  className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Tests Again
                </button>
                
                <button
                  onClick={onClose}
                  className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

export default MediaDeviceDebugger;