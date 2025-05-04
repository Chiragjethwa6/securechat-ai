import { Buffer } from 'buffer';

// Generate a random key for encryption
export const generateKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
};

// Export the key in a format that can be stored
export const exportKey = async (key) => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

// Import a key from its stored format
export const importKey = async (keyString) => {
  const keyBuffer = Buffer.from(keyString, 'base64');
  return window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a message
export const encryptMessage = async (message, key) => {
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);
  
  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedMessage
  );
  
  // Combine IV and encrypted content
  const encryptedArray = new Uint8Array(encryptedContent);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  
  return Buffer.from(combined).toString('base64');
};

// Decrypt a message
export const decryptMessage = async (encryptedMessage, key) => {
  const combined = Buffer.from(encryptedMessage, 'base64');
  
  // Extract IV and encrypted content
  const iv = combined.slice(0, 12);
  const encryptedContent = combined.slice(12);
  
  const decryptedContent = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedContent
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedContent);
}; 