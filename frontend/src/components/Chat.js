import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch conversations and users on component mount
  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Start a new conversation
  const startNewConversation = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/messages/conversations', {
        participantId: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations([...conversations, response.data]);
      setSelectedConversation(response.data);
      setMessages([]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const recipientId = selectedConversation.participants.find(
        p => p._id !== localStorage.getItem('userId')
      )._id;

      socketRef.current.emit('send_message', {
        recipientId,
        content: newMessage,
        selfDestructTimer: 30 // Fixed 30-second timer
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  // Handle user selection for new conversation
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    startNewConversation(user._id);
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
        className={`mb-4 ${
          message.sender._id === localStorage.getItem('userId')
            ? 'text-right'
            : 'text-left'
        }`}
      >
        <div
          className={`inline-block p-2 rounded-lg ${
            message.sender._id === localStorage.getItem('userId')
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          <div>{message.content}</div>
          <div className="text-xs mt-1">
            Self-destructs in {timeLeft}s
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with conversations and users */}
      <div className="w-1/4 bg-white border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Conversations</h2>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className={`p-2 cursor-pointer rounded ${
                  selectedConversation?._id === conv._id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleConversationSelect(conv)}
              >
                {conv.participants.find(p => p._id !== localStorage.getItem('userId'))?.email}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t">
          <h2 className="text-xl font-bold mb-4">New Conversation</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user._id}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded"
                onClick={() => handleUserSelect(user)}
              >
                {user.email}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">
                {selectedConversation.participants.find(p => p._id !== localStorage.getItem('userId'))?.email}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <Message key={message._id} message={message} />
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 