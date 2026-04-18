const nodemailer = require('nodemailer');
const aws = require('@aws-sdk/client-ses');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { emailQueue } = require('../utils/scheduler.util'); // Assumes scheduler handles the Bull instance
const logger = require('./logger.util').createChildLogger('EMAIL_SVC');

/**
 * Hospital Transactional Email Utility
 * 
 * Orchestrates AWS SES-backed communication with Handlebars template 
 * rendering and Bull-based asynchronous queueing.
 */

const ses = new aws.SES({ region: process.env.AWS_REGION });
const transporter = nodemailer.createTransport({ SES: { ses, aws } });

const TEMPLATE_DIR = path.join(__dirname, '../templates/email');
const templateCache = new Map();

/**
 * @description Compiles .hbs template with memory-caching
 */
const compileTemplate = (templateName, data) => {
  let template = templateCache.get(templateName);
  
  if (!template || process.env.NODE_ENV === 'development') {
    const filePath = path.join(TEMPLATE_DIR, `${templateName}.hbs`);
    const content = fs.readFileSync(filePath, 'utf8');
    template = handlebars.compile(content);
    templateCache.set(templateName, template);
  }
  
  return template(data);
};

/**
 * @description Queues email for background transmission via Bull
 */
const sendEmail = async (to, subject, htmlContent, options = {}) => {
  try {
    const job = await emailQueue.add({
      to,
      subject,
      html: htmlContent,
      ...options
    }, {
      priority: options.priority || 5, // Lower is higher priority for Bull? No, standard 1-20
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });

    logger.info(`EMAIL_QUEUED | Job: ${job.id} | To: ${to} | Subject: ${subject}`);
    return { messageId: job.id, queued: true };
  } catch (error) {
    logger.error(`QUEUE_FAILURE | Error: ${error.message}`);
    throw error;
  }
};

/**
 * @description Sends synchronous email for mission-critical OTPs/Critical alerts
 */
const sendImmediateEmail = async (to, subject, htmlContent, options = {}) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hospital.com',
    to,
    subject,
    html: htmlContent,
    ...options
  };

  try {
    const startTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    logger.info(`EMAIL_SENT_DIRECT | To: ${to} | Duration: ${Date.now() - startTime}ms`);
    return { messageId: info.messageId, sent: true };
  } catch (error) {
    logger.error(`DIRECT_SEND_FAILURE | To: ${to} | Error: ${error.message}`);
    throw error;
  }
};

/**
 * --- Hospital Domain-Specific Email Handlers ---
 */

const sendOTPEmail = async (user, otp) => {
  const html = compileTemplate('otp_delivery', { name: user.name, otp });
  return await sendImmediateEmail(user.email, 'Security Verification Code', html);
};

const sendAppointmentConfirmation = async (patient, appointment, doctor) => {
  const html = compileTemplate('appointment_confirmed', { 
    patientName: patient.name, 
    date: appointment.date, 
    doctorName: doctor.name 
  });
  return await sendEmail(patient.email, 'Appointment Confirmed', html);
};

module.exports = {
  compileTemplate,
  sendEmail,
  sendImmediateEmail,
  sendOTPEmail,
  sendAppointmentConfirmation,
  sendPasswordReset: async (user, url) => {
    const html = compileTemplate('password_reset', { name: user.name, url });
    return await sendImmediateEmail(user.email, 'Reset Your Password', html);
  },
  sendLabResultReady: async (patient, order, url) => {
    const html = compileTemplate('lab_result_ready', { name: patient.name, orderId: order.id, url });
    return await sendEmail(patient.email, 'Clinical Lab Result Available', html);
  }
};
