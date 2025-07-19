const path = require("path");
const { Sequelize } = require("sequelize");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Determine if running in production
const isProduction = process.env.NODE_ENV === "production";

// SSL config for Render PostgreSQL
const sslConfig = {
  require: isProduction,
  rejectUnauthorized: false, // Accept Render's self-signed cert
};

// Function to create Sequelize instance
const createSequelizeInstance = () => {
  if (process.env.DATABASE_URL) {
    // Use DATABASE_URL if available (recommended for Render)
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: !isProduction,
      dialectOptions: {
        ssl: sslConfig,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  // Fallback: use individual DB env variables for local dev or other setups
  return new Sequelize(
    process.env.DB_NAME || "accounts_management",
    process.env.DB_USER || "postgres",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: !isProduction,
      dialectOptions: sslConfig.require ? { ssl: sslConfig } : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
};

const sequelize = createSequelizeInstance();

module.exports = sequelize;
