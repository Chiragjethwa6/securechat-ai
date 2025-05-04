require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Import routes
const authRoutes = require("./src/routes/auth.routes");
const messageRoutes = require("./src/routes/message.routes");
const aiRoutes = require("./src/routes/ai.routes");
const userRoutes = require("./src/routes/user.routes");
const encryptionRoutes = require("./src/routes/encryption.routes");

// Import models
const Message = require("./src/models/message.model");
const Conversation = require("./src/models/conversation.model");
const User = require("./src/models/user.model");
const encryptionService = require("./src/services/encryption.service");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your client's domain
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/encryption", encryptionRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("SecureChat API is running with WebSockets");
});

// Connect to database directly
const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/securechat", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed", error);
    process.exit(1);
  }
};

// Map to store active socket connections by user ID
const activeConnections = new Map();

// Socket.io middleware for authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

// WebSocket connection handling
io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log(`User connected: ${userId}`);
  
  // Add user's socket to active connections
  activeConnections.set(userId, socket);
  
  // Send a list of online users
  socket.emit("online_users", Array.from(activeConnections.keys()));
  
  // Notify all connected users that this user is online
  socket.broadcast.emit("user_connected", userId);
  
  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { recipientId, content } = data;
      const senderId = socket.userId;
      
      // Encrypt the message content
      const encryptedContent = encryptionService.encryptMessage(
        content,
        Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
      );
      
      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, recipientId],
        });
        await conversation.save();
      }

      // Set fixed 30-second self-destruct time
      const selfDestructAt = new Date(Date.now() + 30000);

      // Create new message with encrypted content
      const newMessage = new Message({
        sender: senderId,
        recipient: recipientId,
        content: encryptedContent,
        isEncrypted: true,
        selfDestructTimer: 30,
        selfDestructAt: selfDestructAt
      });

      await newMessage.save();

      // Update conversation with last message
      conversation.lastMessage = newMessage._id;
      await conversation.save();
      
      // Get sender and recipient data
      const sender = await User.findById(senderId).select("email");
      
      // Prepare complete message object (send decrypted content to clients)
      const messageData = {
        _id: newMessage._id,
        sender: {
          _id: senderId,
          email: sender.email
        },
        recipient: recipientId,
        content: content, // Send original content to clients
        createdAt: newMessage.createdAt,
        isRead: false,
        isEncrypted: true,
        selfDestructTimer: 30,
        selfDestructAt: selfDestructAt
      };
      
      // Send to recipient if they're online
      if (activeConnections.has(recipientId)) {
        console.log(`Sending message to user ${recipientId}`);
        activeConnections.get(recipientId).emit("receive_message", messageData);
      }
      
      // Send confirmation back to sender
      socket.emit("message_sent", messageData);

      // Schedule message deletion after 30 seconds
      setTimeout(async () => {
        try {
          const message = await Message.findById(newMessage._id);
          if (message) {
            await message.deleteOne();
            // Notify both users about message deletion
            if (activeConnections.has(senderId)) {
              activeConnections.get(senderId).emit("message_deleted", { messageId: newMessage._id });
            }
            if (activeConnections.has(recipientId)) {
              activeConnections.get(recipientId).emit("message_deleted", { messageId: newMessage._id });
            }
          }
        } catch (error) {
          console.error("Error deleting self-destructing message:", error);
        }
      }, 30000);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message", error: error.message });
    }
  });
  
  // Handle typing indicators
  socket.on("typing", ({ recipientId }) => {
    if (activeConnections.has(recipientId)) {
      activeConnections.get(recipientId).emit("user_typing", { userId: socket.userId });
    }
  });
  
  // Handle message read receipts
  socket.on("mark_as_read", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.recipient.toString() === socket.userId) {
        message.isRead = true;
        await message.save();
        
        // Notify the sender if they're online
        if (activeConnections.has(message.sender.toString())) {
          activeConnections.get(message.sender.toString()).emit("message_read", { messageId });
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });
  
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    activeConnections.delete(userId);
    
    // Notify all users that this user went offline
    io.emit("user_disconnected", userId);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectToDB();
server.listen(PORT, () => console.log(`Server running on port ${PORT} with WebSockets enabled`));