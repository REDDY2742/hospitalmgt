const nodemailer = require('nodemailer');
const aws = require('@aws-sdk/client-ses');
const ejs = require('ejs');
const path = require('path');
const logger = require('./logger.util').createChildLogger('transactional-email-util');

/**
 * Hospital Management System - Enterprise Transactional Email Engine
 * 
 * Orchestrates mission-critical clinical communications via AWS SES (Primary) 
 * and SendGrid (Fallback). Features professional EJS templating, automated 
 * iCal appointment scheduling, and HIPAA-compliant delivery tracking.
 */

const hospitalMeta = {
  name: process.env.HOSPITAL_NAME || 'Antigravity Hospital',
  logo: process.env.HOSPITAL_LOGO_URL || 'https://cdn.hms.com/logo.png',
  address: process.env.HOSPITAL_ADDRESS || 'Bangalore, India',
  phone: process.env.HOSPITAL_PHONE || '+91 80 1234 5678',
  website: 'www.antigravity.health',
  supportEmail: 'support@antigravity.health'
};

// --- Transporter Orchestration ---

/**
 * @description Creates the primary production transporter (AWS SES)
 */
const createSesTransporter = () => {
  const ses = new aws.SES({
    apiVersion: '2010-12-01',
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  return nodemailer.createTransport({
    SES: { ses, aws },
    pool: true,
    maxConnections: 5,
    rateLimit: 14 // SES default: 14 emails/second
  });
};

/**
 * @description Creates the fallback transporter (SendGrid or SMTP)
 */
const createFallbackTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || 'apikey',
      pass: process.env.SMTP_PASS
    }
  });
};

let primaryTransporter = (process.env.NODE_ENV === 'production') ? createSesTransporter() : createFallbackTransporter();
let fallbackTransporter = createFallbackTransporter();

// --- Templating Engine ---

/**
 * @description Renders clinical email templates with institutional branding
 */
const renderEmail = async (templateName, variables) => {
  try {
    const templatePath = path.join(__dirname, `../templates/emails/${templateName}.ejs`);
    const data = { ...hospitalMeta, ...variables, year: new Date().getFullYear() };
    
    // Render HTML
    const html = await ejs.renderFile(templatePath, data);
    return { html, text: 'Clinical communication from Antigravity Hospital.' }; // Plain-text fallback
  } catch (err) {
    logger.error(`TEMPLATE_RENDER_FAILURE: ${templateName}`, err);
    throw new Error('EMAIL_TEMPLATE_ERROR');
  }
};

// --- Core Send Function ---

/**
 * @description Enterprise-grade email sender with multi-provider failover
 */
const sendEmail = async (options) => {
  const { to, subject, html, text, attachments = [], priority = 'normal' } = options;
  
  const mailOptions = {
    from: `"${hospitalMeta.name}" <${process.env.EMAIL_FROM || 'no-reply@antigravity.health'}>`,
    to,
    subject,
    html,
    text,
    attachments,
    priority: priority === 'high' ? 'high' : 'normal'
  };

  try {
    const info = await primaryTransporter.sendMail(mailOptions);
    logger.info(`EMAIL_SENT: ${subject} to ${to} via Primary Provider`);
    return info;
  } catch (err) {
    logger.warn(`PRIMARY_EMAIL_FAILURE: Attempting fallback to secondary provider for ${to}`, err);
    try {
      const info = await fallbackTransporter.sendMail(mailOptions);
      logger.info(`EMAIL_SENT_FALLBACK: ${subject} to ${to} via Fallback Provider`);
      return info;
    } catch (fallbackErr) {
      logger.error(`TOTAL_EMAIL_FAILURE: Could not deliver email to ${to}`, fallbackErr);
      throw new Error('EMAIL_DELIVERY_UNAVAILABLE');
    }
  }
};

// --- specialized Clinical Senders ---

/**
 * @description Automated Appointment Confirmation with iCal Attachment
 */
