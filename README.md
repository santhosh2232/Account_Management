# Account Management System

A professional account management web application built with Angular frontend and Node.js backend with PostgreSQL database. Features user-specific data isolation, comprehensive financial tracking, and modern UI design.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure login/register/logout system
- **User-specific Data Isolation**: Each user can only view their own data
- **Role-based Access Control**: Admin and User roles with appropriate permissions
- **Password Security**: bcrypt encryption for password hashing
- **Session Management**: Automatic token refresh and logout handling

### 📊 Dashboard & Analytics
- **Real-time Overview**: Total income, expenses, and salary with net balance
- **Interactive Charts**: Income vs Expenses visualization using Chart.js
- **Summary Cards**: Quick statistics for all financial categories
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Currency Formatting**: Consistent ₹ (INR) formatting across all pages

### 💰 Financial Management
- **Income Management**: Track various income sources (Course, Internship, Project, Digital Marketing, Others)
- **Expense Tracking**: Monitor expenses by category (Travel, Food, Stationery, Banking, Others)
- **Salary Management**: Handle different payment types (Shares, Salary, Others)
- **Status Tracking**: Success, Failed, Wrong Entry, and Inactive status for transactions
- **Audit Trail**: Complete transaction history with user activity tracking

### 🔍 Advanced Features
- **Advanced Filtering**: Filter by date range, category, status, and search terms
- **Excel Export**: Download financial data in Excel format
- **Real-time Updates**: Data updates automatically across all components
- **Form Validation**: Comprehensive client and server-side validation
- **Loading States**: Smooth user experience with loading indicators

## 📦 Tech Stack

### Frontend
- **Angular 14+**: Modern reactive framework
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Chart.js with ng2-charts**: Interactive data visualization
- **Angular Reactive Forms**: Form handling and validation
- **Angular Router**: Client-side routing with guards
- **HTTP Interceptors**: Automatic token handling and error management

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Robust relational database
- **Sequelize ORM**: Database abstraction and modeling
- **JWT Authentication**: JSON Web Token for secure authentication
- **bcryptjs**: Password hashing and verification
- **Express Validator**: Input validation and sanitization

## 🗄 Database Schema (PostgreSQL)

The application uses PostgreSQL with the following tables:

### Core Tables
- `users` - User authentication and roles
- `income` - Income records with categories and status
- `expenses` - Expense records with categories and status
- `salary` - Salary/payment records by type
- `accounts_details` - Audit trail and transaction linking

### Key Features
- **User-specific Data**: All financial records include `user_id` foreign key
- **Status Management**: Transaction status tracking (Success, Failed, Wrong Entry, Inactive)
- **Audit Trail**: Complete transaction history with browser and system information
- **Referential Integrity**: Proper foreign key constraints and cascading

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Angular CLI (v14 or higher)

### 1. Database Setup

Create a PostgreSQL database and run the following SQL:

```sql
-- Create database
CREATE DATABASE account_management;
\c account_management;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income table
CREATE TABLE income (
    sno SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    income_cat VARCHAR(1) NOT NULL CHECK (income_cat IN ('1', '2', '3', '4', '5')),
    income_cat_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    received_by VARCHAR(50),
    received_on DATE,
    sender_name VARCHAR(50),
    sender_mobile VARCHAR(20),
    remarks TEXT,
    status VARCHAR(1) DEFAULT '1' CHECK (status IN ('1', '2', '3', '4')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    sno SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expense_cat VARCHAR(1) NOT NULL CHECK (expense_cat IN ('1', '2', '3', '4', '5')),
    expense_cat_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    spent_by VARCHAR(50),
    spent_on DATE,
    spent_through VARCHAR(50),
    remarks VARCHAR(200),
    status VARCHAR(1) DEFAULT '1' CHECK (status IN ('1', '2', '3', '4')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salary table
CREATE TABLE salary (
    sno SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(1) NOT NULL CHECK (payment_type IN ('1', '2', '3')),
    payment_type_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    payment_to_whom VARCHAR(50),
    spent_date DATE,
    payment_through VARCHAR(50),
    remarks VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts Details table
CREATE TABLE accounts_details (
    sno SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    entry_type VARCHAR(1) NOT NULL CHECK (entry_type IN ('1', '2', '3')),
    income_sno INTEGER REFERENCES income(sno) ON DELETE SET NULL,
    expenses_sno INTEGER REFERENCES expenses(sno) ON DELETE SET NULL,
    salary_sno INTEGER REFERENCES salary(sno) ON DELETE SET NULL,
    entry_by VARCHAR(50),
    ip_address VARCHAR(45),
    browser_name VARCHAR(50),
    browser_ver VARCHAR(20),
    operating_sys VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_salary_user_id ON salary(user_id);
CREATE INDEX idx_accounts_details_user_id ON accounts_details(user_id);
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with PostgreSQL configuration
cp .env.example .env

# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=account_management
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your-super-secret-jwt-key

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd userInterface

# Install dependencies
npm install

# Start the development server
ng serve
```

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=account_management
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

## 📱 Usage

