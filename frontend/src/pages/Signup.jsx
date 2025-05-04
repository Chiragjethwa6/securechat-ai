import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Set up axios interceptors
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { name, email, password, confirmPassword });
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border-2 border-indigo-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">Create Account</h1>
          <p className="text-indigo-600 mt-1 text-base">Join SecureChat today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="name" className="w-20 text-sm font-semibold text-indigo-900">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-indigo-50"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="email" className="w-20 text-sm font-semibold text-indigo-900">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-indigo-50"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="password" className="w-20 text-sm font-semibold text-indigo-900">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-indigo-50"
              placeholder="Create a password"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="confirmPassword" className="w-20 text-sm font-semibold text-indigo-900">
              Confirm
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-indigo-50"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all font-semibold ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-indigo-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-700 hover:text-indigo-800 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-3 text-center">
          <Link to="/" className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
