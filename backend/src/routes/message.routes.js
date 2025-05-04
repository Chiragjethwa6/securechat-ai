const express = require("express");
const { sendMessage, getMessages, getConversations, startConversation } = require("../controllers/message.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validateMessage } = require("../middleware/validate.middleware");
const Message = require('../models/message.model');
const encryptionService = require('../services/encryption.service');
const auth = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(authMiddleware);

// Get all conversations for current user
router.get("/conversations", getConversations);

// Start a new conversation
router.post("/conversations", startConversation);

// Send a message with validation
router.post("/send", validateMessage, sendMessage);

// Get messages for a conversation
router.get("/:conversationId", getMessages);

// Get messages between two users
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    // Decrypt messages if they are encrypted
    const decryptedMessages = await Promise.all(messages.map(async (message) => {
      if (message.isEncrypted) {
        const decryptedContent = encryptionService.decryptMessage(
          message.content,
          Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
        );
        return {
          ...message.toObject(),
          content: decryptedContent
        };
      }
      return message;
    }));

    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    // Encrypt the message
    const encryptedContent = encryptionService.encryptMessage(
      content,
      Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
    );

    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content: encryptedContent,
      isEncrypted: true
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

module.exports = router;