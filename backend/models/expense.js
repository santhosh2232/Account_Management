const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Expense = sequelize.define('Expense', {
  sno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Auto-increment primary key'
  },
  expense_cat: {
    type: DataTypes.ENUM('1', '2', '3', '4', '5'),
    allowNull: false,
    comment: '1-Travel, 2-Food, 3-stationery, 4-Banking, 5-Others'
  },
  expense_cat_remarks: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Remarks about the expense category'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Income Amount'
  },
  spent_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Person or account who spent the amount'
  },
  spent_on: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when amount was spent'
  },
  spent_through: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Transaction mode'
  },
  remarks: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'General remarks about the expense'
  },
  status: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    defaultValue: '1',
    allowNull: false,
    comment: '1-Success, 2-Failed, 3-Wrong Entry, 4-Inactive'
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Expense; 