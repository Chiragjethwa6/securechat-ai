const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits = 32 bytes
    this.ivLength = 12;
    this.authTagLength = 16;
  }

  // Process the base64 key into proper format
  processKey(base64Key) {
    // If the key is base64, decode it to bytes
    try {
      const keyBuffer = Buffer.from(base64Key, 'base64');
      // Ensure key is exactly 32 bytes (256 bits)
      if (keyBuffer.length !== this.keyLength) {
        // If key is too long, truncate; if too short, pad with zeros
        const properKey = Buffer.alloc(this.keyLength);
        keyBuffer.copy(properKey, 0, 0, Math.min(keyBuffer.length, this.keyLength));
        return properKey;
      }
      return keyBuffer;
    } catch (error) {
      // If key processing fails, generate a new one
      console.warn('Invalid key format, generating new key');
      return crypto.randomBytes(this.keyLength);
    }
  }

  // Generate a random key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Encrypt a message
  encryptMessage(message, base64Key) {
    const key = this.processKey(base64Key);
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(message, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted content, and auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'base64'),
      authTag
    ]);
    
    return combined.toString('base64');
  }

  // Decrypt a message
  decryptMessage(encryptedMessage, base64Key) {
    const key = this.processKey(base64Key);
    const combined = Buffer.from(encryptedMessage, 'base64');
    
    // Extract IV, encrypted content, and auth tag
    const iv = combined.slice(0, this.ivLength);
    const authTag = combined.slice(-this.authTagLength);
    const encryptedContent = combined.slice(
      this.ivLength,
      -this.authTagLength
    );
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedContent, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = new EncryptionService(); 