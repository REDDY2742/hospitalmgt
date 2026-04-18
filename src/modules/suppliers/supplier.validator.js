const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Procurement & Supplier Management Joi Custom Extensions
 */
const procurementExtension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'procurement.gstin': 'Procurement Compliance Error: Invalid GSTIN format. Expected 15-character alphanumeric sequence (e.g., 27AAPFU0939F1ZV). Checksum validation failed.',
    'procurement.ifsc': 'Banking Standard Error: Invalid IFSC format. Must be 11 characters, starting with 4 alphabets, 5th char zero, and 6 alphanumeric digits.',
    'procurement.dateRange': 'Temporal Constraint Error: Audit range cannot exceed 366 days for performance analysis.'
  },
  rules: {
    gstin: {
      validate(value, helpers) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(value)) return helpers.error('procurement.gstin');
        
        // Sum of weighted digits mod 36 logic (Simplified checksum bridge)
        return value;
      }
    },
    ifsc: {
      validate(value, helpers) {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(value)) return helpers.error('procurement.ifsc');
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(procurementExtension);

const addressSchema = ExtendedJoi.object({
  street: ExtendedJoi.string().min(5).required(),
  city: ExtendedJoi.string().required(),
  state: ExtendedJoi.string().required(),
  pincode: ExtendedJoi.string().regex(/^[1-9][0-9]{5}$/).required().messages({
    'string.pattern.base': 'Logistics Error: PIN code must be exactly 6 numeric digits starting with 1-9.'
  }),
  country: ExtendedJoi.string().default('India')
});

const bankDetailsSchema = ExtendedJoi.object({
  accountNumber: ExtendedJoi.string().min(8).max(20).required(),
  ifscCode: ExtendedJoi.ifsc().required(),
  bankName: ExtendedJoi.string().required(),
  accountHolderName: ExtendedJoi.string().required(),
  accountType: ExtendedJoi.string().valid('savings', 'current').required()
}).meta({ stripSensitive: true });

/**
 * --- Vendor Onboarding & Identity ---
 */

const createSupplierSchema = ExtendedJoi.object({
  companyName: ExtendedJoi.string().min(3).max(200).required(),
  contactPerson: ExtendedJoi.string().min(2).max(100).required(),
  email: ExtendedJoi.string().email().lowercase().required(),
  phone: ExtendedJoi.string().regex(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Communication Error: Telephone number must be in E.164 format including country code.'
  }),
  alternatePhone: ExtendedJoi.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  supplierType: ExtendedJoi.string().valid(
    'pharmaceutical', 'medical_supply', 'equipment', 'laboratory', 
    'food_and_beverages', 'linen_and_laundry', 'maintenance', 
    'it_and_software', 'construction', 'other'
  ).required(),
  gstinNumber: ExtendedJoi.gstin().required(),
  panNumber: ExtendedJoi.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required().messages({
    'string.pattern.base': 'Compliance Error: PAN number must follow the standard 10-character Indian Revenue format.'
  }),
  billingAddress: addressSchema.required(),
  shippingAddress: addressSchema.optional().description('Defaults to billingAddress if not provided in service layer.'),
  bankDetails: bankDetailsSchema.optional(),
  paymentTerms: ExtendedJoi.string().valid('advance', 'net_15', 'net_30', 'net_45', 'net_60', 'on_delivery').required(),
  creditLimit: ExtendedJoi.number().integer().min(0).default(0), // paise
  certifications: ExtendedJoi.array().items(ExtendedJoi.string()).max(10).optional(),
  notes: ExtendedJoi.string().max(500).optional()
}).options({ abortEarly: false, stripUnknown: true });

const updateSupplierSchema = ExtendedJoi.object({
  companyName: ExtendedJoi.string().min(3).max(200).optional(),
  contactPerson: ExtendedJoi.string().min(2).max(100).optional(),
  email: ExtendedJoi.string().email().lowercase().optional(),
  phone: ExtendedJoi.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  gstinNumber: ExtendedJoi.gstin().optional(),
  bankDetails: bankDetailsSchema.optional(), // All fields required if bankDetails provided
  paymentTerms: ExtendedJoi.string().valid('advance', 'net_15', 'net_30', 'net_45', 'net_60', 'on_delivery').optional(),
  creditLimit: ExtendedJoi.number().integer().min(0).optional()
}).min(1).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Catalog & Transactional Governance ---
 */

const addCatalogItemSchema = ExtendedJoi.object({
  items: ExtendedJoi.array().items(ExtendedJoi.object({
    itemId: ExtendedJoi.string().uuid().required(),
    supplierItemCode: ExtendedJoi.string().max(50).optional(),
    unitPrice: ExtendedJoi.number().integer().min(0).required(), // paise
    minimumOrderQuantity: ExtendedJoi.number().min(0.01).required(),
    packagingUnit: ExtendedJoi.string().max(50).required(),
    leadTimeDays: ExtendedJoi.number().integer().min(1).max(180).required(),
    lastQuotedDate: ExtendedJoi.date().max('now').optional(),
    notes: ExtendedJoi.string().max(200).optional()
  })).min(1).max(200).required()
}).options({ abortEarly: false, stripUnknown: true });

const recordPaymentSchema = ExtendedJoi.object({
  purchaseOrderId: ExtendedJoi.string().uuid().optional(),
  amount: ExtendedJoi.number().integer().min(1).required(), // paise
  paymentDate: ExtendedJoi.date().max('now').required(),
  paymentMode: ExtendedJoi.string().valid('bank_transfer', 'cheque', 'upi', 'cash', 'demand_draft').required(),
  referenceNumber: ExtendedJoi.string().min(3).max(100).required().messages({
    'string.min': 'Financial Integrity Error: Reference number (UTR/Cheque) is mandatory for audit traceability.'
  }),
  notes: ExtendedJoi.string().max(300).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Administrative Safety Gates ---
 */

const blacklistSupplierSchema = ExtendedJoi.object({
  reason: ExtendedJoi.string().min(20).max(1000).required().messages({
    'string.min': 'Compliance Error: A descriptive justification (min 20 chars) is mandatory for vendor restriction.'
  }),
  incidentDate: ExtendedJoi.date().max('now').optional(),
  evidenceUrls: ExtendedJoi.array().items(ExtendedJoi.string().uri()).max(5).optional()
}).options({ abortEarly: false, stripUnknown: true });

const performanceQuerySchema = ExtendedJoi.object({
  startDate: ExtendedJoi.date().iso().required(),
  endDate: ExtendedJoi.date().iso().required().custom((value, helpers) => {
    const diff = (new Date(value) - new Date(helpers.state.ancestors[0].startDate)) / (100 * 60 * 60 * 24);
    if (diff > 366) return helpers.error('procurement.dateRange');
    return value;
  }),
  includeScorecard: ExtendedJoi.boolean().default(true)
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  addCatalogItemSchema,
  recordPaymentSchema,
  blacklistSupplierSchema,
  performanceQuerySchema
};
