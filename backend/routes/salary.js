const express = require('express');
const { body, validationResult } = require('express-validator');
const { Salary, AccountsDetails } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

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

// Get all salary records with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      paymentType,
      startDate,
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (paymentType) {
      whereClause.payment_type = paymentType;
    }

    if (startDate && endDate) {
      whereClause.spent_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { payment_to_whom: { [Op.like]: `%${search}%` } },
        { payment_through: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Salary.findAndCountAll({
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
    console.error('Get salaries error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get salary statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Salary.findAll({
      attributes: [
        'payment_type',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['payment_type']
    });

    const totalSalary = await Salary.sum('amount');
    const totalCount = await Salary.count();

    res.json({
      totalSalary: totalSalary || 0,
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

// Get salary statistics summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Salary.findAll({
      attributes: [
        'payment_type',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['payment_type']
    });

    const totalSalary = await Salary.sum('amount');
    const totalCount = await Salary.count();

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

// Create new salary record
router.post('/', [auth, salaryValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const salaryData = req.body;
    const salary = await Salary.create(salaryData);

    // Create accounts details record with better error handling
    try {
      await AccountsDetails.create({
        entry_type: '3',
        salary_sno: salary.sno,
        entry_by: req.user?.username || req.user?.name || 'Unknown',
        ip_address: req.ip || 'Unknown',
        browser_name: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : 'Unknown',
        browser_ver: '1.0',
        operating_sys: 'Unknown'
      });
    } catch (accountsError) {
      console.error('Error creating accounts details:', accountsError);
      // Don't fail the entire request if accounts details creation fails
      // The salary record is already created successfully
    }

    res.status(201).json({
      message: 'Salary record created successfully',
      data: salary
    });

  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get salary by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const salary = await Salary.findByPk(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    res.json(salary);
  } catch (error) {
    console.error('Get salary by ID error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Update salary record
router.put('/:id', [auth, salaryValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const salary = await Salary.findByPk(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    await salary.update(req.body);

    res.json({
      message: 'Salary record updated successfully',
      data: salary
    });

  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Delete salary record
router.delete('/:id', [auth], async (req, res) => {
  try {
    const salary = await Salary.findByPk(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    await salary.destroy();

    res.json({ message: 'Salary record deleted successfully' });

  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 