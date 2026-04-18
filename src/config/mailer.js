const nodemailer = require('nodemailer');
const { SES, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const logger = require('../utils/logger.util');

/**
 * Mailer Configuration Module
 * 
 * Initializes the Nodemailer transport using AWS SES SDK v3.
 */

const sesClient = new SES({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Nodemailer Transport using SES SDK v3
 */
const transporter = nodemailer.createTransport({
  SES: { ses: sesClient, aws: { SendRawEmailCommand } }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Mailer [SES]: Connection Failed | ${error.message}`);
  } else {
    logger.info('Mailer [SES]: Connection Verified Successfully');
  }
});

module.exports = {
  transporter,
  FROM_EMAIL: process.env.MAIL_FROM || 'no-reply@hospital.com'
};
