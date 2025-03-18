import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const signup = async (user: SignupData): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/api/auth`,user);
    return response.data.message;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};