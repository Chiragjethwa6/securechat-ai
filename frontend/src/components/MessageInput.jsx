import React, { useState } from 'react';

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const [selfDestructTimer, setSelfDestructTimer] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend({
        content: message,
        selfDestructTimer: parseInt(selfDestructTimer)
      });
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Type a message..."
          />
          <select
            value={selfDestructTimer}
            onChange={(e) => setSelfDestructTimer(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="0">No expiry</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
            <option value="3600">1 hour</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput; 