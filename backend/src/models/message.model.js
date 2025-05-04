const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isAIMessage: {
    type: Boolean,
    default: false
  },
  selfDestructTimer: {
    type: Number,
    default: null // null means no self-destruct, number represents seconds
  },
  selfDestructAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);