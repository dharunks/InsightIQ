// Test script for InsightIQ multimedia analysis features
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test configurations
const testConfigs = {
  // Test user credentials (should be created first via registration)
  testUser: {
    email: 'test@insightiq.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser'
  },
  
  // Sample text for analysis
  sampleTexts: [
    "I am very excited about this opportunity. I have extensive experience in software development and I believe I would be a great fit for your team. I've worked on similar projects before and I'm confident in my ability to deliver high-quality results.",
    
    "Well, um, I think I might be able to do this job. I'm not really sure about my experience level, but I guess I could try to learn what I need to know. Maybe I have some relevant skills, but I'm not entirely confident about it.",
    
    "I have five years of experience in full-stack development. In my previous role at TechCorp, I led a team of four developers to successfully launch a customer management system that increased efficiency by 30%. I'm passionate about solving complex problems and creating innovative solutions."
  ]
};

class APITester {
  constructor() {
    this.authToken = null;
    this.testResults = [];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    this.testResults.push({ timestamp, message, data });
  }

  async testHealthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      await this.log('✅ Health check passed', response.data);
      return true;
    } catch (error) {
      await this.log('❌ Health check failed', error.message);
      return false;
    }
  }

  async testUserRegistration() {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, testConfigs.testUser);
      await this.log('✅ User registration successful', {
        user: response.data.user,
        tokenLength: response.data.token ? response.data.token.length : 0
      });
      this.authToken = response.data.token;
      return true;
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        await this.log('ℹ️ User already exists, attempting login...');
        return await this.testUserLogin();
      }
      await this.log('❌ User registration failed', error.response?.data || error.message);
      return false;
    }
  }

  async testUserLogin() {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testConfigs.testUser.email,
        password: testConfigs.testUser.password
      });
      await this.log('✅ User login successful');
      this.authToken = response.data.token;
      return true;
    } catch (error) {
      await this.log('❌ User login failed', error.response?.data || error.message);
      return false;
    }
  }

  async testTextAnalysis() {
    if (!this.authToken) {
      await this.log('❌ Cannot test text analysis - no auth token');
      return false;
    }

    try {
      for (let i = 0; i < testConfigs.sampleTexts.length; i++) {
        const text = testConfigs.sampleTexts[i];
        const response = await axios.post(
          `${API_BASE_URL}/multimedia/analyze-text`,
          { text, options: { realtime: true } },
          { headers: { Authorization: `Bearer ${this.authToken}` } }
        );

        await this.log(`✅ Text analysis ${i + 1} successful`, {
          textLength: text.length,
          overallScore: response.data.analysis?.insights?.overallScore,
          huggingFaceSuccess: response.data.analysis?.huggingFace?.success,
          sentimentSuccess: response.data.analysis?.sentiment?.success
        });
      }
      return true;
    } catch (error) {
      await this.log('❌ Text analysis failed', error.response?.data || error.message);
      return false;
    }
  }

  async testServicesStatus() {
    if (!this.authToken) {
      await this.log('❌ Cannot test services status - no auth token');
      return false;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/multimedia/services-status`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      await this.log('✅ Services status check successful', {
        speechToText: response.data.status.speechToText,
        huggingFace: response.data.status.huggingFace,
        videoAnalysis: response.data.status.videoAnalysis,
        multimedia: response.data.status.multimedia
      });
      return true;
    } catch (error) {
      await this.log('❌ Services status check failed', error.response?.data || error.message);
      return false;
    }
  }

  async testSpeechToTextServices() {
    if (!this.authToken) {
      await this.log('❌ Cannot test speech-to-text services - no auth token');
      return false;
    }

    try {
      // Create a simple test audio blob (empty for now since we don't have actual audio)
      const testAudioData = new Blob(['test audio data'], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', testAudioData, 'test-audio.webm');
      formData.append('text', 'This is a test transcription for fallback analysis');
      formData.append('options', JSON.stringify({ language: 'en-US' }));

      const response = await axios.post(
        `${API_BASE_URL}/multimedia/analyze-speech`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      await this.log('✅ Speech analysis test successful', {
        transcriptionProvider: response.data.analysis?.transcription?.provider,
        transcriptionSuccess: response.data.analysis?.transcription?.success,
        nlpAnalysisSuccess: response.data.analysis?.nlpAnalysis?.success,
        overallScore: response.data.analysis?.multimediaAnalysis?.overallScore
      });
      return true;
    } catch (error) {
      await this.log('❌ Speech analysis test failed', error.response?.data || error.message);
      return false;
    }
  }

  async runAllTests() {
    await this.log('🚀 Starting InsightIQ API Tests...');
    
    const tests = [
      { name: 'Health Check', test: () => this.testHealthCheck() },
      { name: 'User Registration/Login', test: () => this.testUserRegistration() },
      { name: 'Text Analysis', test: () => this.testTextAnalysis() },
      { name: 'Services Status', test: () => this.testServicesStatus() },
      { name: 'Speech Analysis', test: () => this.testSpeechToTextServices() }
    ];

    const results = [];
    for (const { name, test } of tests) {
      await this.log(`\n📋 Running test: ${name}`);
      const result = await test();
      results.push({ name, passed: result });
    }

    // Summary
    await this.log('\n📊 Test Summary:');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });

    await this.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      await this.log('🎉 All tests passed! InsightIQ API is working correctly.');
    } else {
      await this.log('⚠️ Some tests failed. Check the logs above for details.');
    }

    return { passed, total, results };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests()
    .then(summary => {
      process.exit(summary.passed === summary.total ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = APITester;