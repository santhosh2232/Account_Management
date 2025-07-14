const express = require('express');
const { body, validationResult } = require('express-validator');
const { Expense, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// Get all expense records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (category) {
      whereClause.expense_cat = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.spent_on = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { spent_by: { [Op.like]: `%${search}%` } },
        { spent_through: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Expense.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get expense statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Expense.findAll({
      attributes: [
        'expense_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['expense_cat']
    });

    const totalExpenses = await Expense.sum('amount');
    const totalCount = await Expense.count();

    res.json({
      totalExpenses: totalExpenses || 0,
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

// Get expense statistics summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Expense.findAll({
      attributes: [
        'expense_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['expense_cat']
    });

    const totalExpenses = await Expense.sum('amount');
    const totalCount = await Expense.count();

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

// Create new expense record
router.post('/', [auth, expenseValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const expenseData = req.body;
    const expense = await Expense.create(expenseData);

    // Create accounts details record with better error handling
    try {
      await AccountsDetails.create({
        entry_type: '2',
        expenses_sno: expense.sno,
        entry_by: req.user?.username || req.user?.name || 'Unknown',
        ip_address: req.ip || 'Unknown',
        browser_name: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown',
        browser_ver: '1.0',
        operating_sys: 'Unknown'
      });
    } catch (accountsError) {
      console.error('Error creating accounts details:', accountsError);
      // Don't fail the entire request if accounts details creation fails
      // The expense record is already created successfully
    }

    res.status(201).json({
      message: 'Expense record created successfully',
      data: expense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update expense record
router.put('/:id', [auth, expenseValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const expense = await Expense.findByPk(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    await expense.update(req.body);

    res.json({
      message: 'Expense record updated successfully',
      data: expense
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update expense status only
router.patch('/:id/status', [auth, statusValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const expense = await Expense.findByPk(req.params.id);
    
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

// Delete expense record
router.delete('/:id', [auth], async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    await expense.destroy();

    res.json({ message: 'Expense record deleted successfully' });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 