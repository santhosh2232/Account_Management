# Accounts Management System

A professional account management web application built with Angular 14 frontend and Node.js backend with MySQL database.

## 🚀 Features

- **Authentication**: JWT-based login/register/logout
- **Dashboard**: Overview with charts and statistics
- **CRUD Operations**: Full CRUD for Income, Expenses, and Salary
- **Role-based Access**: Admin and User roles
- **Filtering & Search**: Advanced filtering and search capabilities
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Real-time Charts**: Income vs Expenses visualization
- **Audit Trail**: Complete transaction history tracking

## 📦 Tech Stack

### Frontend
- Angular 14
- TailwindCSS
- Chart.js with ng2-charts
- Angular Reactive Forms
- Angular Router

### Backend
- Node.js
- Express.js
- MySQL with Sequelize ORM
- JWT Authentication
- bcryptjs for password hashing
- Express Validator

## 🗄 Database Schema

The application uses the following MySQL tables:
- `users` - User authentication and roles
- `income` - Income records with categories
- `expenses` - Expense records with categories  
- `salary` - Salary/payment records
- `accounts_details` - Audit trail and transaction linking

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Angular CLI (v14)

### 1. Database Setup

Create a MySQL database and run the following SQL:

```sql
-- Create database
CREATE DATABASE accounts_management;
USE accounts_management;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Income table
CREATE TABLE income (
    sno INT AUTO_INCREMENT PRIMARY KEY,
    income_cat ENUM('1', '2', '3', '4', '5') NOT NULL COMMENT '1-Course, 2-Internship, 3-Project, 4-Digital Marketing, 5-Others',
    income_cat_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    received_by VARCHAR(50),
    received_on DATE,
    sender_name VARCHAR(50),
    sender_mobile VARCHAR(20),
    remarks TEXT,
    status ENUM('1', '2', '3', '4') DEFAULT '1' COMMENT '1-Success, 2-Failed, 3-Wrong Entry, 4-Inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    sno INT AUTO_INCREMENT PRIMARY KEY,
    expense_cat ENUM('1', '2', '3', '4', '5') NOT NULL COMMENT '1-Travel, 2-Food, 3-Stationery, 4-Banking, 5-Others',
    expense_cat_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    spent_by VARCHAR(50),
    spent_on DATE,
    spent_through VARCHAR(50),
    remarks VARCHAR(20),
    status ENUM('1', '2', '3', '4') DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salary table
CREATE TABLE salary (
    sno INT AUTO_INCREMENT PRIMARY KEY,
    payment_type ENUM('1', '2', '3') NOT NULL COMMENT '1-Shares, 2-Salary, 3-Others',
    payment_type_remarks VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    payment_to_whom VARCHAR(50),
    spent_date DATE,
    payment_through VARCHAR(50),
    remarks VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts Details table
CREATE TABLE accounts_details (
    sno INT AUTO_INCREMENT PRIMARY KEY,
    entry_type ENUM('1', '2', '3') NOT NULL COMMENT '1-Income, 2-Expense, 3-Salary',
    income_sno INT,
    expenses_sno INT,
    salary_sno INT,
    entry_by VARCHAR(50),
    ip_address VARCHAR(20),
    browser_name VARCHAR(20),
    browser_ver VARCHAR(20),
    operating_sys VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (income_sno) REFERENCES income(sno) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (expenses_sno) REFERENCES expenses(sno) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (salary_sno) REFERENCES salary(sno) ON DELETE SET NULL ON UPDATE CASCADE
);
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

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

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=accounts_management
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

## 📱 Usage

1. **Access the application**: Open `http://localhost:4200` in your browser
2. **Register/Login**: Create an account or login with existing credentials
3. **Dashboard**: View overview statistics and charts
4. **Manage Records**: Add, edit, delete income, expenses, and salary records
5. **Filter & Search**: Use advanced filtering and search capabilities
6. **View History**: Check transaction history and audit trail

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Income
- `GET /api/income` - Get all income records
- `POST /api/income` - Create income record
- `PUT /api/income/:id` - Update income record
- `DELETE /api/income/:id` - Delete income record
- `GET /api/income/stats/summary` - Get income statistics

### Expenses
- `GET /api/expenses` - Get all expense records
- `POST /api/expenses` - Create expense record
- `PUT /api/expenses/:id` - Update expense record
- `DELETE /api/expenses/:id` - Delete expense record
- `GET /api/expenses/stats/summary` - Get expense statistics

### Salary
- `GET /api/salary` - Get all salary records
- `POST /api/salary` - Create salary record
- `PUT /api/salary/:id` - Update salary record
- `DELETE /api/salary/:id` - Delete salary record
- `GET /api/salary/stats/summary` - Get salary statistics

### Accounts Details
- `GET /api/accounts-details` - Get transaction history
- `GET /api/accounts-details/summary/transactions` - Get transaction summary
- `GET /api/accounts-details/activity/user/:username` - Get user activity

## 🎨 UI Components

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Professional Styling**: Clean, modern UI with TailwindCSS
- **Interactive Charts**: Real-time data visualization
- **Form Validation**: Client and server-side validation
- **Loading States**: Smooth user experience with loading indicators

## 🔒 Security Features

- JWT token-based authentication
- Password encryption with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers

## 📊 Dashboard Features

- Total income, expenses, and salary overview
- Net balance calculation
- Category-wise breakdown charts
- Recent transactions
- Quick statistics
- Responsive charts with Chart.js

## 🚀 Deployment

### Backend Deployment
1. Set up a production MySQL database
2. Configure environment variables
3. Build and deploy to your preferred hosting service

### Frontend Deployment
1. Build the Angular application: `ng build --prod`
2. Deploy the `dist` folder to your web server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please create an issue in the repository. 