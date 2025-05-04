import axios from 'axios';
import { encryptMessage, decryptMessage, importKey } from '../utils/crypto';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class MessageService {
  constructor() {
    this.encryptionKey = null;
  }

  // Initialize encryption key
  async initializeEncryption() {
    try {
      const response = await axios.get(`${API_URL}/encryption-key`);
      this.encryptionKey = await importKey(response.data.key);
    } catch (error) {
      console.error('Error initializing encryption:', error);
      throw error;
    }
  }

  // Get messages between two users
  async getMessages(userId) {
    try {
      const response = await axios.get(`${API_URL}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Decrypt messages if they are encrypted
      const decryptedMessages = await Promise.all(
        response.data.map(async (message) => {
          if (message.isEncrypted && this.encryptionKey) {
            const decryptedContent = await decryptMessage(
              message.content,
              this.encryptionKey
            );
            return {
              ...message,
              content: decryptedContent
            };
          }
          return message;
        })
      );

      return decryptedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(recipientId, content) {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      // Encrypt the message
      const encryptedContent = await encryptMessage(content, this.encryptionKey);

      const response = await axios.post(
        `${API_URL}/messages`,
        {
          recipientId,
          content: encryptedContent
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

export default new MessageService(); 