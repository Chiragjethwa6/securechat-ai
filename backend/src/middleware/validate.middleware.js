// Middleware for validating request bodies

const validateSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    
    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    
    next();
  };
  
  const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    // Validate email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }
    
    next();
  };
  
  const validateMessage = (req, res, next) => {
    const { conversationId, content } = req.body;
    
    // Validate conversation ID
    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }
    
    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }
    
    next();
  };
  
  module.exports = { validateSignup, validateLogin, validateMessage };