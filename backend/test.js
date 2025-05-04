const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAuth = async () => {
  try {
    console.log('Testing signup endpoint...');
    const email = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const password = 'Password123!';
    
    // Test signup
    const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      confirmPassword: password
    });
    console.log('Signup response:', signupResponse.data);
    
    // Test login
    console.log('\nTesting login endpoint...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    console.log('Login response:', loginResponse.data);
    
    // Test profile with token
    console.log('\nTesting profile endpoint...');
    const { token } = loginResponse.data;
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Profile response:', profileResponse.data);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
};

testAuth();