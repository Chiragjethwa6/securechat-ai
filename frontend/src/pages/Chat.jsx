import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIChatPopup from '../components/AIChatPopup';
import UserChatPopup from '../components/UserChatPopup';
import '../styles/Chat.css';

const Chat = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isUserChatOpen, setIsUserChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Load users after token verification
        loadUsers();
      } catch (error) {
        // If token is invalid or expired, clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    verifyToken();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Filter out the current user and AI assistant
      const filteredUsers = response.data.filter(u => 
        u._id !== user.id && u.email !== 'ai-assistant@securechat.ai'
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserChatOpen(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call logout endpoint
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Navigate to login
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-indigo-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-indigo-900">Welcome, {user.name || 'User'}!</h1>
              <p className="text-indigo-600 mt-1">Your secure and private messaging platform</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Chat with AI
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Users</h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <p className="text-red-600 text-center py-4">{error}</p>
            ) : users.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No users available</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AIChatPopup isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <UserChatPopup 
        isOpen={isUserChatOpen} 
        onClose={() => setIsUserChatOpen(false)} 
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default Chat;
