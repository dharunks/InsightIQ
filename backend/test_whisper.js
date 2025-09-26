const { spawn } = require('child_process');

async function testWhisperInstallation() {
  console.log('🔍 Testing Whisper installation...\n');

  const commands = [
    'whisper --help',
    'python -m whisper --help',
    'python3 -m whisper --help',
    'py -m whisper --help'
  ];

  for (const cmd of commands) {
    console.log(`Testing: ${cmd}`);
    
    const result = await testCommand(cmd);
    if (result.success) {
      console.log(`✅ SUCCESS: Found working Whisper installation`);
      console.log(`Command: ${cmd}`);
      console.log(`Output preview: ${result.output.substring(0, 200)}...\n`);
      return;
    } else {
      console.log(`❌ FAILED: ${result.error}\n`);
    }
  }

  console.log('❌ No working Whisper installation found.');
  console.log('\n📝 To install Whisper:');
  console.log('1. pip install openai-whisper');
  console.log('2. Make sure Python is in your PATH');
  console.log('3. Restart the backend server');
}

function testCommand(cmdString) {
  return new Promise((resolve) => {
    const [command, ...args] = cmdString.split(' ');
    
    const process = spawn(command, args, { shell: true });
    
    let output = '';
    let hasOutput = false;
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (text.toLowerCase().includes('whisper') || 
          text.toLowerCase().includes('usage') ||
          text.toLowerCase().includes('audio file') ||
          text.toLowerCase().includes('transcribe') ||
          text.includes('--model') ||
          text.includes('--help')) {
        hasOutput = true;
      }
    });
    
    process.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (text.toLowerCase().includes('whisper') || 
          text.toLowerCase().includes('usage') ||
          text.toLowerCase().includes('audio file') ||
          text.toLowerCase().includes('transcribe') ||
          text.includes('--model') ||
          text.includes('--help')) {
        hasOutput = true;
      }
    });
    
    process.on('close', (code) => {
      const relevant = hasOutput || output.toLowerCase().includes('whisper') || output.toLowerCase().includes('transcribe');
      if (relevant) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: `Exit code: ${code}, No relevant output` });
      }
    });
    
    process.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      process.kill();
      resolve({ success: false, error: 'Timeout' });
    }, 10000);
  });
}

testWhisperInstallation().catch(console.error);