### Getting Started
1. **Access the application**: Open `http://localhost:4200` in your browser
2. **Register/Login**: Create an account or login with existing credentials
3. **Dashboard**: View overview statistics, charts, and recent transactions
4. **Manage Records**: Add, edit, delete income, expenses, and salary records
5. **Filter & Search**: Use advanced filtering by date, category, status, and search terms
6. **Export Data**: Download financial data in Excel format
7. **View History**: Check transaction history and audit trail

### Key Features
- **User-specific Data**: Each user only sees their own financial records
- **Real-time Updates**: Changes reflect immediately across all components
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Professional UI**: Clean, modern interface with consistent styling

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Income Management
- `GET /api/income` - Get user's income records (with filtering)
- `POST /api/income` - Create new income record
- `PUT /api/income/:id` - Update income record
- `DELETE /api/income/:id` - Delete income record
- `PUT /api/income/:id/status` - Update income status only

### Expense Management
- `GET /api/expenses` - Get user's expense records (with filtering)
- `POST /api/expenses` - Create new expense record
- `PUT /api/expenses/:id` - Update expense record
- `DELETE /api/expenses/:id` - Delete expense record

### Salary Management
- `GET /api/salary` - Get user's salary records (with filtering)
- `POST /api/salary` - Create new salary record
- `PUT /api/salary/:id` - Update salary record
- `DELETE /api/salary/:id` - Delete salary record

### Dashboard & Analytics
- `GET /api/dashboard` - Get dashboard statistics and charts data
- `GET /api/accounts-details` - Get transaction history
- `GET /api/accounts-details/summary` - Get transaction summary

## 🎨 UI Components & Features

### Summary Cards
- **Income Page**: Total income, total records, failed payments, inactive payments
- **Expense Page**: Total expenses, total records, failed payments, inactive payments
- **Salary Page**: Total salary, total records, shares count, salary count
- **Dashboard**: Overview of all financial categories with net balance

### Advanced Filtering
- **Date Range**: Filter by start and end dates
- **Category Filtering**: Filter by income/expense categories
- **Status Filtering**: Filter by transaction status
- **Search Functionality**: Search by name, remarks, and other fields
- **Clear Filters**: Reset all filters to default

### Data Export
- **Excel Export**: Download filtered data in Excel format
- **Formatted Data**: Properly formatted currency and dates
- **Category Labels**: Human-readable category names

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: bcrypt hashing for password security
- **User Data Isolation**: Complete separation of user data
- **Input Validation**: Comprehensive validation on both client and server
- **CORS Protection**: Configured for secure cross-origin requests
- **SQL Injection Prevention**: Parameterized queries with Sequelize
- **XSS Protection**: Input sanitization and output encoding

## 📊 Dashboard Features

### Overview Statistics
- **Total Income**: Sum of all successful income transactions
- **Total Expenses**: Sum of all expense transactions
- **Total Salary**: Sum of all salary payments
- **Net Balance**: Income - Expenses calculation
- **Recent Transactions**: Latest 5 transactions across all categories

### Interactive Charts
- **Income vs Expenses**: Monthly comparison chart
- **Category Breakdown**: Pie charts for income and expense categories
- **Payment Type Distribution**: Salary payment type breakdown
- **Responsive Design**: Charts adapt to screen size

### Summary Cards
- **Quick Stats**: Key metrics at a glance
- **Color-coded Icons**: Visual indicators for different categories
- **Real-time Updates**: Statistics update with data changes

## 🚀 Recent Updates & Improvements

### Database Migration
- **MySQL to PostgreSQL**: Migrated from MySQL to PostgreSQL for better performance
- **User-specific Data**: Added `user_id` foreign keys to all financial tables
- **Improved Schema**: Enhanced data types and constraints
- **Performance Indexes**: Added database indexes for better query performance

### Security Enhancements
- **Data Isolation**: Complete user data separation
- **Enhanced Authentication**: Improved JWT token handling
- **Input Validation**: Comprehensive validation across all endpoints
- **Error Handling**: Better error messages and logging

### UI/UX Improvements
- **Summary Cards**: Added to all financial pages
- **Consistent Currency Formatting**: Standardized ₹ formatting
- **Responsive Design**: Improved mobile experience
- **Loading States**: Better user feedback during operations
- **Form Validation**: Enhanced client-side validation

### Feature Additions
- **Excel Export**: Download functionality for all data
- **Advanced Filtering**: Comprehensive filtering options
- **Status Management**: Transaction status tracking
- **Audit Trail**: Complete transaction history
- **Real-time Updates**: Automatic data refresh

## 🚀 Deployment

### Backend Deployment
1. Set up a production PostgreSQL database
2. Configure environment variables for production
3. Build and deploy to your preferred hosting service (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the Angular application: `ng build --configuration production`
2. Deploy the `dist` folder to your web server or CDN

### Environment Setup
- Configure production database credentials
- Set secure JWT secret
- Enable HTTPS in production
- Configure CORS for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add your feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation for common solutions
- Review the API endpoints for integration help

## 🔄 Version History

### Latest Version
- **Database**: Migrated to PostgreSQL
- **Security**: Enhanced user data isolation
- **UI**: Added summary cards and improved design
- **Features**: Excel export and advanced filtering
- **Performance**: Database optimization and indexing

---

**Built with ❤️ using Angular, Node.js, and PostgreSQL** 