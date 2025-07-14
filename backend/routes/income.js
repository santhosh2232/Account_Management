const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Income, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// Get all income records with filtering
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
      whereClause.income_cat = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.received_on = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { sender_name: { [Op.like]: `%${search}%` } },
        { received_by: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Income.findAndCountAll({
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
    console.error('Get income error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get income statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Income.findAll({
      attributes: [
        'income_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['income_cat']
    });

    const totalIncome = await Income.sum('amount');
    const totalCount = await Income.count();

    // Format the response to match what the frontend expects
    const formattedStats = {
      course: 0,
      internship: 0,
      project: 0,
      digitalMarketing: 0,
      others: 0
    };

    stats.forEach(stat => {
      switch(stat.income_cat) {
        case '1':
          formattedStats.course = parseFloat(stat.dataValues.total) || 0;
          break;
        case '2':
          formattedStats.internship = parseFloat(stat.dataValues.total) || 0;
          break;
        case '3':
          formattedStats.project = parseFloat(stat.dataValues.total) || 0;
          break;
        case '4':
          formattedStats.digitalMarketing = parseFloat(stat.dataValues.total) || 0;
          break;
        case '5':
          formattedStats.others = parseFloat(stat.dataValues.total) || 0;
          break;
      }
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get income statistics summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Income.findAll({
      attributes: [
        'income_cat',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['income_cat']
    });

    const totalIncome = await Income.sum('amount');
    const totalCount = await Income.count();

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

// Create new income record
router.post('/', [auth, incomeValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const incomeData = req.body;
    const income = await Income.create(incomeData);

    // Create accounts details record with better error handling
    try {
      await AccountsDetails.create({
        entry_type: '1',
        income_sno: income.sno,
        entry_by: req.user?.username || req.user?.name || 'Unknown',
        ip_address: req.ip || 'Unknown',
        browser_name: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown',
        browser_ver: '1.0',
        operating_sys: 'Unknown'
      });
    } catch (accountsError) {
      console.error('Error creating accounts details:', accountsError);
      // Don't fail the entire request if accounts details creation fails
      // The income record is already created successfully
    }

    res.status(201).json({
      message: 'Income record created successfully',
      data: income
    });

  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get income by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findByPk(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.json(income);
  } catch (error) {
    console.error('Get income by ID error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update income record
router.put('/:id', [auth, incomeValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const income = await Income.findByPk(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    await income.update(req.body);

    res.json({
      message: 'Income record updated successfully',
      data: income
    });

  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update income status only
router.patch('/:id/status', [auth, statusValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const income = await Income.findByPk(req.params.id);
    
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

// Delete income record
router.delete('/:id', [auth], async (req, res) => {
  try {
    const income = await Income.findByPk(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    await income.destroy();

    res.json({ message: 'Income record deleted successfully' });

  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 