const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const AccountsDetails = require('../models/accountsDetails');
const User = require('../models/user');

// @desc    Get all accounts details with filtering and pagination
// @route   GET /api/accounts-details
// @access  Private
const getAccountsDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, entry_type, startDate, endDate, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { entry_by: { [Op.like]: `%${search}%` } },
        { ip_address: { [Op.like]: `%${search}%` } },
        { browser_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Entry type filter
    if (entry_type) {
      whereClause.entry_type = entry_type;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) whereClause.created_at[Op.gte] = new Date(startDate);
      if (endDate) whereClause.created_at[Op.lte] = new Date(endDate);
    }

    const accountsDetails = await AccountsDetails.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(accountsDetails.count / limit);

    res.json({
      accountsDetails: accountsDetails.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: accountsDetails.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get accounts details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single account detail
// @route   GET /api/accounts-details/:id
// @access  Private
const getAccountDetail = async (req, res) => {
  try {
    const accountDetail = await AccountsDetails.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail not found' });
    }

    res.json({ accountDetail });
  } catch (error) {
    console.error('Get account detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create account detail
// @route   POST /api/accounts-details
// @access  Private
const createAccountDetail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      entry_type, 
      income_sno, 
      expenses_sno, 
      salary_sno, 
      entry_by, 
      ip_address, 
      browser_name,
      browser_ver,
      operating_sys
    } = req.body;

    const accountDetail = await AccountsDetails.create({
      user_id: req.user.id, // Associate with authenticated user
      entry_type,
      income_sno,
      expenses_sno,
      salary_sno,
      entry_by: entry_by || req.user.name,
      ip_address: ip_address || req.ip,
      browser_name: browser_name || req.headers['user-agent'],
      browser_ver: browser_ver,
      operating_sys: operating_sys
    });

    res.status(201).json({
      message: 'Account detail created successfully',
      accountDetail
    });
  } catch (error) {
    console.error('Create account detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update account detail
// @route   PUT /api/accounts-details/:id
// @access  Private
const updateAccountDetail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const accountDetail = await AccountsDetails.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail not found' });
    }

    const { 
      entry_type, 
      income_sno, 
      expenses_sno, 
      salary_sno, 
      entry_by, 
      ip_address, 
      browser_name,
      browser_ver,
      operating_sys
    } = req.body;

    await accountDetail.update({
      entry_type: entry_type || accountDetail.entry_type,
      income_sno: income_sno || accountDetail.income_sno,
      expenses_sno: expenses_sno || accountDetail.expenses_sno,
      salary_sno: salary_sno || accountDetail.salary_sno,
      entry_by: entry_by || accountDetail.entry_by,
      ip_address: ip_address || accountDetail.ip_address,
      browser_name: browser_name || accountDetail.browser_name,
      browser_ver: browser_ver || accountDetail.browser_ver,
      operating_sys: operating_sys || accountDetail.operating_sys
    });

    res.json({
      message: 'Account detail updated successfully',
      accountDetail
    });
  } catch (error) {
    console.error('Update account detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete account detail
// @route   DELETE /api/accounts-details/:id
// @access  Private
const deleteAccountDetail = async (req, res) => {
  try {
    const accountDetail = await AccountsDetails.findOne({
      where: {
        sno: req.params.id,
        user_id: req.user.id // Filter by authenticated user
      }
    });

    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail not found' });
    }

    await accountDetail.destroy();

    res.json({ message: 'Account detail deleted successfully' });
  } catch (error) {
    console.error('Delete account detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get accounts details statistics
// @route   GET /api/accounts-details/stats
// @access  Private
const getAccountsDetailsStats = async (req, res) => {
  try {
    const whereClause = {
      user_id: req.user.id // Filter by authenticated user
    };

    const totalEntries = await AccountsDetails.count({ where: whereClause });
    
    // Get entries by type
    const entriesByType = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        'entry_type',
        [AccountsDetails.sequelize.fn('COUNT', AccountsDetails.sequelize.col('sno')), 'count']
      ],
      group: ['entry_type']
    });

    // Get entries by month for the last 12 months
    const monthlyEntries = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        [AccountsDetails.sequelize.fn('TO_CHAR', AccountsDetails.sequelize.col('created_at'), 'YYYY-MM'), 'month'],
        [AccountsDetails.sequelize.fn('COUNT', AccountsDetails.sequelize.col('sno')), 'count']
      ],
      group: [AccountsDetails.sequelize.fn('TO_CHAR', AccountsDetails.sequelize.col('created_at'), 'YYYY-MM')],
      order: [[AccountsDetails.sequelize.fn('TO_CHAR', AccountsDetails.sequelize.col('created_at'), 'YYYY-MM'), 'DESC']],
      limit: 12
    });

    res.json({
      totalEntries,
      entriesByType,
      monthlyEntries
    });
  } catch (error) {
    console.error('Get accounts details stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAccountsDetails,
  getAccountDetail,
  createAccountDetail,
  updateAccountDetail,
  deleteAccountDetail,
  getAccountsDetailsStats
}; 