const express = require('express');
const router = express.Router();
const encryptionService = require('../services/encryption.service');
const auth = require('../middleware/auth');

// Get encryption key
router.get('/key', auth, (req, res) => {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      return res.status(500).json({ message: 'Encryption key not configured' });
    }
    res.json({ key });
  } catch (error) {
    res.status(500).json({ message: 'Error getting encryption key', error: error.message });
  }
});

module.exports = router; 