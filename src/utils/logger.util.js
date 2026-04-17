const winston = require('winston');

/**
 * Custom winston-based logger for the application.
 * Adjusts log levels dynamically based on environment.
 */
const logger = winston.createLogger({
  // In production, log INFO and more critical; in development, log DEBUG as well
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
