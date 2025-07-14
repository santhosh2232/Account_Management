const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Salary = require('../models/Salary');
const User = require('../models/User');

// @desc    Get all salaries with filtering and pagination
// @route   GET /api/salary
// @access  Private
const getSalaries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'paymentDate', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.userId };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { paymentMethod: { [Op.like]: `%${search}%` } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.paymentDate = {};
      if (startDate) whereClause.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.paymentDate[Op.lte] = new Date(endDate);
    }

    const salaries = await Salary.findAndCountAll({
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

    const totalPages = Math.ceil(salaries.count / limit);

    res.json({
      salaries: salaries.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: salaries.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single salary
// @route   GET /api/salary/:id
// @access  Private
const getSalary = async (req, res) => {
  try {
    const salary = await Salary.findOne({
      where: { id: req.params.id, userId: req.user.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    res.json({ salary });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create salary
// @route   POST /api/salary
// @access  Private
const createSalary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      basicSalary, 
      allowances, 
      deductions, 
      netSalary, 
      paymentDate, 
      paymentMethod, 
      description,
      month,
      year
    } = req.body;

    const salary = await Salary.create({
      basicSalary,
      allowances,
      deductions,
      netSalary,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      description,
      month,
      year,
      userId: req.user.userId
    });

    const createdSalary = await Salary.findByPk(salary.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Salary created successfully',
      salary: createdSalary
    });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update salary
// @route   PUT /api/salary/:id
// @access  Private
const updateSalary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const salary = await Salary.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    const { 
      basicSalary, 
      allowances, 
      deductions, 
      netSalary, 
      paymentDate, 
      paymentMethod, 
      description,
      month,
      year
    } = req.body;

    await salary.update({
      basicSalary: basicSalary || salary.basicSalary,
      allowances: allowances || salary.allowances,
      deductions: deductions || salary.deductions,
      netSalary: netSalary || salary.netSalary,
      paymentDate: paymentDate || salary.paymentDate,
      paymentMethod: paymentMethod || salary.paymentMethod,
      description: description || salary.description,
      month: month || salary.month,
      year: year || salary.year
    });

    const updatedSalary = await Salary.findByPk(salary.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Salary updated successfully',
      salary: updatedSalary
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete salary
// @route   DELETE /api/salary/:id
// @access  Private
const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    await salary.destroy();

    res.json({ message: 'Salary deleted successfully' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get salary statistics
// @route   GET /api/salary/stats
// @access  Private
const getSalaryStats = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    const whereClause = { userId: req.user.userId };

    if (startDate || endDate) {
      whereClause.paymentDate = {};
      if (startDate) whereClause.paymentDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.paymentDate[Op.lte] = new Date(endDate);
    }

    if (year) {
      whereClause.year = year;
    }

    const totalNetSalary = await Salary.sum('netSalary', { where: whereClause });
    const totalBasicSalary = await Salary.sum('basicSalary', { where: whereClause });
    const totalAllowances = await Salary.sum('allowances', { where: whereClause });
    const totalDeductions = await Salary.sum('deductions', { where: whereClause });
    const salaryCount = await Salary.count({ where: whereClause });

    // Get monthly salary for the last 12 months
    const monthlySalary = await Salary.findAll({
      where: whereClause,
      attributes: [
        [Salary.sequelize.fn('DATE_FORMAT', Salary.sequelize.col('paymentDate'), '%Y-%m'), 'month'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('netSalary')), 'totalNetSalary'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('basicSalary')), 'totalBasicSalary']
      ],
      group: [Salary.sequelize.fn('DATE_FORMAT', Salary.sequelize.col('paymentDate'), '%Y-%m')],
      order: [[Salary.sequelize.fn('DATE_FORMAT', Salary.sequelize.col('paymentDate'), '%Y-%m'), 'DESC']],
      limit: 12
    });

    // Get salary by payment method
    const salaryByPaymentMethod = await Salary.findAll({
      where: whereClause,
      attributes: [
        'paymentMethod',
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('netSalary')), 'total']
      ],
      group: ['paymentMethod']
    });

    // Get yearly salary summary
    const yearlySalary = await Salary.findAll({
      where: whereClause,
      attributes: [
        'year',
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('netSalary')), 'totalNetSalary'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('basicSalary')), 'totalBasicSalary'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('allowances')), 'totalAllowances'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('deductions')), 'totalDeductions']
      ],
      group: ['year'],
      order: [['year', 'DESC']]
    });

    res.json({
      totalNetSalary: totalNetSalary || 0,
      totalBasicSalary: totalBasicSalary || 0,
      totalAllowances: totalAllowances || 0,
      totalDeductions: totalDeductions || 0,
      salaryCount,
      monthlySalary,
      salaryByPaymentMethod,
      yearlySalary
    });
  } catch (error) {
    console.error('Get salary stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSalaries,
  getSalary,
  createSalary,
  updateSalary,
  deleteSalary,
  getSalaryStats
}; 