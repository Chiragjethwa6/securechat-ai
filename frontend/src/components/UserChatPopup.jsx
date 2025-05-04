import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const UserChatPopup = ({ isOpen, onClose, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen || !selectedUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    // Handle incoming messages
    newSocket.on('receive_message', (message) => {
      console.log('Received message:', message);
      if (message.sender._id === selectedUser._id || message.recipient._id === selectedUser._id) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => 
            m._id === message._id || 
            (m.content === message.content && 
             m.sender?._id === message.sender._id && 
             Math.abs(new Date(m.timestamp || m.createdAt) - new Date(message.createdAt)) < 1000)
          );
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    // Handle message deletion
    newSocket.on('message_deleted', ({ messageId }) => {
      console.log('Message deleted:', messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // Handle sent message confirmation
    newSocket.on('message_sent', (message) => {
      console.log('Message sent confirmation:', message);
      setMessages(prev => {
        // Replace temporary message with confirmed one
        const messageIndex = prev.findIndex(m => 
          !m._id && m.content === message.content && 
          Math.abs(new Date(m.timestamp) - new Date(message.createdAt)) < 1000
        );
        if (messageIndex === -1) return prev;
        
        const newMessages = [...prev];
        newMessages[messageIndex] = message;
        return newMessages;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [isOpen, selectedUser]);

  // Load messages when popup opens or selected user changes
  useEffect(() => {
    if (isOpen && selectedUser) {
      // Clear states when opening chat
      setMessages([]);
      setConversationId(null);
      loadConversation();
    }
  }, [isOpen, selectedUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      console.log('Loading conversation for user:', selectedUser);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      // First try to get existing conversation
      console.log('Fetching existing conversations...');
      const response = await axios.get(`http://localhost:5000/api/messages/conversations`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Conversations response:', response.data);

      // Find conversation with selected user
      const conversation = response.data.find(conv => 
        conv.participants.some(p => p._id === selectedUser._id)
      );

      if (conversation) {
        console.log('Found existing conversation:', conversation);
        const convId = conversation._id;
        
        // Load messages for this conversation
        const messagesResponse = await axios.get(`http://localhost:5000/api/messages/${convId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (messagesResponse.data.length > 0) {
          // Ensure each message has the proper sender object structure
          const formattedMessages = messagesResponse.data.map(message => ({
            ...message,
            sender: {
              _id: message.sender._id || message.sender
            },
            recipient: {
              _id: message.recipient._id || message.recipient
            }
          }));
          setMessages(formattedMessages);
        }
        
        setConversationId(convId);
      } else {
        console.log('Creating new conversation...');
        // Create new conversation if none exists
        const newConvResponse = await axios.post('http://localhost:5000/api/messages/conversations',
          { participantId: selectedUser._id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('New conversation created:', newConvResponse.data);
        setConversationId(newConvResponse.data._id);
        setMessages([]); // No messages for new conversation
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      setMessages([]); // Clear messages on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit button clicked');
    console.log('Current state:', { newMessage, isLoading, conversationId });

    if (!newMessage.trim() || isLoading) {
        console.log('Submit blocked:', { 
            isEmpty: !newMessage.trim(), 
            isLoading
        });
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    setIsLoading(true);

    try {
        // If no conversation exists, create one first
        if (!conversationId) {
            console.log('Creating new conversation...');
            const newConvResponse = await axios.post('http://localhost:5000/api/messages/conversations',
                { participantId: selectedUser._id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('New conversation created:', newConvResponse.data);
            setConversationId(newConvResponse.data._id);
        }

        // Add temporary message to UI
        const tempMessage = {
            content: newMessage,
            timestamp: new Date().toISOString(),
            sender: { _id: 'temp' } // Temporary ID to show message on right side
        };
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');

        // Send via socket only
        if (socket) {
            socket.emit('send_message', {
                recipientId: selectedUser._id,
                content: newMessage
            });
        } else {
            throw new Error('Socket connection not available');
        }
    } catch (error) {
        console.error('Send Message Error:', error);
        const errorMessage = {
            type: 'error',
            content: error.message || 'Failed to send message. Please try again.',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  // Message component with countdown timer
  const Message = ({ message }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
      const destructAt = new Date(message.createdAt).getTime() + 30000; // 30 seconds
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.ceil((destructAt - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setIsVisible(false);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [message]);

    if (!isVisible) return null;

    return (
      <div
        className={`flex ${message.sender?._id === selectedUser._id ? 'justify-start' : 'justify-end'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            message.sender?._id === selectedUser._id
              ? 'bg-gray-100 text-gray-800'
              : 'bg-indigo-600 text-white'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <div className="text-xs opacity-70 mt-1">
            Self-destructs in {timeLeft}s
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[720px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Chat with {selectedUser.name}</h2>
            <p className="text-sm text-gray-500">{selectedUser.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <Message key={message._id || message.timestamp} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors bg-indigo-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
                (isLoading || !newMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserChatPopup; 