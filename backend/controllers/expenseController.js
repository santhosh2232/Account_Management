const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Get all expenses with filtering and pagination
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, expense_cat, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { expense_cat_remarks: { [Op.like]: `%${search}%` } },
        { spent_by: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filter
    if (expense_cat) {
      whereClause.expense_cat = expense_cat;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.spent_on = {};
      if (startDate) whereClause.spent_on[Op.gte] = new Date(startDate);
      if (endDate) whereClause.spent_on[Op.lte] = new Date(endDate);
    }

    const expenses = await Expense.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(expenses.count / limit);

    res.json({
      expenses: expenses.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: expenses.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      expense_cat, 
      expense_cat_remarks, 
      amount, 
      spent_by, 
      spent_on, 
      spent_through, 
      remarks,
      status = '1'
    } = req.body;

    const expense = await Expense.create({
      user_id: req.user.id, // Associate with authenticated user
      expense_cat,
      expense_cat_remarks,
      amount,
      spent_by,
      spent_on: spent_on || new Date(),
      spent_through,
      remarks,
      status
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { 
      expense_cat, 
      expense_cat_remarks, 
      amount, 
      spent_by, 
      spent_on, 
      spent_through, 
      remarks,
      status
    } = req.body;

    await expense.update({
      expense_cat: expense_cat || expense.expense_cat,
      expense_cat_remarks: expense_cat_remarks || expense.expense_cat_remarks,
      amount: amount || expense.amount,
      spent_by: spent_by || expense.spent_by,
      spent_on: spent_on || expense.spent_on,
      spent_through: spent_through || expense.spent_through,
      remarks: remarks || expense.remarks,
      status: status || expense.status
    });

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    if (startDate || endDate) {
      whereClause.spent_on = {};
      if (startDate) whereClause.spent_on[Op.gte] = new Date(startDate);
      if (endDate) whereClause.spent_on[Op.lte] = new Date(endDate);
    }

    const totalExpense = await Expense.sum('amount', { where: whereClause });
    const expenseCount = await Expense.count({ where: whereClause });

    // Get expense by category
    const expenseByCategory = await Expense.findAll({
      where: whereClause,
      attributes: [
        'expense_cat',
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      group: ['expense_cat']
    });

    // Get monthly expense for the last 12 months
    const monthlyExpense = await Expense.findAll({
      where: whereClause,
      attributes: [
        [Expense.sequelize.fn('TO_CHAR', Expense.sequelize.col('spent_on'), 'YYYY-MM'), 'month'],
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      group: [Expense.sequelize.fn('TO_CHAR', Expense.sequelize.col('spent_on'), 'YYYY-MM')],
      order: [[Expense.sequelize.fn('TO_CHAR', Expense.sequelize.col('spent_on'), 'YYYY-MM'), 'DESC']],
      limit: 12
    });

    res.json({
      totalExpense: totalExpense || 0,
      expenseCount,
      expenseByCategory,
      monthlyExpense
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
}; 