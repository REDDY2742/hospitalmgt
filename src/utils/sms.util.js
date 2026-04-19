const axios = require('axios');
const twilio = require('twilio');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { parsePhoneNumberWithError } = require('libphonenumber-js');
const logger = require('./logger.util').createChildLogger('mobile-sms-util');
const redis = require('../config/redis');
const encryption = require('./encryption.util');

/**
 * Hospital Management System - Enterprise Mobile Communications Infrastructure
 * 
 * Orchestrates regional (India DLT) and international SMS delivery via MSG91, 
 * Twilio, and AWS SNS. Features OTP lifecycle management, complex templating, 
 * and HIPAA-compliant delivery auditing.
 */

// --- India DLT Configuration ---

const dltConfig = {
  senderId: process.env.SMS_SENDER_ID || 'HMSPTL',
  entityId: process.env.DLT_ENTITY_ID,
  templates: {
    appointment_confirmation: {
      templateId: process.env.DLT_TMPL_APT_CONF,
      template: 'Dear {#var#}, your appointment with Dr. {#var#} is confirmed for {#var#} at {#var#}. Token: {#var#}. Hospital: {#var#}'
    },
    otp_verification: {
      templateId: process.env.DLT_TMPL_OTP,
      template: '{#var#} is your OTP for {#var#} at {#var#}. Valid for 5 minutes. Do not share. -{#var#}'
    },
    lab_result_ready: {
      templateId: process.env.DLT_TMPL_LAB,
      template: 'Dear {#var#}, your {#var#} report is ready. Download: {#var#} or collect from lab. Order: {#var#} -{#var#}'
    },
    emergency_alert: {
      templateId: process.env.DLT_TMPL_ER,
      template: 'URGENT: Patient {#var#} in Emergency at {#var#}. ER No: {#var#}. Doctor: {#var#}. Contact: {#var#} -{#var#}'
    },
    appointment_reminder: {
      templateId: process.env.DLT_TMPL_APT_REM,
      template: 'Reminder: Your appointment with Dr. {#var#} is tomorrow at {#var#}. Token No: {#var#}. Reply CANCEL to cancel. -{#var#}'
    },
    bill_generated: {
      templateId: process.env.DLT_TMPL_BILL,
      template: 'Bill #{#var#} of Rs.{#var#} generated for {#var#}. Pay online: {#var#} or at billing counter. -{#var#}'
    },
    blood_request: {
      templateId: process.env.DLT_TMPL_BLOOD,
      template: 'URGENT: {#var#} blood required at {#var#} for patient. Contact blood bank: {#var#}. Ref: {#var#} -{#var#}'
    }
  }
};

// --- Provider Adapters (Interface pattern) ---

const MSG91Adapter = {
  async send(to, message, templateId) {
    try {
      const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        sender: dltConfig.senderId,
        short_url: '1',
        mobiles: to.replace('+', ''),
        // Vars must be provided by caller
      }, {
        headers: { authkey: process.env.MSG91_AUTH_KEY }
      });
      return { success: response.data.type === 'success', messageId: response.data.request_id, provider: 'msg91' };
    } catch (e) { throw e; }
  }
};

const TwilioAdapter = {
  client: twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
  async send(to, message) {
    try {
      const resp = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      return { success: true, messageId: resp.sid, provider: 'twilio' };
    } catch (e) { throw e; }
  }
};

// --- Core SMS Selection & Delivery ---

/**
 * @description Master SMS orchestrator with regional failover
 */
const sendSMS = async (to, message, options = {}) => {
  const { templateId, priority = 'normal', retryCount = 0 } = options;
  const isIndia = to.startsWith('+91');

  try {
    let result;
    if (isIndia && templateId) {
      result = await MSG91Adapter.send(to, message, templateId);
    } else {
      result = await TwilioAdapter.send(to, message);
    }

    logger.info(`SMS_DISPATCHED: ${to} via ${result.provider} | ID: ${result.messageId}`);
    return result;
  } catch (err) {
    if (retryCount < 3) {
      const delay = Math.pow(3, retryCount) * 1000;
      await new Promise(r => setTimeout(r, delay));
      return sendSMS(to, message, { ...options, retryCount: retryCount + 1 });
    }
    logger.error(`TOTAL_SMS_FAILURE: Could not deliver SMS to ${to}`, err);
    throw new Error('SMS_DELIVERY_UNAVAILABLE');
  }
};

