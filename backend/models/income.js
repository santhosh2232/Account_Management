const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Income = sequelize.define('Income', {
  sno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Auto-increment primary key'
  },
  income_cat: {
    type: DataTypes.ENUM('1', '2', '3', '4', '5'),
    allowNull: false,
    comment: '1-Course, 2-Internship, 3-Project, 4-Digital Marketing, 5-Others'
  },
  income_cat_remarks: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Remarks about the income category'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Income Amount'
  },
  received_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Person or account who received the amount'
  },
  received_on: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Date when amount was received'
  },
  sender_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Name of the person who sent the amount'
  },
  sender_mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Mobile number of the sender'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'General remarks about the income'
  },
  status: {
    type: DataTypes.ENUM('1', '2', '3', '4'),
    defaultValue: '1',
    allowNull: false,
    comment: '1-Success, 2-Failed, 3-Wrong Entry, 4-Inactive'
  }
}, {
  tableName: 'income',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Income; 