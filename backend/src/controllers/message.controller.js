const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");
const encryptionService = require("../services/encryption.service");

// Get all conversations for a user
const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Decrypt last messages if they are encrypted
    const conversationsWithDecryptedMessages = conversations.map(conversation => {
      const conv = conversation.toObject();
      if (conv.lastMessage && conv.lastMessage.isEncrypted) {
        conv.lastMessage.content = encryptionService.decryptMessage(
          conv.lastMessage.content,
          Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
        );
      }
      return conv;
    });

    res.status(200).json(conversationsWithDecryptedMessages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: conversation.participants.find(p => p.toString() !== userId) },
        { sender: conversation.participants.find(p => p.toString() !== userId), recipient: userId }
      ]
    })
    .sort({ createdAt: 1 });

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

// Start a new conversation
const startConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.userId;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    });

    if (conversation) {
      return res.status(200).json(conversation);
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [userId, participantId]
    });

    await conversation.save();

    // Populate participants
    await conversation.populate('participants', 'name email');

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.userId;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Get recipient
    const recipientId = conversation.participants.find(p => p.toString() !== userId);

    // Encrypt the message
    const encryptedContent = encryptionService.encryptMessage(
      content,
      Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
    );

    // Create message
    const message = new Message({
      sender: userId,
      recipient: recipientId,
      content: encryptedContent,
      isEncrypted: true
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate sender and recipient
    await message.populate('sender', 'name email');
    await message.populate('recipient', 'name email');

    // Return decrypted message to sender
    const messageToReturn = message.toObject();
    messageToReturn.content = content; // Send original content back to sender

    res.status(201).json(messageToReturn);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  startConversation,
  sendMessage
};