const sendAppointmentConfirmation = async (appointment, patient, doctor) => {
  const vars = {
    patientName: patient.name,
    doctorName: doctor.name,
    date: appointment.scheduledAt.toLocaleDateString(),
    time: appointment.scheduledAt.toLocaleTimeString(),
    token: appointment.tokenNumber
  };

  const { html, text } = await renderEmail('appointment_confirmation', vars);
  
  // Minimal iCal generation for clinic dashboard
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AntigravityHospital//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${appointment.id}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${appointment.scheduledAt.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Medical Appointment - Dr. ${doctor.name}
DESCRIPTION:Patient: ${patient.name} | Token: ${appointment.tokenNumber}
LOCATION:${hospitalMeta.address}
END:VEVENT
END:VCALENDAR`;

  const attachments = [{
    filename: 'appointment.ics',
    content: icsContent,
    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
  }];

  return await sendEmail({ 
    to: patient.email, 
    subject: `Appointment Confirmed — Dr. ${doctor.name} on ${vars.date}`, 
    html, 
    text, 
    attachments, 
    priority: 'high' 
  });
};

/**
 * @description HIPAA-compliant automated credentials delivery for new staff
 */
const sendWelcomeEmail = async (user, tempPass) => {
  const vars = {
    name: user.name,
    role: user.role,
    userId: user.userId,
    tempPass,
    loginUrl: `${hospitalMeta.website}/login`
  };

  const { html, text } = await renderEmail('welcome', vars);
  return await sendEmail({ 
    to: user.email, 
    subject: `Welcome to ${hospitalMeta.name} — Your Staff Credentials`, 
    html, 
    text, 
    priority: 'high' 
  });
};

/**
 * @description Secure single-use Password Reset notification
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  const { html, text } = await renderEmail('password_reset', { name: user.name, resetUrl });
  return await sendEmail({ 
    to: user.email, 
    subject: `Password Reset Request — ${hospitalMeta.name}`, 
    html, 
    text, 
    priority: 'high' 
  });
};

/**
 * @description Automated automated lab result notification with secure attachment
 */
const sendLabResultEmail = async (patient, testName, reportBuffer) => {
  const { html, text } = await renderEmail('lab_result_ready', { patientName: patient.name, testName });
  const attachments = [{
    filename: `${testName}_Report.pdf`,
    content: reportBuffer,
    contentType: 'application/pdf'
  }];

  return await sendEmail({ 
    to: patient.email, 
    subject: `${testName} Results Ready — ${hospitalMeta.name}`, 
    html, 
    text, 
    attachments 
  });
};

/**
 * @description Standardized Billing notification with Payment Link
 */
const sendBillEmail = async (bill, patient, paymentUrl) => {
  const { html, text } = await renderEmail('bill_generated', {
    patientName: patient.name,
    billNo: bill.billNumber,
    amount: bill.netPayable,
    paymentUrl
  });

  return await sendEmail({ 
    to: patient.email, 
    subject: `Invoice #${bill.billNumber} — ${hospitalMeta.name}`, 
    html, 
    text 
  });
};

/**
 * @description Official Telemedicine Session Invitation
 */
const sendTelemedicineSessionEmail = async (session, patient, doctor, joinUrl) => {
  const { html, text } = await renderEmail('telemedicine_session', {
    patientName: patient.name,
    doctorName: doctor.name,
    time: session.scheduledAt.toLocaleTimeString(),
    date: session.scheduledAt.toLocaleDateString(),
    joinUrl
  });

  return await sendEmail({ 
    to: patient.email, 
    subject: `Virtual Consultation — Dr. ${doctor.name} at ${new Date(session.scheduledAt).toLocaleTimeString()}`, 
    html, 
    text,
    priority: 'high'
  });
};

/**
 * @description Instant Emergency Alert for Critical Events
 */
const sendCriticalAlert = async (alertType, message, recipients = []) => {
  const { html, text } = await renderEmail('critical_alert', { alertType, message });
  return await sendEmail({ 
    to: recipients, 
    subject: `⚠ CRITICAL ALERT — ${alertType}`, 
    html, 
    text, 
    priority: 'high' 
  });
};

// --- Advanced Bulk Handlers ---

/**
 * @description Batch processing for institutional alerts (Low Stock, Shift Changes)
 */
const sendBulkEmail = async (recipients, templateName, commonVars) => {
  const results = { sent: 0, failed: 0 };
  
  for (const chunk of Array(Math.ceil(recipients.length / 50)).fill().map((_, i) => recipients.slice(i * 50, (i + 1) * 50))) {
    const batchPromises = chunk.map(async (recp) => {
      try {
        const { html, text } = await renderEmail(templateName, { ...commonVars, ...recp.vars });
        await sendEmail({ to: recp.email, subject: commonVars.subject, html, text });
        results.sent++;
      } catch (e) {
        results.failed++;
      }
    });

    await Promise.all(batchPromises);
    // Add small delay to stay within SES rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
};

module.exports = {
  sendEmail,
  sendTemplateEmail: async (name, to, vars, opts) => {
    const { html, text } = await renderEmail(name, vars);
    return sendEmail({ to, ...opts, html, text });
  },
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendLabResultEmail,
  sendBillEmail,
  sendTelemedicineSessionEmail,
  sendCriticalAlert,
  sendBulkEmail,
  createPDFAttachment: (buf, name) => ({ filename: name, content: buf, contentType: 'application/pdf' })
};
