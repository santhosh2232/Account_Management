const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const AccountsDetails = require('../models/AccountsDetails');
const User = require('../models/User');

// @desc    Get all accounts details with filtering and pagination
// @route   GET /api/accounts-details
// @access  Private
const getAccountsDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, accountType, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.userId };

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { accountName: { [Op.like]: `%${search}%` } },
        { accountNumber: { [Op.like]: `%${search}%` } },
        { bankName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Account type filter
    if (accountType) {
      whereClause.accountType = accountType;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const accountsDetails = await AccountsDetails.findAndCountAll({
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
      where: { id: req.params.id, userId: req.user.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
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
      accountName, 
      accountNumber, 
      bankName, 
      accountType, 
      balance, 
      currency, 
      description,
      isActive = true
    } = req.body;

    const accountDetail = await AccountsDetails.create({
      accountName,
      accountNumber,
      bankName,
      accountType,
      balance: balance || 0,
      currency: currency || 'USD',
      description,
      isActive,
      userId: req.user.userId
    });

    const createdAccountDetail = await AccountsDetails.findByPk(accountDetail.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Account detail created successfully',
      accountDetail: createdAccountDetail
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
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail not found' });
    }

    const { 
      accountName, 
      accountNumber, 
      bankName, 
      accountType, 
      balance, 
      currency, 
      description,
      isActive
    } = req.body;

    await accountDetail.update({
      accountName: accountName || accountDetail.accountName,
      accountNumber: accountNumber || accountDetail.accountNumber,
      bankName: bankName || accountDetail.bankName,
      accountType: accountType || accountDetail.accountType,
      balance: balance !== undefined ? balance : accountDetail.balance,
      currency: currency || accountDetail.currency,
      description: description || accountDetail.description,
      isActive: isActive !== undefined ? isActive : accountDetail.isActive
    });

    const updatedAccountDetail = await AccountsDetails.findByPk(accountDetail.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: 'Account detail updated successfully',
      accountDetail: updatedAccountDetail
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
      where: { id: req.params.id, userId: req.user.userId }
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
    const whereClause = { userId: req.user.userId };

    const totalAccounts = await AccountsDetails.count({ where: whereClause });
    const activeAccounts = await AccountsDetails.count({ where: { ...whereClause, isActive: true } });
    const totalBalance = await AccountsDetails.sum('balance', { where: whereClause });

    // Get accounts by type
    const accountsByType = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        'accountType',
        [AccountsDetails.sequelize.fn('COUNT', AccountsDetails.sequelize.col('id')), 'count'],
        [AccountsDetails.sequelize.fn('SUM', AccountsDetails.sequelize.col('balance')), 'totalBalance']
      ],
      group: ['accountType']
    });

    // Get accounts by bank
    const accountsByBank = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        'bankName',
        [AccountsDetails.sequelize.fn('COUNT', AccountsDetails.sequelize.col('id')), 'count'],
        [AccountsDetails.sequelize.fn('SUM', AccountsDetails.sequelize.col('balance')), 'totalBalance']
      ],
      group: ['bankName']
    });

    // Get accounts by currency
    const accountsByCurrency = await AccountsDetails.findAll({
      where: whereClause,
      attributes: [
        'currency',
        [AccountsDetails.sequelize.fn('COUNT', AccountsDetails.sequelize.col('id')), 'count'],
        [AccountsDetails.sequelize.fn('SUM', AccountsDetails.sequelize.col('balance')), 'totalBalance']
      ],
      group: ['currency']
    });

    // Get recent accounts (last 5)
    const recentAccounts = await AccountsDetails.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalAccounts,
      activeAccounts,
      totalBalance: totalBalance || 0,
      accountsByType,
      accountsByBank,
      accountsByCurrency,
      recentAccounts
    });
  } catch (error) {
    console.error('Get accounts details stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle account status
// @route   PATCH /api/accounts-details/:id/toggle-status
// @access  Private
const toggleAccountStatus = async (req, res) => {
  try {
    const accountDetail = await AccountsDetails.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!accountDetail) {
      return res.status(404).json({ message: 'Account detail not found' });
    }

    await accountDetail.update({ isActive: !accountDetail.isActive });

    const updatedAccountDetail = await AccountsDetails.findByPk(accountDetail.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      message: `Account ${accountDetail.isActive ? 'activated' : 'deactivated'} successfully`,
      accountDetail: updatedAccountDetail
    });
  } catch (error) {
    console.error('Toggle account status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAccountsDetails,
  getAccountDetail,
  createAccountDetail,
  updateAccountDetail,
  deleteAccountDetail,
  getAccountsDetailsStats,
  toggleAccountStatus
}; 