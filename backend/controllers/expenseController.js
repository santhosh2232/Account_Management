const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Get all expenses with filtering and pagination
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, startDate, endDate, sortBy = 'date', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.userId };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filter
    if (category) {
      whereClause.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    const expenses = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
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
      where: { id: req.params.id, userId: req.user.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
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

    const { amount, description, category, date, paymentMethod } = req.body;

    const expense = await Expense.create({
      amount,
      description,
      category,
      date: date || new Date(),
      paymentMethod,
      userId: req.user.userId
    });

    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense: createdExpense
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
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { amount, description, category, date, paymentMethod } = req.body;

    await expense.update({
      amount: amount || expense.amount,
      description: description || expense.description,
      category: category || expense.category,
      date: date || expense.date,
      paymentMethod: paymentMethod || expense.paymentMethod
    });

    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense
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
      where: { id: req.params.id, userId: req.user.userId }
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
    const whereClause = { userId: req.user.userId };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    const totalExpense = await Expense.sum('amount', { where: whereClause });
    const expenseCount = await Expense.count({ where: whereClause });

    // Get expense by category
    const expenseByCategory = await Expense.findAll({
      where: whereClause,
      attributes: [
        'category',
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      group: ['category']
    });

    // Get monthly expense for the last 12 months
    const monthlyExpense = await Expense.findAll({
      where: whereClause,
      attributes: [
        [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('date'), '%Y-%m'), 'month'],
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      group: [Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('date'), '%Y-%m')],
      order: [[Expense.sequelize.fn('DATE_FORMAT', Expense.sequelize.col('date'), '%Y-%m'), 'DESC']],
      limit: 12
    });

    // Get expense by payment method
    const expenseByPaymentMethod = await Expense.findAll({
      where: whereClause,
      attributes: [
        'paymentMethod',
        [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
      ],
      group: ['paymentMethod']
    });

    res.json({
      totalExpense: totalExpense || 0,
      expenseCount,
      expenseByCategory,
      monthlyExpense,
      expenseByPaymentMethod
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