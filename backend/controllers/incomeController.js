const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Income = require('../models/Income');
const { User, AccountsDetails } = require('../models');

// @desc    Get all incomes with filtering and pagination
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, income_cat, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { income_cat_remarks: { [Op.like]: `%${search}%` } },
        { sender_name: { [Op.like]: `%${search}%` } },
        { received_by: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filter
    if (income_cat) {
      whereClause.income_cat = income_cat;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.received_on = {};
      if (startDate) whereClause.received_on[Op.gte] = new Date(startDate);
      if (endDate) whereClause.received_on[Op.lte] = new Date(endDate);
    }

    const incomes = await Income.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(incomes.count / limit);

    res.json({
      incomes: incomes.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: incomes.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single income
// @route   GET /api/income/:id
// @access  Private
const getIncome = async (req, res) => {
  try {
    const income = await Income.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.json({ income });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create income
// @route   POST /api/income
// @access  Private
const createIncome = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      income_cat, 
      income_cat_remarks, 
      amount, 
      received_by, 
      received_on, 
      sender_name, 
      sender_mobile, 
      remarks,
      status = '1'
    } = req.body;

    const income = await Income.create({
      user_id: req.user.id, // Associate with authenticated user
      income_cat,
      income_cat_remarks,
      amount,
      received_by,
      received_on: received_on || new Date(),
      sender_name,
      sender_mobile,
      remarks,
      status
    });

    res.status(201).json({
      message: 'Income created successfully',
      income
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const income = await Income.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    const { 
      income_cat, 
      income_cat_remarks, 
      amount, 
      received_by, 
      received_on, 
      sender_name, 
      sender_mobile, 
      remarks,
      status
    } = req.body;

    await income.update({
      income_cat: income_cat || income.income_cat,
      income_cat_remarks: income_cat_remarks || income.income_cat_remarks,
      amount: amount || income.amount,
      received_by: received_by || income.received_by,
      received_on: received_on || income.received_on,
      sender_name: sender_name || income.sender_name,
      sender_mobile: sender_mobile || income.sender_mobile,
      remarks: remarks || income.remarks,
      status: status || income.status
    });

    res.json({
      message: 'Income updated successfully',
      income
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    await income.destroy();

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get income statistics
// @route   GET /api/income/stats
// @access  Private
const getIncomeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    if (startDate || endDate) {
      whereClause.received_on = {};
      if (startDate) whereClause.received_on[Op.gte] = new Date(startDate);
      if (endDate) whereClause.received_on[Op.lte] = new Date(endDate);
    }

    const totalIncome = await Income.sum('amount', { where: whereClause });
    const incomeCount = await Income.count({ where: whereClause });

    // Get income by category
    const incomeByCategory = await Income.findAll({
      where: whereClause,
      attributes: [
        'income_cat',
        [Income.sequelize.fn('SUM', Income.sequelize.col('amount')), 'total']
      ],
      group: ['income_cat']
    });

    // Get monthly income for the last 12 months
    const monthlyIncome = await Income.findAll({
      where: whereClause,
      attributes: [
        [Income.sequelize.fn('TO_CHAR', Income.sequelize.col('received_on'), 'YYYY-MM'), 'month'],
        [Income.sequelize.fn('SUM', Income.sequelize.col('amount')), 'total']
      ],
      group: [Income.sequelize.fn('TO_CHAR', Income.sequelize.col('received_on'), 'YYYY-MM')],
      order: [[Income.sequelize.fn('TO_CHAR', Income.sequelize.col('received_on'), 'YYYY-MM'), 'DESC']],
      limit: 12
    });

    res.json({
      totalIncome: totalIncome || 0,
      incomeCount,
      incomeByCategory,
      monthlyIncome
    });
  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats
}; 