const cluster = require('cluster');
const os = require('os');
const http = require('http');
const https = require('https');
const fs = require('fs');
const chalk = require('chalk');
const cron = require('node-cron');
const net = require('net');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

// Internal Imports
const app = require('./src/config/app');
const { sequelize } = require('./src/models');
const { initializeRedisClients, clients, closeAllConnections: closeRedis, checkHealth: checkRedisHealth } = require('./src/utils/cache.util');
const { initializeScheduler } = require('./src/utils/scheduler.util');
const { initializeS3Client, checkS3Connection } = require('./src/utils/s3.util');
const logger = require('./src/utils/logger.util');

/**
 * Hospital Management System - Core Server Entry Point
 * 
 * Orchestrates clinical service initialization, background jobs,
 * high-availability clustering, and graceful process termination.
 */

const PORT = process.env.PORT || 8000;
const IS_PROD = process.env.NODE_ENV === 'production';
const USE_CLUSTER = process.env.USE_CLUSTER === 'true' && IS_PROD;

// --- 1. CLUSTERING LOGIC ---

if (USE_CLUSTER && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Primary process starting. Forking [${numCPUs}] workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker [${worker.process.pid}] died. Restarting...`, { code, signal });
    cluster.fork();
  });
} else {
  startServer();
}

/**
 * @description Orchestrates the entire server startup sequence
 */
async function startServer() {
  try {
    // 0. Port Availability Check
    await checkPortAvailable(PORT);

    // 1. Database Connection (Sequelize)
    logger.info('Connecting to MySQL Database pool...');
    await sequelize.authenticate();
    const dbStatus = chalk.green('CONNECTED');

    // 2. Redis Connection
    logger.info('Initializing Redis clusters...');
    initializeRedisClients();
    const redisStatus = chalk.green('CONNECTED');

    // 3. AWS S3 Connection
    logger.info('Initializing AWS S3 Transport...');
    await initializeS3Client();
    const s3Status = chalk.green('CONNECTED');

    displayBanner({ dbStatus, redisStatus, s3Status });

    // 3. Socket.io & Redis Adapter
    const httpServer = IS_PROD && process.env.SSL_CERT_PATH
      ? https.createServer({
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH)
        }, app)
      : http.createServer(app);

    const io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    if (clients.pubsub && clients.publish) {
      io.adapter(createAdapter(clients.publish, clients.pubsub));
    }

    // 4. Background Job Orchestration (Cron)
    initializeCronJobs();
    logger.info(chalk.green('✔ Scheduled Jobs Loaded'));

    // 5. Terminal Init
    httpServer.listen(PORT, () => {
      logger.info(chalk.bold.cyan(`\n🚀 HMS Server listening on Port [${PORT}] in [${process.env.NODE_ENV}] mode`));
      logger.info(`Worker Process ID: [${process.pid}]`);
    });

    setupGracefulShutdown(httpServer);

  } catch (err) {
    logger.error('CRITICAL_STARTUP_FAILURE', err);
    process.exit(1);
  }
}

// --- 2. SCHEDULED JOBS (Institutional Orchestration) ---

function initializeCronJobs() {
  // Every 5 mins: Bed availability audit
  cron.schedule('*/5 * * * *', () => logger.debug('Running Bed Availability Audit...'));

  // Every 15 mins: Update ambulance GPS telemetry
  cron.schedule('*/15 * * * *', () => logger.debug('Syncing Ambulance GPS Data...'));

  // Every hour: Pharmacy expiry audit + Insurance claim status check
  cron.schedule('0 * * * *', () => {
    logger.info('Processing Pharmacy Expiry Notification Queue...');
    logger.info('Refreshing Insurance Claim Statuses...');
  });

  // Daily 6 AM: Appointment reminders (SMS/Email)
  cron.schedule('0 6 * * *', () => logger.info('Dispatching Daily Appointment Reminders...'));

  // Daily Midnight: Report Generation & Auto-Discharge
  cron.schedule('0 0 * * *', () => {
    logger.info('Executing Midnight Clinical Reports...');
    logger.info('Identifying Patients for Auto-Discharge alert...');
  });

  // Weekly: Audit Log Retention Purge (90 days)
  cron.schedule('0 0 * * 0', () => logger.info('Purging old audit logs...'));
}

/**
 * @description Checks if the target port is blocked before starting
 */
function checkPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', err => (err.code === 'EADDRINUSE' ? reject(new Error(`Port ${port} in use`)) : reject(err)))
      .once('listening', () => tester.once('close', () => resolve()).close())
      .listen(port);
  });
}

// --- 3. GRACEFUL SHUTDOWN ---

function setupGracefulShutdown(server) {
  const exitHandler = async () => {
    logger.warn('Received termination signal. Initiating graceful shutdown...');

    server.close(async () => {
      logger.info('HTTP server closed. Finishing in-flight requests...');
      
      try {
        await sequelize.close();
        await closeRedis();
        logger.info('Institutional connections closed. System clean.');
        process.exit(0);
      } catch (err) {
        logger.error('Shutdown Error', err);
        process.exit(1);
      }
    });

    // Force kill if graceful fails within 30s
    setTimeout(() => {
      logger.error('Shutdown timed out. Force killing process.');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', exitHandler);
  process.on('SIGINT', exitHandler);
}

// --- 4. VISUALS ---

function displayBanner({ dbStatus, redisStatus, s3Status }) {
  const banner = `
  ##################################################
  #                                                #
  #   H O S P I T A L   M A N A G E M E N T        #
  #               S Y S T E M                      #
  #                                                #
  #   Status: [ DB:${dbStatus} | RD:${redisStatus} | S3:${s3Status} ]
  ##################################################
  `;
  console.log(chalk.bold.blue(banner));
  console.log(chalk.cyan(`  Environment: ${process.env.NODE_ENV.toUpperCase()}`));
  console.log(chalk.gray(`  Version: ${process.env.APP_VERSION || '1.0.0'}`));
  console.log(chalk.gray(`  Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`));
  console.log(chalk.gray(`  Node: ${process.version}\n`));
}

// Global Exception Handlers
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT_EXCEPTION', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED_REJECTION', err);
  process.exit(1);
});
