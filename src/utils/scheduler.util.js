const Queue = require('bull');
const cron = require('node-cron');
const logger = require('./logger.util').createChildLogger('SCHEDULER');

/**
 * Hospital Job Scheduling & Background Orchestration Utility
 * 
 * Manages Bull-based persistent queues for asynchronous tasks and 
 * node-cron for recurring clinical/administrative maintenance.
 */

// --- 1. Queue Initialization ---

const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
};

const emailQueue = new Queue('email-notifications', redisConfig);
const smsQueue = new Queue('sms-notifications', redisConfig);
const reportExportQueue = new Queue('report-exports', redisConfig);
const pdfGenerationQueue = new Queue('pdf-generation', redisConfig);

// --- 2. Recurring Scheduled Jobs (Cron) ---

const scheduledJobs = {
  /** @cron 0 8 * * * (Daily 8 AM) */
  pharmacyExpiryCheck: () => {
    cron.schedule('0 8 * * *', async () => {
      logger.info('CRON_START: Pharmacy Expiry Check');
      // Logic: await pharmacyService.notifyExpiringItems(90);
    });
  },

  /** @cron 0 * * * * (Hourly) */
  appointmentReminders: () => {
    cron.schedule('0 * * * *', async () => {
      logger.info('CRON_START: 24hr/1hr Appointment Reminders');
      // Logic: await appointmentService.sendReminders();
    });
  },

  /** @cron 0 2 1 * * (1st of month at 2 AM) */
  auditLogArchive: () => {
    cron.schedule('0 2 1 * *', async () => {
      logger.info('CRON_START: Audit Log S3 Archival');
      // Logic: await auditService.archiveOldLogs();
    });
  }
};

/**
 * @description Orchestrates the startup of all clinical queues and cron schedules
 */
const initScheduler = () => {
  logger.info('Initializing Clinical Scheduler...');

  // Start Cron Jobs
  Object.values(scheduledJobs).forEach(jobStartFn => jobStartFn());

  // Log Queue Stats
  emailQueue.on('active', (job) => logger.info(`EMAIL_JOB_ACTIVE: ${job.id}`));
  smsQueue.on('failed', (job, err) => logger.error(`SMS_JOB_FAILED: ${job.id} | ${err.message}`));

  return { emailQueue, smsQueue, reportExportQueue, pdfGenerationQueue };
};

module.exports = {
  initScheduler,
  emailQueue,
  smsQueue,
  reportExportQueue,
  pdfGenerationQueue,
  scheduledJobs
};
