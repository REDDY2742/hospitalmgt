/**
 * Database Configuration Module
 * 
 * Provides a production-grade Sequelize instance for MySQL with connection pooling,
 * environment-based logging, SSL support, and graceful shutdown handling.
 */

// Load environment variables early
require('dotenv').config();

const { Sequelize } = require('sequelize');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger.util');

/**
 * Environment Variable Validation Schema
 * Ensures all required database credentials and configurations are present before startup.
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  DB_HOST: Joi.string().required().description('MySQL Database Hostname'),
  DB_PORT: Joi.number().default(3306).description('MySQL Port (Default 3306)'),
  DB_NAME: Joi.string().required().description('Database Name'),
  DB_USER: Joi.string().required().description('Database User'),
  DB_PASSWORD: Joi.string().allow('').required().description('Database Password'),
  SSL_CERT_PATH: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }).description('Path to SSL Certificate (Required in Production)')
}).unknown();

// Validate process.env against the schema
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  logger.error(`❌ Configuration validation error: ${error.message}`);
  // Exit process if configuration is invalid to prevent unpredictable behavior
  process.exit(1);
}

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  NODE_ENV,
  SSL_CERT_PATH
} = envVars;

/**
 * Global dialect options for the MySQL connection.
 */
const dialectOptions = {
  // Disabling multiple statements to mitigate risk of certain SQL injection vectors
  multipleStatements: false, 
  // Standardizing on utf8mb4 for full emoji and international character support
  charset: 'utf8mb4',
  // Use the database's local time (or set to UTC '+00:00' for global consistency)
  timezone: 'local' 
};

/**
 * SSL Configuration for Production
 * Production environments should always use encrypted connections.
 */
if (NODE_ENV === 'production') {
  try {
    // Ensure the certificate file exists before attempting to read
    const certPath = path.resolve(SSL_CERT_PATH);
    if (fs.existsSync(certPath)) {
      dialectOptions.ssl = {
        ca: fs.readFileSync(certPath)
      };
      logger.info('🔒 SSL Certificate loaded for production DB connection.');
    } else {
      throw new Error(`SSL certificate not found at path: ${certPath}`);
    }
  } catch (err) {
    logger.error(`❌ SSL Certificate Error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Initialize Sequelize Instance
 * Configures connection pooling and logging behavior based on environment.
 */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  // Connection Pooling helps manage multiple simultaneous database requests efficiently
  pool: {
    max: 10,         // Maximum number of connections in pool
    min: 2,          // Minimum number of connections in pool
    acquire: 30000,  // The maximum time (ms) that pool will try to get connection before throwing error
    idle: 10000      // The maximum time (ms) that a connection can be idle before being released
  },
  // Custom query logging: enabled only in development to keep logs clean in prod
  logging: NODE_ENV === 'development' 
    ? (sql) => logger.debug(`Executing SQL: ${sql}`) 
    : false,
  dialectOptions,
  // Ensure the database uses the same collation as our charset
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  }
});

/**
 * Ping the database to verify connectivity.
 * Useful for health checks or startup validation.
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connection established and authenticated successfully.');
    return true;
  } catch (err) {
    logger.error('❌ Database authentication failed:', {
      message: err.message,
      host: DB_HOST,
      database: DB_NAME
    });
    throw err;
  }
};

/**
 * Retry Logic with Exponential Backoff
 * Attempts to connect to the database multiple times before failing.
 * 
 * @param {number} maxRetries - Maximum number of attempts
 */
const connectWithRetry = async (maxRetries = 5) => {
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      await testConnection();
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error(`🛑 Could not connect to database after ${maxRetries} attempts. Exiting...`);
        process.exit(1);
      }

      // Exponential backoff: 2s, 4s, 8s, 16s...
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`⚠️ Connection attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
};

/**
 * Graceful Shutdown Handler
 * Closes the Sequelize connection pool cleanly when the process is terminated.
 */
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Closing database connection pool...`);
  try {
    await sequelize.close();
    logger.info('✅ Database pool closed gracefully.');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = {
  sequelize,
  testConnection,
  connectWithRetry,
  Sequelize 
};