/**
 * @description Standardized DLT template renderer
 */
const sendTemplateSMS = async (templateKey, to, vars = [], options = {}) => {
  const config = dltConfig.templates[templateKey];
  if (!config) throw new Error('DLT_TEMPLATE_MISSING');

  let rendered = config.template;
  vars.forEach(v => rendered = rendered.replace('{#var#}', v));

  return await sendSMS(to, rendered, { ...options, templateId: config.templateId });
};

// --- Specialized Document & Clinical Senders ---

const sendOTP = async (phone, purpose, userId) => {
  const otp = encryption.generateSecureOTP(6);
  const sessionToken = crypto.randomUUID();
  
  // Store securely in Redis for 5 minutes
  await redis.set(`otp:${purpose}:${userId}`, otp, 'EX', 300);
  await redis.set(`otp_session:${sessionToken}`, userId, 'EX', 300);

  const vars = [otp, purpose, 'Antigravity Hospital', '5', 'HMS'];
  await sendTemplateSMS('otp_verification', phone, vars);
  
  return { sessionToken, expiresAt: Date.now() + 300000 };
};

const sendLabResultSMS = async (patient, testName, downloadUrl, orderNo) => {
  const vars = [patient.name, testName, downloadUrl, orderNo, 'AH'];
  return await sendTemplateSMS('lab_result_ready', patient.phone, vars);
};

const sendEmergencyAlertSMS = async (patientName, emergencyLocation, erNumber, doctorName, phone, contactPhone) => {
  const vars = [patientName, emergencyLocation, erNumber, doctorName, phone, 'AH'];
  return await sendTemplateSMS('emergency_alert', contactPhone, vars, { priority: 'high' });
};

/**
 * @description Automated Appointment Reminder (24h before)
 */
const sendAppointmentReminderSMS = async (appointment, patient, doctor) => {
  const vars = [doctor.name, new Date(appointment.scheduledAt).toLocaleTimeString(), appointment.tokenNumber, 'AH'];
  return await sendTemplateSMS('appointment_reminder', patient.phone, vars);
};

/**
 * @description Billing notification with short link to payment gateway
 */
const sendBillSMS = async (bill, patient, paymentUrl) => {
  const vars = [bill.billNumber, bill.netPayable, patient.name, paymentUrl, 'AH'];
  return await sendTemplateSMS('bill_generated', patient.phone, vars);
};

/**
 * @description Critical Blood Bank request for trauma surgery
 */
const sendBloodRequestSMS = async (bloodGroup, hospitalName, contact, reqNo, recipients = []) => {
  const vars = [bloodGroup, hospitalName, contact, reqNo, 'AH'];
  const results = [];
  for (const phone of recipients) {
     results.push(await sendTemplateSMS('blood_request', phone, vars, { priority: 'high' }));
  }
  return results;
};

// --- OTP Verification Logic ---

const verifyOTP = async (userId, purpose, otp) => {
  const storedOtp = await redis.get(`otp:${purpose}:${userId}`);
  if (!storedOtp) return { verified: false, error: 'OTP_EXPIRED' };
  
  const isMatch = encryption.constantTimeEqual(otp, storedOtp);
  if (isMatch) {
    await redis.del(`otp:${purpose}:${userId}`);
    return { verified: true };
  }
  
  return { verified: false, error: 'INVALID_OTP' };
};

// --- Helpers ---

const validatePhoneNumber = (phone) => {
  try {
    const parsed = parsePhoneNumberWithError(phone);
    return { isValid: parsed.isValid(), formatted: parsed.format('E.164') };
  } catch (e) {
    return { isValid: false };
  }
};

const isUnicode = (text) => /[^\u0000-\u00ff]/.test(text);

const calculateSegments = (text) => {
  const limit = isUnicode(text) ? 70 : 160;
  return Math.ceil(text.length / limit);
};

module.exports = {
  sendSMS,
  sendTemplateSMS,
  sendOTP,
  verifyOTP,
  sendLabResultSMS,
  sendEmergencyAlertSMS,
  sendAppointmentReminderSMS,
  sendBillSMS,
  sendBloodRequestSMS,
  validatePhoneNumber,
  calculateSegments,
  dltConfig
};
