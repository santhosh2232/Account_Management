const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.DB_NAME || 'accounts_management',
  config.DB_USER || 'root',
  config.DB_PASSWORD || '',
  {
    host: config.DB_HOST || 'localhost',
    port: config.DB_PORT || 3306,
    dialect: 'mysql',
    logging: config.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize; 