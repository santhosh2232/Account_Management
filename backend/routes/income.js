const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Income, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const incomeController = require('../controllers/incomeController');

const router = express.Router();

// Validation for income creation/update
const incomeValidation = [
  body('income_cat')
    .isIn(['1', '2', '3', '4', '5'])
    .withMessage('Invalid income category'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('received_by')
    .isLength({ min: 1, max: 50 })
    .withMessage('Received by must be between 1 and 50 characters'),
  body('received_on')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('sender_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Sender name must be between 1 and 50 characters'),
  body('sender_mobile')
    .isLength({ min: 1, max: 20 })
    .withMessage('Sender mobile must be between 1 and 20 characters'),
  body('status')
    .optional()
    .isIn(['1', '2', '3', '4'])
    .withMessage('Invalid status')
];

// Validation for status-only updates
const statusValidation = [
  body('status')
    .isIn(['1', '2', '3', '4'])
    .withMessage('Invalid status')
];

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', incomeController.getIncomes);
router.get('/stats', incomeController.getIncomeStats);
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Income.findAll({
      where: { user_id: req.user.id }, // Filter by authenticated user
      attributes: [
        'income_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['income_cat']
    });

    const totalIncome = await Income.sum('amount', { where: { user_id: req.user.id } });
    const totalCount = await Income.count({ where: { user_id: req.user.id } });

    res.json({
      totalIncome,
      totalCount,
      byCategory: stats
    });

  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});
router.post('/', incomeController.createIncome);
router.get('/:id', incomeController.getIncome);
router.put('/:id', incomeController.updateIncome);
router.patch('/:id/status', [statusValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const income = await Income.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    await income.update({ status: req.body.status });

    res.json({
      message: 'Income status updated successfully',
      data: income
    });

  } catch (error) {
    console.error('Update income status error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});
router.delete('/:id', incomeController.deleteIncome);

module.exports = router; 