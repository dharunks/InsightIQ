const axios = require('axios');

const API_BASE = 'http://localhost:5002/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Test 3: Create interview
    console.log('\n3. Testing interview creation...');
    const interviewData = {
      title: 'Test Software Engineer Interview',
      type: 'technical',
      difficulty: 'beginner',
      questionCount: 5
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const interviewResponse = await axios.post(`${API_BASE}/interviews`, interviewData, config);
    console.log('✅ Interview created:', {
      id: interviewResponse.data.interview.id,
      title: interviewResponse.data.interview.title,
      questionCount: interviewResponse.data.interview.questionCount
    });
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testAPI();