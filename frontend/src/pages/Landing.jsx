import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">SecureChat AI</h1>
          <p className="text-gray-600">Secure messaging with AI assistance</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-semibold"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Experience secure messaging with AI-powered assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing; 