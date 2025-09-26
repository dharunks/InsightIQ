/**
 * Utility functions for testing and listing media devices
 */

/**
 * Tests the availability and permissions of media devices
 * @returns {Promise<Object>} Object containing test results
 */
export const testMediaDevices = async () => {
  const results = {
    hasCamera: false,
    hasMicrophone: false,
    hasPermissions: false,
    browserSupport: {
      getUserMedia: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      enumerateDevices: 'mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices,
    },
    error: null
  };

  try {
    // Check if browser supports required APIs
    if (!results.browserSupport.getUserMedia) {
      throw new Error('Browser does not support getUserMedia API');
    }

    // Try to access camera and microphone
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    
    // If we got here, we have permissions
    results.hasPermissions = true;
    
    // Check what tracks we got
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    results.hasCamera = videoTracks.length > 0;
    results.hasMicrophone = audioTracks.length > 0;
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
    
  } catch (error) {
    // Handle permission errors separately
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      results.error = 'Permission denied to access media devices';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      results.error = 'No media devices found';
    } else {
      results.error = `Error accessing media devices: ${error.message}`;
    }
  }
  
  return results;
};

/**
 * Lists all available media devices
 * @returns {Promise<Object>} Object containing categorized media devices
 */
export const listMediaDevices = async () => {
  const devices = {
    videoinput: [],
    audioinput: [],
    audiooutput: [],
    error: null
  };
  
  try {
    if (!('mediaDevices' in navigator) || !('enumerateDevices' in navigator.mediaDevices)) {
      throw new Error('Browser does not support enumerateDevices API');
    }
    
    // Get device list
    const deviceList = await navigator.mediaDevices.enumerateDevices();
    
    // Categorize devices
    deviceList.forEach(device => {
      if (device.kind in devices) {
        devices[device.kind].push({
          deviceId: device.deviceId,
          groupId: device.groupId,
          label: device.label || `${device.kind} (${devices[device.kind].length + 1})`,
        });
      }
    });
    
    // If we don't have labels, we might need permissions first
    const hasLabels = deviceList.some(device => device.label);
    if (!hasLabels && deviceList.length > 0) {
      devices.error = 'Permission needed to access device labels';
    }
    
  } catch (error) {
    devices.error = `Error listing media devices: ${error.message}`;
  }
  
  return devices;
};

/**
 * Tests a specific media device by ID
 * @param {string} deviceId The device ID to test
 * @param {string} kind The kind of device ('videoinput' or 'audioinput')
 * @returns {Promise<Object>} Test results for the specific device
 */
export const testSpecificDevice = async (deviceId, kind) => {
  const result = {
    working: false,
    error: null
  };
  
  try {
    const constraints = {};
    
    if (kind === 'videoinput') {
      constraints.video = { deviceId: { exact: deviceId } };
    } else if (kind === 'audioinput') {
      constraints.audio = { deviceId: { exact: deviceId } };
    } else {
      throw new Error('Invalid device kind. Must be "videoinput" or "audioinput"');
    }
    
    // Try to get a media stream with the specific device
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // If we got here, the device is working
    result.working = true;
    
    // Clean up
    stream.getTracks().forEach(track => track.stop());
    
  } catch (error) {
    result.error = `Error testing device: ${error.message}`;
  }
  
  return result;
};