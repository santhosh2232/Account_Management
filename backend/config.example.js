// Database Configuration Example
// Copy this file to config.js and update with your actual database credentials

module.exports = {
  // Server Configuration
  PORT: 3000,
  NODE_ENV: 'development',

  // Database Configuration
  DB_HOST: 'localhost',
  DB_PORT: 3306,
  DB_NAME: 'accounts_management',
  DB_USER: 'root',
  DB_PASSWORD: 'your_mysql_password_here',

  // JWT Configuration
  JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',

  // Frontend URL (for CORS)
  FRONTEND_URL: 'http://localhost:4200',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100
}; 