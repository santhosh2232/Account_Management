const express = require('express');
const { body, validationResult } = require('express-validator');
const { Expense, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

// Validation for expense creation/update
const expenseValidation = [
  body('expense_cat')
    .isIn(['1', '2', '3', '4', '5'])
    .withMessage('Invalid expense category'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('spent_by')
    .isLength({ min: 1, max: 50 })
    .withMessage('Spent by must be between 1 and 50 characters'),
  body('spent_on')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('spent_through')
    .isLength({ min: 1, max: 50 })
    .withMessage('Spent through must be between 1 and 50 characters'),
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
router.get('/', expenseController.getExpenses);
router.get('/stats', expenseController.getExpenseStats);
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Expense.findAll({
      where: { user_id: req.user.id }, // Filter by authenticated user
      attributes: [
        'expense_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['expense_cat']
    });

    const totalExpenses = await Expense.sum('amount', { where: { user_id: req.user.id } });
    const totalCount = await Expense.count({ where: { user_id: req.user.id } });

    res.json({
      totalExpenses,
      totalCount,
      byCategory: stats
    });

  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

router.post('/', expenseController.createExpense);
router.get('/:id', expenseController.getExpense);
router.put('/:id', expenseController.updateExpense);

// Update expense status only
router.patch('/:id/status', [statusValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const expense = await Expense.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    await expense.update({ status: req.body.status });

    res.json({
      message: 'Expense status updated successfully',
      data: expense
    });

  } catch (error) {
    console.error('Update expense status error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

router.delete('/:id', expenseController.deleteExpense);

module.exports = router; 