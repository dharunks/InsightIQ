const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testInterviewCompletion() {
  try {
    console.log('=== TESTING INTERVIEW COMPLETION ISSUE ===\n');
    
    // Test 1: Login
    console.log('1. Testing login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Test 2: Create interview
    console.log('\n2. Creating a test interview...');
    const interviewData = {
      title: 'Test Interview Completion',
      type: 'technical',
      difficulty: 'beginner',
      questionCount: 2  // Small number for quick testing
    };
    
    const interviewResponse = await axios.post(`${API_BASE}/interviews`, interviewData, config);
    const interviewId = interviewResponse.data.interview.id;
    console.log('✅ Interview created:', interviewId);
    
    // Test 3: Start interview
    console.log('\n3. Starting interview...');
    const startResponse = await axios.put(`${API_BASE}/interviews/${interviewId}/start`, {}, config);
    console.log('✅ Interview started');
    console.log('Interview status:', startResponse.data.interview.status);
    
    // Test 4: Get interview details
    console.log('\n4. Getting interview details...');
    const getResponse = await axios.get(`${API_BASE}/interviews/${interviewId}`, config);
    const interview = getResponse.data.interview;
    console.log('Interview status:', interview.status);
    console.log('Questions count:', interview.questions.length);
    console.log('Has startedAt:', !!interview.startedAt);
    
    // Test 5: Submit response to first question
    console.log('\n5. Submitting response to first question...');
    const questionId = interview.questions[0].id;
    
    const formData = new FormData();
    formData.append('text', 'This is a test response to the first question.');
    formData.append('duration', '30');
    
    const responseSubmit = await axios.put(
      `${API_BASE}/interviews/${interviewId}/questions/${questionId}/response`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
      }
    );
    console.log('✅ First response submitted');
    
    // Test 6: Submit response to second question
    console.log('\n6. Submitting response to second question...');
    const secondQuestionId = interview.questions[1].id;
    
    const formData2 = new FormData();
    formData2.append('text', 'This is a test response to the second question.');
    formData2.append('duration', '45');
    
    const responseSubmit2 = await axios.put(
      `${API_BASE}/interviews/${interviewId}/questions/${secondQuestionId}/response`,
      formData2,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    console.log('✅ Second response submitted');
    
    // Test 7: Complete interview (this is where the issue occurs)
    console.log('\n7. Attempting to complete interview...');
    
    const completeResponse = await axios.put(`${API_BASE}/interviews/${interviewId}/complete`, {}, config);
    console.log('✅ Interview completed successfully!');
    console.log('Completion response:', completeResponse.data);
    
    console.log('\n🎉 ALL TESTS PASSED! Interview completion is working.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.data) {
      console.error('Server error details:', error.response.data);
    }
  }
}

testInterviewCompletion();