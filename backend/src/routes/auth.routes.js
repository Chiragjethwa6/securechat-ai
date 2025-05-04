const express = require("express");
const { signup, login, getProfile, logout } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validateSignup, validateLogin } = require("../middleware/validate.middleware");

const router = express.Router();

// Public routes with validation
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;