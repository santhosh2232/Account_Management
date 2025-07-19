const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Salary = sequelize.define('Salary', {
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
  payment_type: {
    type: DataTypes.ENUM('1', '2', '3'),
    allowNull: false,
    comment: '1-Shares, 2-Salary, 3-Others'
  },
  payment_type_remarks: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Remarks about the payment type'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Income Amount'
  },
  payment_to_whom: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Person or account who received the amount'
  },
  spent_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when amount was spent'
  },
  payment_through: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Transaction mode'
  },
  remarks: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'General remarks about the expense'
  }
}, {
  tableName: 'salary',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Salary; 