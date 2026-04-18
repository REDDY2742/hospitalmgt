const billingService = require('./billing.service');
const Response = require('../../utils/response.util');
const { getPagination } = require('../../utils/pagination.util');
const { ForbiddenError } = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Billing & Financial Operations Controller
 */

const logEntry = (req, method) => {
  logger.debug(`[BillingController] Entering ${method} | ReqID: ${req.requestId || 'N/A'}`);
};

/**
 * Bill Management
 */

/** @description Create a new consolidated bill draft */
const generateBill = async (req, res, next) => {
  logEntry(req, 'generateBill');
  try {
    const data = await billingService.generateBill(req.body.patientId, req.body.admissionId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Bill draft generated', 201);
  } catch (error) {
    next(error);
  }
};

/** @description Retrieve detailed bill information */
const getBillById = async (req, res, next) => {
  logEntry(req, 'getBillById');
  try {
    const data = await billingService.getBillById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Update bill draft before finalization */
const updateBillDraft = async (req, res, next) => {
  logEntry(req, 'updateBillDraft');
  try {
    const data = await billingService.updateBillDraft(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Bill draft updated');
  } catch (error) {
    next(error);
  }
};

/** @description Finalize bill and lock from further edits */
const finalizeBill = async (req, res, next) => {
  logEntry(req, 'finalizeBill');
  try {
    const data = await billingService.finalizeBill(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Bill finalized and invoice generated');
  } catch (error) {
    next(error);
  }
};

/** @description Cancel a bill record with administrative reason */
const cancelBill = async (req, res, next) => {
  logEntry(req, 'cancelBill');
  try {
    await billingService.cancelBill(req.params.id, req.body.reason, req.user.id);
    Response.sendSuccess(res, null, 'Bill cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/** @description List all bills with pagination and status filters */
const listBills = async (req, res, next) => {
  logEntry(req, 'listBills');
  try {
    const pagination = getPagination(req.query);
    const data = await billingService.listBills(req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Get all bills for a specific patient */
const getBillsByPatient = async (req, res, next) => {
  logEntry(req, 'getBillsByPatient');
  try {
    const data = await billingService.getBillsByPatient(req.params.patientId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Stream bill invoice PDF from secure storage */
const getBillPDF = async (req, res, next) => {
  logEntry(req, 'getBillPDF');
  try {
    const stream = await billingService.getBillPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${req.params.id}.pdf`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/** @description Add a new line item to a draft bill */
const addBillLineItem = async (req, res, next) => {
  logEntry(req, 'addBillLineItem');
  try {
    const data = await billingService.addBillLineItem(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Line item added to bill');
  } catch (error) {
    next(error);
  }
};

/** @description Remove a line item from a draft bill */
const removeBillLineItem = async (req, res, next) => {
  logEntry(req, 'removeBillLineItem');
  try {
    const data = await billingService.removeBillLineItem(req.params.id, req.params.itemId);
    Response.sendSuccess(res, data, 'Line item removed');
  } catch (error) {
    next(error);
  }
};

/**
 * Payment Operations
 */

/** @description Process payment against a finalized bill */
const processPayment = async (req, res, next) => {
  logEntry(req, 'processPayment');
  try {
    const data = await billingService.processPayment(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Payment processed successfully');
  } catch (error) {
    next(error);
  }
};

/** @description Get payment transaction details */
const getPaymentById = async (req, res, next) => {
  logEntry(req, 'getPaymentById');
  try {
    const data = await billingService.getPaymentById(req.params.paymentId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description List all payments made against a specific bill */
const getPaymentsByBill = async (req, res, next) => {
  logEntry(req, 'getPaymentsByBill');
  try {
    const data = await billingService.getPaymentsByBill(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Process a refund for a successful payment */
const processRefund = async (req, res, next) => {
  logEntry(req, 'processRefund');
  try {
    // Controller-level role check for refund thresholds
    if (req.body.amount > 1000000 && req.user.role !== 'ADMIN') { // 10k threshold in paise
      throw new ForbiddenError('Large refunds require administrative approval');
    }
    const data = await billingService.processRefund(req.params.paymentId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Refund initiated successfully');
  } catch (error) {
    next(error);
  }
};

/** @description Get status of a refund transaction */
const getRefundStatus = async (req, res, next) => {
  logEntry(req, 'getRefundStatus');
  try {
    const data = await billingService.getRefundStatus(req.params.refundId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Stream payment receipt PDF from secure storage */
const getReceiptPDF = async (req, res, next) => {
  logEntry(req, 'getReceiptPDF');
  try {
    const stream = await billingService.getReceiptPDF(req.params.paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=receipt-${req.params.paymentId}.pdf`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/** @description Verify and process payment gateway webhooks */
const verifyGatewayPayment = async (req, res, next) => {
  logEntry(req, 'verifyGatewayPayment');
  try {
    // Implementation for verifying Razorpay/Stripe signature
    // const secret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;
    // verifySignature(req.headers['x-razorpay-signature'], req.body, secret);
    const data = await billingService.verifyGatewayWebhook(req.body);
    Response.sendSuccess(res, data, 'Webhook processed');
  } catch (error) {
    next(error);
  }
};

/**
 * Insurance Logic
 */

/** @description Initiate a new insurance claim for a bill */
const createInsuranceClaim = async (req, res, next) => {
  logEntry(req, 'createInsuranceClaim');
  try {
    const data = await billingService.createInsuranceClaim(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Insurance claim submitted', 201);
  } catch (error) {
    next(error);
  }
};

/** @description Retrieve status of an insurance claim */
const getClaimStatus = async (req, res, next) => {
  logEntry(req, 'getClaimStatus');
  try {
    const data = await billingService.getClaimStatus(req.params.claimId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Update insurance claim resolution status */
const updateClaimStatus = async (req, res, next) => {
  logEntry(req, 'updateClaimStatus');
  try {
    const data = await billingService.updateClaimStatus(req.params.claimId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Claim status updated');
  } catch (error) {
    next(error);
  }
};

/** @description Check insurance coverage eligibility for a patient */
const getInsuranceCoverage = async (req, res, next) => {
  logEntry(req, 'getInsuranceCoverage');
  try {
    const data = await billingService.getInsuranceCoverage(req.params.patientId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * Financial Reports (Accountant/Admin)
 */

/** @description List all outstanding bills with aging data */
const getOutstandingBills = async (req, res, next) => {
  logEntry(req, 'getOutstandingBills');
  try {
    const pagination = getPagination(req.query);
    const data = await billingService.getOutstandingBills(req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Generate daily collection and cash report */
const getDailyCashReport = async (req, res, next) => {
  logEntry(req, 'getDailyCashReport');
  try {
    const data = await billingService.generateDailyCashReport(req.query.date);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Get detailed revenue and GST analytics */
const getRevenueAnalytics = async (req, res, next) => {
  logEntry(req, 'getRevenueAnalytics');
  try {
    const data = await billingService.getRevenueAnalytics(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Export financial data as professional PDF/Excel */
const exportFinancialReport = async (req, res, next) => {
  logEntry(req, 'exportFinancialReport');
  try {
    // Placeholder for Excel/PDF export logic
    const data = await billingService.exportFinancialReport(req.query.format);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBill,
  getBillById,
  updateBillDraft,
  finalizeBill,
  cancelBill,
  listBills,
  getBillsByPatient,
  getBillPDF,
  addBillLineItem,
  removeBillLineItem,
  processPayment,
  getPaymentById,
  getPaymentsByBill,
  processRefund,
  getRefundStatus,
  getReceiptPDF,
  verifyGatewayPayment,
  createInsuranceClaim,
  getClaimStatus,
  updateClaimStatus,
  getInsuranceCoverage,
  getOutstandingBills,
  getDailyCashReport,
  getRevenueAnalytics,
  exportFinancialReport
};
