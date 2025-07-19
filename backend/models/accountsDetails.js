const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const AccountsDetails = sequelize.define('AccountsDetails', {
  sno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Auto-increment primary key'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Foreign key to users table'
  },
  entry_type: {
    type: DataTypes.ENUM('1', '2', '3'),
    allowNull: false,
    comment: '1-Income, 2-Expense, 3-Salary'
  },
  income_sno: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to income table'
  },
  expenses_sno: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to expenses table'
  },
  salary_sno: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to salary table'
  },
  entry_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Data Updated by'
  },
  ip_address: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  browser_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  browser_ver: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  operating_sys: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'accounts_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AccountsDetails; 