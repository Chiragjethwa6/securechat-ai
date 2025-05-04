const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let secondUserId = '';

// Test all API endpoints
const runTests = async () => {
  try {
    console.log('=== STARTING API TESTS ===\n');
    
    // Test 1: Signup first user
    await testSignup();
    
    // Test 2: Login with first user
    await testLogin();
    
    // Test 3: Get user profile
    await testGetProfile();
    
    // Test 4: Create a second test user
    await createSecondUser();
    
    // Test 5: Send message to second user
    await testSendMessage();
    
    // Test 6: Get messages with second user
    await testGetMessages();
    
    // Test 7: Get all conversations
    await testGetConversations();
    
    // Test 8: Interact with AI assistant
    await testAIAssistant();
    
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

// Test signup endpoint
const testSignup = async () => {
  console.log('Testing signup endpoint...');
  const email = `user${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'Password123!';
  
  const response = await axios.post(`${API_URL}/auth/signup`, {
    email,
    password,
    confirmPassword: password
  });
  
  console.log('✅ Signup successful:', response.data);
  // Save email for login
  global.testEmail = email;
  global.testPassword = password;
};

// Test login endpoint
const testLogin = async () => {
  console.log('\nTesting login endpoint...');
  
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: global.testEmail,
    password: global.testPassword
  });
  
  console.log('✅ Login successful:', response.data.message);
  // Save auth token and user ID for later tests
  authToken = response.data.token;
  testUserId = response.data.user.id;
};

// Test get profile endpoint
const testGetProfile = async () => {
  console.log('\nTesting get profile endpoint...');
  
  const response = await axios.get(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Profile retrieved:', response.data);
};

// Create a second test user for messaging
const createSecondUser = async () => {
  console.log('\nCreating second test user...');
  
  const email = `user${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'Password123!';
  
  // Signup second user
  const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
    email,
    password,
    confirmPassword: password
  });
  
  // Login as second user to get ID
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  
  secondUserId = loginResponse.data.user.id;
  console.log(`✅ Second user created with ID: ${secondUserId}`);
};

// Test sending a message
const testSendMessage = async () => {
  console.log('\nTesting send message endpoint...');
  
  const response = await axios.post(`${API_URL}/messages/send`, {
    recipientId: secondUserId,
    content: 'Hello, this is a test message!'
  }, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Message sent:', response.data);
};

// Test getting messages between users
const testGetMessages = async () => {
  console.log('\nTesting get messages endpoint...');
  
  const response = await axios.get(`${API_URL}/messages/${secondUserId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Messages retrieved:', response.data);
};

// Test getting all conversations
const testGetConversations = async () => {
  console.log('\nTesting get conversations endpoint...');
  
  const response = await axios.get(`${API_URL}/messages/conversations/all`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Conversations retrieved:', response.data);
};

// Test AI assistant
const testAIAssistant = async () => {
  console.log('\nTesting AI assistant...');
  
  // Send message to AI
  const messageResponse = await axios.post(`${API_URL}/ai/message`, {
    content: 'Hello AI, how are you today?'
  }, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Message sent to AI, response received:', messageResponse.data);
  
  // Get AI conversation
  const conversationResponse = await axios.get(`${API_URL}/ai/conversation`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  
  console.log('✅ AI conversation retrieved:', conversationResponse.data);
};

// Run all tests
runTests();