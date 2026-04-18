const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Insurance & TPA Validation Schemas
 */

const addProviderSchema = Joi.object({
  providerName: Joi.string().trim().min(3).max(200).required(),
  providerType: Joi.string().valid('insurance_company', 'tpa', 'government_scheme', 'corporate').required(),
  gstin: Joi.string().required().messages({ 'string.empty': 'GSTIN is required for carrier empanelment' }),
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
  contactEmail: Joi.string().email().required(),
  claimEmail: Joi.string().email().required(),
  preAuthRequired: Joi.boolean().default(false),
  empanelmentValidTill: Joi.date().greater('now').required(),
  bankDetails: Joi.object({
    accountName: Joi.string().required(),
    accountNumber: Joi.string().required(),
    ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    bankName: Joi.string().required()
  }).optional()
}).options({ abortEarly: false, stripUnknown: true });

const addPatientInsuranceSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  policyNumber: Joi.string().trim().min(5).max(50).required(),
  sumInsured: Joi.number().integer().min(10000).required(), // paise (min 100 Rs)
  validFrom: Joi.date().max('now').required(),
  validTill: Joi.date().greater(Joi.ref('validFrom')).required(),
  copayPercentage: Joi.number().min(0).max(100).default(0),
  deductibleAmount: Joi.number().integer().min(0).default(0),
  insuranceType: Joi.string().valid('individual', 'family_floater', 'corporate_group').required()
}).options({ abortEarly: false, stripUnknown: true });

const createPreAuthSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  admissionId: Joi.string().uuid().optional(),
  serviceType: Joi.string().valid('surgical', 'medical', 'diagnostic', 'daycare').required(),
  roomCharges: Joi.number().integer().min(0).required(), // paise
  medicineCharges: Joi.number().integer().min(0).required(),
  otCharges: Joi.number().integer().min(0).optional(),
  professionalFees: Joi.number().integer().min(0).required(),
  plannedProcedures: Joi.array().items(Joi.string()).min(1).required(),
  diagnosis: Joi.string().max(500).required()
}).options({ abortEarly: false, stripUnknown: true });

const processSettlementSchema = Joi.object({
  settledAmount: Joi.number().integer().min(0).required(), // paise
  settlementDate: Joi.date().max('now').required(),
  settlementMode: Joi.string().valid('neft', 'rtgs', 'cheque', 'internal_transfer').required(),
  referenceNumber: Joi.string().required(),
  remarks: Joi.string().max(500).optional()
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  addProviderSchema,
  updateProviderSchema: addProviderSchema.fork(['providerName', 'gstin', 'pan'], (s) => s.optional()),
  addPatientInsuranceSchema,
  createPreAuthSchema,
  updatePreAuthStatusSchema: Joi.object({
    status: Joi.string().valid('APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'UNDER_REVIEW').required(),
    approvedAmount: Joi.number().integer().when('status', { is: 'APPROVED', then: Joi.required() }),
    authorizationCode: Joi.string().when('status', { is: 'APPROVED', then: Joi.required() }),
    rejectionReason: Joi.string().when('status', { is: 'REJECTED', then: Joi.required() })
  }),
  createClaimSchema: Joi.object({
    billId: Joi.string().uuid().required(),
    patientInsuranceId: Joi.string().uuid().required(),
    claimType: Joi.string().valid('cashless', 'reimbursement').required(),
    documents: Joi.array().items(Joi.string().uuid()).min(1).required()
  }),
  processSettlementSchema,
  disputeClaimSchema: Joi.object({
    disputeType: Joi.string().valid('amount_mismatch', 'rejection_appeal', 'eligibility_issue').required(),
    disputeReason: Joi.string().min(10).max(1000).required()
  }),
  eligibilityQuerySchema: Joi.object({
    serviceDate: Joi.date().iso().default(() => new Date()),
    serviceType: Joi.string().optional()
  })
};
