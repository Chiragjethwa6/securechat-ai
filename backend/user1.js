const readline = require('readline');
const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Create interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Global state
let socket;
let userId;
let authToken;
let currentRecipientId = null;
let onlineUsers = new Set();

// Main function
const startChatClient = async () => {
  try {
    console.log('===== SecureChat AI - WebSocket Chat Client =====');
    console.log('Welcome! Please login or register to continue.\n');
    
    await handleAuthentication();
    
    // Connect to WebSocket after authentication
    connectToSocket();
    
    // Display main menu
    mainMenu();
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

// Handle user authentication
const handleAuthentication = async () => {
  console.log('1. Login');
  console.log('2. Register');
  const choice = await askQuestion('Choose an option: ');
  
  if (choice === '2') {
    // Register
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Password: ');
    const confirmPassword = await askQuestion('Confirm Password: ');
    
    await axios.post(`${API_URL}/auth/signup`, {
      email,
      password,
      confirmPassword
    });
    
    console.log('Registration successful!');
    
    // Proceed with login
    await loginWithCredentials(email, password);
  } else {
    // Login
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Password: ');
    await loginWithCredentials(email, password);
  }
};

// Login with credentials
const loginWithCredentials = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  
  authToken = response.data.token;
  userId = response.data.user.id;
  
  console.log(`Login successful! Your User ID: ${userId}`);
};

// Connect to WebSocket server
const connectToSocket = () => {
  socket = io(SOCKET_URL, {
    auth: {
      token: authToken
    }
  });
  
  // Socket event handlers
  socket.on('connect', () => {
    console.log('Connected to chat server');
  });
  
  socket.on('online_users', (users) => {
    onlineUsers = new Set(users);
    console.log('\nOnline users:', Array.from(onlineUsers).filter(id => id !== userId).join(', ') || 'No other users online');
  });
  
  socket.on('user_connected', (userId) => {
    onlineUsers.add(userId);
    console.log(`\nUser ${userId} is now online`);
    rl.prompt();
  });
  
  socket.on('user_disconnected', (userId) => {
    onlineUsers.delete(userId);
    console.log(`\nUser ${userId} went offline`);
    rl.prompt();
  });
  
  socket.on('receive_message', (message) => {
    if (currentRecipientId === message.sender._id) {
      console.log(`\n${message.sender.email}: ${message.content}`);
    } else {
      console.log(`\nNew message from ${message.sender.email}: ${message.content}`);
    }
    
    // Mark message as read
    socket.emit('mark_as_read', { messageId: message._id });
    
    rl.prompt();
  });
  
  socket.on('message_sent', (message) => {
    // This is just a confirmation that the message was sent successfully
  });
  
  socket.on('user_typing', ({ userId }) => {
    if (currentRecipientId === userId) {
      console.log('\nUser is typing...');
      rl.prompt();
    }
  });
  
  socket.on('error', (error) => {
    console.error('\nSocket error:', error);
    rl.prompt();
  });
  
  socket.on('disconnect', () => {
    console.log('\nDisconnected from chat server');
  });
};

// Main menu
const mainMenu = async () => {
  console.log('\n--- MAIN MENU ---');
  console.log('1. Chat with a user');
  console.log('2. Chat with AI Assistant');
  console.log('3. View all conversations');
  console.log('4. Exit');
  
  const choice = await askQuestion('Choose an option: ');
  
  switch (choice) {
    case '1':
      await chatWithUser();
      break;
    case '2':
      await chatWithAI();
      break;
    case '3':
      await viewAllConversations();
      break;
    case '4':
      console.log('Exiting...');
      if (socket) socket.disconnect();
      process.exit(0);
    default:
      console.log('Invalid option');
      mainMenu();
  }
};

// Chat with a user
const chatWithUser = async () => {
  const recipientId = await askQuestion('Enter recipient\'s User ID: ');
  currentRecipientId = recipientId;
  
  // Fetch existing messages
  try {
    const response = await axios.get(`${API_URL}/messages/${recipientId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log(`\n--- CHAT WITH USER ${recipientId} ---`);
    console.log('Type your message and press Enter to send');
    console.log('Type /menu to return to the main menu');
    console.log('Type /users to see online users');
    console.log('\n--- Previous Messages ---');
    
    if (response.data.length === 0) {
      console.log('No previous messages');
    } else {
      response.data.forEach(msg => {
        const sender = msg.sender._id === userId ? 'You' : msg.sender.email;
        console.log(`${sender}: ${msg.content}`);
      });
    }
    
    console.log('\n--- New Messages ---');
    
    // Start chat input loop
    rl.setPrompt('You: ');
    rl.prompt();
    
    const messageHandler = (input) => {
      if (input.trim() === '/menu') {
        rl.removeListener('line', messageHandler);
        currentRecipientId = null;
        mainMenu();
        return;
      }
      
      if (input.trim() === '/users') {
        console.log('\nOnline users:', Array.from(onlineUsers).filter(id => id !== userId).join(', ') || 'No other users online');
        rl.prompt();
        return;
      }
      
      if (input.trim()) {
        // Send typing indicator
        socket.emit('typing', { recipientId });
        
        // Send message
        socket.emit('send_message', {
          recipientId,
          content: input
        });
      }
      
      rl.prompt();
    };
    
    rl.on('line', messageHandler);
  } catch (error) {
    console.error('Error fetching messages:', error.response ? error.response.data : error.message);
    mainMenu();
  }
};

// Chat with AI Assistant
const chatWithAI = async () => {
  try {
    // Get AI conversation
    const response = await axios.get(`${API_URL}/ai/conversation`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('\n--- CHAT WITH AI ASSISTANT ---');
    console.log('Type your message and press Enter to send');
    console.log('Type /menu to return to the main menu');
    console.log('\n--- Previous Messages ---');
    
    if (response.data.length === 0) {
      console.log('No previous messages');
    } else {
      response.data.forEach(msg => {
        const sender = msg.isAIMessage ? 'AI' : 'You';
        console.log(`${sender}: ${msg.content}`);
      });
    }
    
    console.log('\n--- New Messages ---');
    
    // Start chat input loop
    rl.setPrompt('You: ');
    rl.prompt();
    
    const messageHandler = async (input) => {
      if (input.trim() === '/menu') {
        rl.removeListener('line', messageHandler);
        mainMenu();
        return;
      }
      
      if (input.trim()) {
        try {
          const response = await axios.post(`${API_URL}/ai/message`, {
            content: input
          }, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          console.log(`AI: ${response.data.aiResponse.content}`);
        } catch (error) {
          console.error('Error sending message to AI:', error.response ? error.response.data : error.message);
        }
      }
      
      rl.prompt();
    };
    
    rl.on('line', messageHandler);
  } catch (error) {
    console.error('Error fetching AI conversation:', error.response ? error.response.data : error.message);
    mainMenu();
  }
};

// View all conversations
const viewAllConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/messages/conversations/all`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('\n--- ALL CONVERSATIONS ---');
    
    if (response.data.length === 0) {
      console.log('No conversations yet');
    } else {
      response.data.forEach((conversation, index) => {
        const otherUser = conversation.participants[0] || { email: 'Unknown User' };
        const lastMessage = conversation.lastMessage ? conversation.lastMessage.content : 'No messages';
        console.log(`${index + 1}. ${otherUser.email}: ${lastMessage.substring(0, 30)}${lastMessage.length > 30 ? '...' : ''}`);
      });
    }
    
    await mainMenu();
  } catch (error) {
    console.error('Error fetching conversations:', error.response ? error.response.data : error.message);
    mainMenu();
  }
};

// Helper function for CLI input
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Start the application
startChatClient();