const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const app = express();
const PORT = config.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const salaryRoutes = require('./routes/salary');
const accountsDetailsRoutes = require('./routes/accountsDetails');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS || 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const { sequelize } = require('./models');

// Test database connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    // Sync all models with database
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database models synchronized successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/accounts-details', accountsDetailsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Accounts Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV || 'development'}`);
}); 