const express = require('express');
const { AccountsDetails, Income, Expense, Salary } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all accounts details with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      entryType,
      startDate,
      endDate,
      entryBy,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (entryType) {
      whereClause.entry_type = entryType;
    }

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (entryBy) {
      whereClause.entry_by = {
        [Op.like]: `%${entryBy}%`
      };
    }

    const { count, rows } = await AccountsDetails.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Income,
          as: 'income',
          attributes: ['sno', 'income_cat', 'amount', 'sender_name', 'received_by', 'received_on']
        },
        {
          model: Expense,
          as: 'expense',
          attributes: ['sno', 'expense_cat', 'amount', 'spent_by', 'spent_on', 'spent_through']
        },
        {
          model: Salary,
          as: 'salary',
          attributes: ['sno', 'payment_type', 'amount', 'payment_to_whom', 'spent_date', 'payment_through']
        }
      ],
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
    console.error('Get accounts details error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get accounts details by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const accountDetail = await AccountsDetails.findByPk(req.params.id, {
      include: [
        {
          model: Income,
          as: 'income'
        },
        {
          model: Expense,
          as: 'expense'
        },
        {
          model: Salary,
          as: 'salary'
        }
      ]
    });
    
    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail record not found' });
    }

    res.json(accountDetail);
  } catch (error) {
    console.error('Get account detail by ID error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get transaction summary
router.get('/summary/transactions', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {};

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const summary = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        'entry_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('sno')), 'count']
      ],
      group: ['entry_type']
    });

    const totalTransactions = await AccountsDetails.count({ where: whereClause });

    res.json({
      totalTransactions,
      byType: summary
    });

  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get user activity
router.get('/activity/user/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await AccountsDetails.findAndCountAll({
      where: { entry_by: username },
      include: [
        {
          model: Income,
          as: 'income',
          attributes: ['sno', 'income_cat', 'amount', 'sender_name', 'received_by', 'received_on']
        },
        {
          model: Expense,
          as: 'expense',
          attributes: ['sno', 'expense_cat', 'amount', 'spent_by', 'spent_on', 'spent_through']
        },
        {
          model: Salary,
          as: 'salary',
          attributes: ['sno', 'payment_type', 'amount', 'payment_to_whom', 'spent_date', 'payment_through']
        }
      ],
      order: [['created_at', 'DESC']],
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
    console.error('Get user activity error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 