const sequelize = require('./sequelize');

const User = require('./user');
const Income = require('./income');
const Expense = require('./expense');
const Salary = require('./salary');
const AccountsDetails = require('./accountsDetails');

// Define associations based on the actual database structure
// AccountsDetails has foreign keys to Income, Expense, and Salary
AccountsDetails.belongsTo(Income, { foreignKey: 'income_sno', as: 'income' });
AccountsDetails.belongsTo(Expense, { foreignKey: 'expenses_sno', as: 'expense' });
AccountsDetails.belongsTo(Salary, { foreignKey: 'salary_sno', as: 'salary' });
AccountsDetails.belongsTo(User, { foreignKey: 'entry_by', targetKey: 'username', as: 'entryByUser' });

Income.hasMany(AccountsDetails, { foreignKey: 'income_sno', as: 'accountsDetails' });
Expense.hasMany(AccountsDetails, { foreignKey: 'expenses_sno', as: 'accountsDetails' });
Salary.hasMany(AccountsDetails, { foreignKey: 'salary_sno', as: 'accountsDetails' });

module.exports = {
  sequelize,
  User,
  Income,
  Expense,
  Salary,
  AccountsDetails
}; 