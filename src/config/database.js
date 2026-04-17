const { Sequelize } = require('sequelize');
const Joi = require('joi');
const fs = require('fs');
const logger = require('../utils/logger.util');

// Define validation schema for environment variables using joi
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow(''), // Allowing empty password exclusively for local/dev use
  SSL_CERT_PATH: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).unknown().required();

// Validate the incoming process.env keys before trying to boot DB
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  // Gracefully crash if DB configuration is missing or malformed
  logger.error(`Database Config Validation Error: ${error.message}`);
  process.exit(1); 
}

// Destructure the perfectly typed and validated environment variables
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, NODE_ENV, SSL_CERT_PATH } = envVars;

// Prepare robust database dialing configurations
const dialectOptions = {
  multipleStatements: false, // Prevents SQL Injection (does not allow stacking semi-colon separated statements)
  charset: 'utf8mb4',        // Ensures emojis and full unicode character sets are supported
  timezone: 'local'          // Utilizes the target system's local time (or can be set to +00:00 for UTC focus)
};

// Utilize secure SSL connections rigidly if in production
if (NODE_ENV === 'production' && SSL_CERT_PATH) {
  try {
    dialectOptions.ssl = {
      ca: fs.readFileSync(SSL_CERT_PATH) // Load security cert securely on start
    };
  } catch (err) {
    logger.error(`Failed to load SSL cert at ${SSL_CERT_PATH}: ${err.message}`);
    process.exit(1);
  }
}

// Intantiate Sequelize targeting MySQL
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  
  // Enable query logging explicitly tailored for development workflows using the winston logger
  logging: NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  
  // Connection Pool bounds configuration
  pool: {
    max: 10,         // Ceiling for simultaneous open connections 
    min: 2,          // Minimum maintained threads to reduce latency footprint on burst
    acquire: 30000,  // Drop acquiring logic forcefully after 30 sec stall 
    idle: 10000      // Recycle connections silently unread past 10 seconds timeout
  },
  
  dialectOptions
});

/**
 * Pings the database independently to test connection state.
 * @returns {Promise<void>} 
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
  } catch (error) {
    logger.error(`❌ Unable to connect to the database: ${error.message}`);
    throw error;
  }
};

/**
 * Iteratively attempts to connect DB on crash/fail utilizing Exponential Backoff algorithms
 */
const connectWithRetry = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
       // Pinging standard configuration target
      await testConnection();
      return; 
    } catch (err) {
      retries++;
      if (retries >= MAX_RETRIES) {
        logger.error(`❌ Database connection failed after ${MAX_RETRIES} successive retries. Shutting process.`);
        process.exit(1);
      }
      
      // Calculate delay formula base (e.g. 2s => 4s => 8s => 16s ..)
      const backoffDelay = Math.pow(2, retries) * 1000; 
      logger.warn(`Retrying DB connection in ${backoffDelay / 1000}s... (Attempt ${retries} of ${MAX_RETRIES})`);
      
      // Resolve idle block logic for wait 
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
};

// Handle process termination loops dynamically directly gracefully killing pool tasks cleanly to prevent DB locks
const closeDatabaseConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed gracefully.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during database graceful shutdown: ${err.message}`);
    process.exit(1);
  }
};

// Bind termination events targeting runtime shutdowns via Unix SIGINT/SIGTERM controls
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);

module.exports = {
  sequelize,
  testConnection,
  connectWithRetry
};
