# SecureChat AI

SecureChat AI is a real-time, secure encrypted messaging application that allows users to chat securely and interact with an AI-powered chatbot. Built for privacy and efficiency, this app ensures secure communication using WebSockets, Server-Side Encryption, and self-destructing messages.

## Features

- **Server-Side Encryption**: All messages are encrypted using AES-256-GCM
- **Self-Destructing Messages**: Messages automatically delete after 30 seconds
- **Real-Time Communication**: WebSockets enable instant message delivery
- **AI Assistant**: Built-in AI chatbot powered by Google's Generative AI (Gemini)
- **User Authentication**: Secure signup and login with JWT
- **Modern UI**: Clean, responsive design built with React and Tailwind CSS

## Technology Stack

### Frontend
- React 18.2.0
- React Router 6.22.1
- Socket.IO Client 4.8.1
- Tailwind CSS 3.4.1
- Axios for API communication
- Vite as the build tool

### Backend
- Node.js with Express 4.21.2
- Socket.IO 4.8.1 for WebSockets
- MongoDB with Mongoose 8.12.1
- JWT for authentication
- Bcrypt for password hashing
- Crypto for encryption
- Google Generative AI for the AI assistant

## Setup and Installation

### Prerequisites
- Node.js (version 16 or higher)
- MongoDB (local instance or MongoDB Atlas)
- Google Generative AI API key (for the AI assistant)

### Environment Variables
Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_base64_encryption_key
GEMINI_API_KEY=your_gemini_api_key
AI_EMAIl=your_ai_email
AI_PASSWORD=your_ai_password
```

### Installation Steps

#### Clone the repository
```bash
git clone https://github.com/yourusername/securechat-ai.git
cd securechat-ai
```

#### Install backend dependencies
```bash
cd backend
npm install
```

#### Install frontend dependencies
```bash
cd ../frontend
npm install
```

#### Start the backend server
```bash
cd ../backend
npm start
```

#### Start the frontend development server
```bash
cd ../frontend
npm run dev
```

The application should now be running at http://localhost:5173

## Usage

1. Open the application in your browser
2. Create a new account or log in with existing credentials
3. Start chatting with other users securely
4. Messages will automatically self-destruct after 30 seconds
5. Use the AI assistant for help or conversation

## Security Features

### Secure Encryption
All messages are encrypted using AES-256-GCM encryption. The server stores only encrypted messages, ensuring that even if the database is compromised, message contents remain secure.

### Self-Destructing Messages
Messages are automatically deleted after 30 seconds, both from the database and from all clients' interfaces, leaving no trace of conversations.

### JWT Authentication
Secure token-based authentication prevents unauthorized access to messages and user accounts.

## Project Structure

```
securechat-ai/
├── backend/
│   ├── server.js                 # Main server entry point
│   ├── src/
│   │   ├── controllers/          # API endpoint controllers
│   │   ├── middleware/           # Request middleware
│   │   ├── models/               # MongoDB models
│   │   ├── routes/               # API routes
│   │   └── services/             # Business logic services
│   └── package.json
│
└── frontend/
    ├── public/                   # Static assets
    ├── src/
    │   ├── components/           # React components
    │   ├── pages/                # Page components
    │   ├── services/             # API service clients
    │   ├── styles/               # CSS styles
    │   ├── utils/                # Utility functions
    │   ├── App.jsx               # Main app component
    │   └── main.jsx              # Entry point
    ├── index.html
    └── package.json
```

## Acknowledgments

- [Google Generative AI](https://ai.google.dev/) for the AI assistant capabilities
- [Socket.IO](https://socket.io/) for real-time communication
- [MongoDB](https://www.mongodb.com/) for the database
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend
