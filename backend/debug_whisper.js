const { spawn } = require('child_process');

async function debugWhisperOutput() {
  console.log('🔍 Debugging Whisper output detection...\n');

  const command = 'python';
  const args = ['-m', 'whisper', '--help'];
  
  console.log(`Running: ${command} ${args.join(' ')}\n`);
  
  const process = spawn(command, args, { shell: true });
  
  let stdoutData = '';
  let stderrData = '';
  
  process.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutData += text;
  });
  
  process.stderr.on('data', (data) => {
    const text = data.toString();
    stderrData += text;
  });
  
  process.on('close', (code) => {
    console.log(`Exit code: ${code}`);
    console.log(`\nSTDOUT (${stdoutData.length} chars):`);
    console.log('---');
    console.log(stdoutData.substring(0, 500));
    console.log('---');
    
    console.log(`\nSTDERR (${stderrData.length} chars):`);
    console.log('---');
    console.log(stderrData.substring(0, 500));
    console.log('---');
    
    // Test our detection logic
    const allOutput = stdoutData + stderrData;
    const hasWhisper = allOutput.toLowerCase().includes('whisper');
    const hasUsage = allOutput.toLowerCase().includes('usage');
    const hasAudio = allOutput.toLowerCase().includes('audio file');
    const hasTranscribe = allOutput.toLowerCase().includes('transcribe');
    const hasModel = allOutput.includes('--model');
    const hasHelp = allOutput.includes('--help');
    
    console.log('\nDetection Results:');
    console.log(`Contains "whisper": ${hasWhisper}`);
    console.log(`Contains "usage": ${hasUsage}`);
    console.log(`Contains "audio file": ${hasAudio}`);
    console.log(`Contains "transcribe": ${hasTranscribe}`);
    console.log(`Contains "--model": ${hasModel}`);
    console.log(`Contains "--help": ${hasHelp}`);
    
    const shouldDetect = hasWhisper || hasUsage || hasAudio || hasTranscribe || hasModel || hasHelp;
    console.log(`\nShould detect as valid: ${shouldDetect}`);
  });
  
  process.on('error', (error) => {
    console.log(`Error: ${error.message}`);
  });
}

debugWhisperOutput();