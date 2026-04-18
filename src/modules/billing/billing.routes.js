const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const {
  generateBillSchema,
  paymentSchema,
  refundSchema,
  insuranceClaimSchema
} = require('./billing.validator');

/**
 * Hospital Billing & Financial Gateway
 * Base Path: /api/v1/billing
 */

// --- Central Bill Management ---

router.post('/bills',
  authenticate,
  authorize('billing:create_bill'),
  validate({ body: generateBillSchema }),
  auditTrail,
  billingController.generateBill
);

router.get('/bills',
  authenticate,
  authorize('billing:read_all'),
  billingController.listBills
);

router.get('/bills/outstanding',
  authenticate,
  authorize('billing:read_outstanding'),
  billingController.getOutstandingBills
);

router.get('/bills/:id',
  authenticate,
  authorize('billing:read_bill'),
  billingController.getBillById
);

router.get('/bills/:id/pdf',
  authenticate,
  authorize('billing:read_pdf'),
  billingController.getBillPDF
);

router.put('/bills/:id',
  authenticate,
  authorize('billing:update_draft'),
  auditTrail,
  billingController.updateBillDraft
);

router.post('/bills/:id/finalize',
  authenticate,
  authorize('billing:finalize_bill'),
  auditTrail,
  billingController.finalizeBill
);

router.delete('/bills/:id',
  authenticate,
  authorize('billing:delete_bill'),
  auditTrail,
  billingController.cancelBill
);

router.post('/bills/:id/line-items',
  authenticate,
  authorize('billing:add_item'),
  auditTrail,
  billingController.addBillLineItem
);

router.delete('/bills/:id/line-items/:itemId',
  authenticate,
  authorize('billing:remove_item'),
  auditTrail,
  billingController.removeBillLineItem
);

router.get('/bills/patient/:patientId',
  authenticate,
  authorize('billing:read_patient_bills'),
  billingController.getBillsByPatient
);

// --- Secure Payment Orchestration ---

router.post('/payments',
  authenticate,
  authorize('billing:process_payment'),
  validate({ body: paymentSchema }),
  auditTrail,
  billingController.processPayment
);

router.get('/payments/:paymentId',
  authenticate,
  authorize('billing:read_payment'),
  billingController.getPaymentById
);

router.get('/payments/:paymentId/receipt',
  authenticate,
  authorize('billing:read_receipt'),
  billingController.getReceiptPDF
);

router.post('/payments/:paymentId/refund',
  authenticate,
  authorize('billing:process_refund'),
  validate({ body: refundSchema }),
  auditTrail,
  billingController.processRefund
);

router.get('/payments/bill/:id',
  authenticate,
  authorize('billing:read_bill_payments'),
  billingController.getPaymentsByBill
);

// --- Secure Webhooks (No Authenticate, Signature Validation Only) ---

router.post('/payments/webhook/razorpay',
  // razorpayWebhookValidator, 
  billingController.verifyGatewayPayment
);

router.post('/payments/webhook/stripe',
  // stripeWebhookValidator,
  billingController.verifyGatewayPayment
);

// --- Insurance & Claim management ---

router.post('/insurance/claims',
  authenticate,
  authorize('billing:create_claim'),
  validate({ body: insuranceClaimSchema }),
  auditTrail,
  billingController.createInsuranceClaim
);

router.get('/insurance/claims/:claimId',
  authenticate,
  authorize('billing:read_claim'),
  billingController.getClaimStatus
);

router.put('/insurance/claims/:claimId',
  authenticate,
  authorize('billing:update_claim'),
  auditTrail,
  billingController.updateClaimStatus
);

router.get('/insurance/coverage/:patientId',
  authenticate,
  authorize('billing:read_coverage'),
  billingController.getInsuranceCoverage
);

// --- Financial Analytics & Reporting ---

router.get('/reports/daily',
  authenticate,
  authorize('billing:read_daily_report'),
  billingController.getDailyCashReport
);

router.get('/reports/revenue',
  authenticate,
  authorize('billing:read_revenue_report'),
  billingController.getRevenueAnalytics
);

router.get('/reports/export',
  authenticate,
  authorize('billing:export_report'),
  billingController.exportFinancialReport
);

module.exports = router;
