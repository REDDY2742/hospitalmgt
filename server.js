const http = require('http');
const app = require('./src/config/app');
const { connectWithRetry } = require('./src/config/database');
const { initializeSocket } = require('./src/config/socket');
const logger = require('./src/utils/logger.util');

/**
 * Handle Uncaught Exceptions
 * These are programmer errors that need immediate process restart.
 */
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

let server;

async function startServer() {
  const httpServer = http.createServer(app);

  try {
    // 1. Initialize Infrastructure & Database
    await connectWithRetry();

    // 2. Initialize Real-time System (Socket.io)
    initializeSocket(httpServer);

    // 3. Start Listening
    const PORT = process.env.PORT || 3000;
    server = httpServer.listen(PORT, () => {
      logger.info(`=================================================`);
      logger.info(`  HMS Production Server running on port ${PORT}`);
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`=================================================`);
    });

  } catch (err) {
    logger.error('CRITICAL: Failed to start the application:', err);
    process.exit(1);
  }
}

/**
 * Handle Unhandled Rejections
 * Gracefully close server and then exit.
 */
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    error: err.name,
    message: err.message,
    stack: err.stack
  });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

/**
 * Handle Process Signals for Graceful Shutdown
 */
const shutdown = (signal) => {
    logger.info(`Received ${signal}. Closing HMS services...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
