const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: config.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

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
      error: config.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 