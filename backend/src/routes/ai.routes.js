const express = require("express");
const { sendMessageToAI, getAIConversation } = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// All AI routes require authentication
router.use(authMiddleware);

// Send message to AI assistant
router.post("/message", sendMessageToAI);

// Get conversation with AI assistant
router.get("/conversation", getAIConversation);

module.exports = router;