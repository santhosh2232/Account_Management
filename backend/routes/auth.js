const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Login validation
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Login route
router.post('/login', loginValidation, authController.login);

// Register route
router.post('/register', authController.register);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Logout route
router.post('/logout', auth, authController.logout);

// Get current user route
router.get('/me', auth, async (req, res) => {
  try {
    const userResponse = {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.created_at,
      updatedAt: req.user.updated_at
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 