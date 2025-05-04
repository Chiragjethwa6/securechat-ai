const User = require("../models/user.model");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const encryptionService = require("../services/encryption.service");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate AI response using Gemini
const generateAIResponse = async (message) => {
  try {
    console.log("Attempting to connect to Gemini API...");
    console.log("API Key present:", !!process.env.GEMINI_API_KEY);
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    // Simple content generation
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini API Response received successfully");
    return text;
  } catch (error) {
    console.error("Gemini API Error Details:", {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
};

// Get or create AI assistant user
const getOrCreateAIUser = async () => {
  let aiUser = await User.findOne({ email: "ai-assistant@securechat.ai" });
  
  if (!aiUser) {
    aiUser = new User({
      name: "AI Assistant",
      email: process.env.AI_EMAIL,
      password: process.env.AI_PASSWORD + Date.now(), // Create a unique, secure password (not actually used)
      isAI: true
    });
    
    await aiUser.save();
  }
  
  return aiUser;
};

// Send message to AI assistant
const sendMessageToAI = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.userId;
    
    // Get or create AI user
    const aiUser = await getOrCreateAIUser();
    
    // Find or create conversation with AI
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, aiUser._id] },
      isAIConversation: true
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, aiUser._id],
        isAIConversation: true
      });
      await conversation.save();
    }
    
    // Encrypt and save user message
    const encryptedUserContent = encryptionService.encryptMessage(
      content,
      Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
    );

    const userMessage = new Message({
      sender: userId,
      recipient: aiUser._id,
      content: encryptedUserContent,
      isRead: true,
      isEncrypted: true
    });
    
    await userMessage.save();
    
    // Generate AI response using Gemini
    const aiResponseText = await generateAIResponse(content);
    
    // Encrypt and save AI response
    const encryptedAIContent = encryptionService.encryptMessage(
      aiResponseText,
      Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
    );

    const aiResponse = new Message({
      sender: aiUser._id,
      recipient: userId,
      content: encryptedAIContent,
      isAIMessage: true,
      isEncrypted: true
    });
    
    await aiResponse.save();
    
    // Update conversation
    conversation.lastMessage = aiResponse._id;
    await conversation.save();
    
    // Return decrypted messages to the client
    const responseData = {
      userMessage: {
        ...userMessage.toObject(),
        content: content // Original content for immediate display
      },
      aiResponse: {
        ...aiResponse.toObject(),
        content: aiResponseText // Original content for immediate display
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in sendMessageToAI:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get conversation with AI assistant
const getAIConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const aiUser = await getOrCreateAIUser();
    
    // Find all messages
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: aiUser._id },
        { sender: aiUser._id, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    // Decrypt messages if they are encrypted
    const decryptedMessages = messages.map(message => {
      const msg = message.toObject();
      if (msg.isEncrypted) {
        msg.content = encryptionService.decryptMessage(
          msg.content,
          Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
        );
      }
      return msg;
    });
    
    res.status(200).json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { sendMessageToAI, getAIConversation };