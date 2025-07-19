const express = require('express');
const { body, validationResult } = require('express-validator');
const { Salary, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const salaryController = require('../controllers/salaryController');

const router = express.Router();

// Validation for salary creation/update
const salaryValidation = [
  body('payment_type')
    .isIn(['1', '2', '3'])
    .withMessage('Invalid payment type'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('payment_to_whom')
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment to whom must be between 1 and 50 characters'),
  body('spent_date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('payment_through')
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment through must be between 1 and 50 characters')
];

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', salaryController.getSalaries);
router.get('/stats', salaryController.getSalaryStats);
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Salary.findAll({
      where: { user_id: req.user.id }, // Filter by authenticated user
      attributes: [
        'payment_type',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['payment_type']
    });

    const totalSalary = await Salary.sum('amount', { where: { user_id: req.user.id } });
    const totalCount = await Salary.count({ where: { user_id: req.user.id } });

    res.json({
      totalSalary,
      totalCount,
      byType: stats
    });

  } catch (error) {
    console.error('Get salary stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

router.post('/', salaryController.createSalary);
router.get('/:id', salaryController.getSalary);
router.put('/:id', salaryController.updateSalary);
router.delete('/:id', salaryController.deleteSalary);

module.exports = router; 