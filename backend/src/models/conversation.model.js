const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isAIConversation: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);