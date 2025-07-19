const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Salary = require('../models/salary');
const User = require('../models/user');

// @desc    Get all salaries with filtering and pagination
// @route   GET /api/salary
// @access  Private
const getSalaries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { payment_type_remarks: { [Op.like]: `%${search}%` } },
        { payment_to_whom: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.spent_date = {};
      if (startDate) whereClause.spent_date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.spent_date[Op.lte] = new Date(endDate);
    }

    const salaries = await Salary.findAndCountAll({
      where: whereClause,
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
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
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
      payment_type, 
      payment_type_remarks, 
      amount, 
      payment_to_whom, 
      spent_date, 
      payment_through, 
      remarks
    } = req.body;

    const salary = await Salary.create({
      user_id: req.user.id, // Associate with authenticated user
      payment_type,
      payment_type_remarks,
      amount,
      payment_to_whom,
      spent_date: spent_date || new Date(),
      payment_through,
      remarks
    });

    res.status(201).json({
      message: 'Salary created successfully',
      salary
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
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    const { 
      payment_type, 
      payment_type_remarks, 
      amount, 
      payment_to_whom, 
      spent_date, 
      payment_through, 
      remarks
    } = req.body;

    await salary.update({
      payment_type: payment_type || salary.payment_type,
      payment_type_remarks: payment_type_remarks || salary.payment_type_remarks,
      amount: amount || salary.amount,
      payment_to_whom: payment_to_whom || salary.payment_to_whom,
      spent_date: spent_date || salary.spent_date,
      payment_through: payment_through || salary.payment_through,
      remarks: remarks || salary.remarks
    });

    res.json({
      message: 'Salary updated successfully',
      salary
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
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
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
    const { startDate, endDate } = req.query;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    if (startDate || endDate) {
      whereClause.spent_date = {};
      if (startDate) whereClause.spent_date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.spent_date[Op.lte] = new Date(endDate);
    }

    const totalSalary = await Salary.sum('amount', { where: whereClause });
    const salaryCount = await Salary.count({ where: whereClause });

    // Get salary by payment type
    const salaryByPaymentType = await Salary.findAll({
      where: whereClause,
      attributes: [
        'payment_type',
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('amount')), 'total']
      ],
      group: ['payment_type']
    });

    // Get monthly salary for the last 12 months
    const monthlySalary = await Salary.findAll({
      where: whereClause,
      attributes: [
        [Salary.sequelize.fn('TO_CHAR', Salary.sequelize.col('spent_date'), 'YYYY-MM'), 'month'],
        [Salary.sequelize.fn('SUM', Salary.sequelize.col('amount')), 'total']
      ],
      group: [Salary.sequelize.fn('TO_CHAR', Salary.sequelize.col('spent_date'), 'YYYY-MM')],
      order: [[Salary.sequelize.fn('TO_CHAR', Salary.sequelize.col('spent_date'), 'YYYY-MM'), 'DESC']],
      limit: 12
    });

    res.json({
      totalSalary: totalSalary || 0,
      salaryCount,
      salaryByPaymentType,
      monthlySalary
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