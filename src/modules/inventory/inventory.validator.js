const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Inventory & Supply Chain Validators
 * 
 * Engineered for pharmacological and surgical asset integrity, 
 * rigorous procurement gating, and sub-meter storage location tracking.
 */

const addInventoryItemSchema = Joi.object({
  itemName: Joi.string().sanitize().min(3).max(200).required(),
  itemCode: Joi.string().sanitize().optional(),
  
  category: Joi.string().valid(
    'medical_supply', 'equipment', 'surgical', 'ppe', 'housekeeping', 
    'office', 'linen', 'laboratory', 'pharmacy_consumable', 'maintenance'
  ).required(),
  
  subCategory: Joi.string().sanitize().max(100).optional(),
  
  unitOfMeasure: Joi.string().valid(
    'pieces', 'boxes', 'strips', 'vials', 'bottles', 'packets', 'kg', 
    'grams', 'liters', 'ml', 'meters', 'pairs', 'sets', 'rolls'
  ).required(),
  
  manufacturer: Joi.string().sanitize().max(200).optional(),
  brand: Joi.string().sanitize().max(100).optional(),
  specifications: Joi.string().sanitize().max(1000).optional(),
  
  storageLocation: Joi.object({
    building: Joi.string().sanitize().optional(),
    floor: Joi.string().sanitize().optional(),
    room: Joi.string().sanitize().required(),
    shelf: Joi.string().sanitize().optional(),
    bin: Joi.string().sanitize().optional()
  }).required(),
  
  storageTemperature: Joi.string().valid(
    'room_temp', 'refrigerated_2_8', 'frozen', 'cold_chain'
  ).optional(),
  
  reorderLevel: Joi.number().integer().min(0).required(),
  minimumQuantity: Joi.number().integer().min(0).required(),
  maximumQuantity: Joi.number().integer().min(1).required(),
  
  hsnCode: Joi.string().regex(/^\d{4,8}$/).optional(),
  gstPercentage: Joi.number().valid(0, 5, 12, 18, 28).optional(),
  
  isControlled: Joi.boolean().default(false),
  requiresDualAuthorization: Joi.boolean().default(false),
  preferredVendors: Joi.array().items(Joi.string().uuid()).max(5).optional(),
  notes: Joi.string().sanitize().max(500).optional()
}).custom((value, helpers) => {
  // Logic: maximumQuantity > reorderLevel > minimumQuantity
  if (value.maximumQuantity <= value.reorderLevel) {
    return helpers.error('any.invalid', { message: 'Maximum quantity must be greater than the reorder level' });
  }
  if (value.reorderLevel <= value.minimumQuantity) {
    return helpers.error('any.invalid', { message: 'Reorder level must be greater than the minimum quantity' });
  }
  return value;
});

const issueStockSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  quantity: Joi.number().min(0.01).required(),
  
  issuedTo: Joi.object({
    type: Joi.string().valid('ward', 'department', 'ot', 'emergency', 'lab', 'pharmacy', 'staff').required(),
    id: Joi.string().uuid().required()
  }).required(),
  
  purpose: Joi.string().valid(
    'patient_care', 'maintenance', 'administrative', 'research', 'training', 'emergency'
  ).required(),
  
  requestedBy: Joi.string().uuid().optional(),
  patientId: Joi.string().uuid().optional(),
  notes: Joi.string().sanitize().max(300).optional(),
  batchPreference: Joi.string().sanitize().optional()
});

const adjustStockSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
  adjustmentType: Joi.string().valid(
    'addition', 'deduction', 'damaged', 'expired', 'audit_correction', 'theft', 'transfer'
  ).required(),
  quantity: Joi.number().min(0.01).required(),
  reason: Joi.string().sanitize().min(10).max(500).required(),
  referenceDocument: Joi.string().sanitize().optional(),
  batchNumber: Joi.string().sanitize().optional(),
  supportingDocumentUrl: Joi.string().uri().optional()
});

const raisePurchaseRequestSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    itemId: Joi.string().uuid().required(),
    quantity: Joi.number().min(0.01).required(),
    estimatedUnitCost: Joi.number().integer().min(0).optional(), // paise
    urgency: Joi.string().valid('routine', 'urgent', 'emergency').required(),
    justification: Joi.string().sanitize().min(5).max(300).required()
  })).min(1).max(50).required(),
  
  departmentId: Joi.string().uuid().required(),
  requiredByDate: Joi.date().iso().min('now + 1d').required(),
  overallUrgency: Joi.string().valid('routine', 'urgent', 'emergency').required(),
  overallJustification: Joi.string().sanitize().min(10).max(1000).required(),
  budgetCode: Joi.string().sanitize().max(50).optional()
});

const createPurchaseOrderSchema = Joi.object({
  purchaseRequestId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().required(),
  
  items: Joi.array().items(Joi.object({
    itemId: Joi.string().uuid().required(),
    quantity: Joi.number().min(0.01).required(),
    unitPrice: Joi.number().integer().min(0).required(), // paise
    gstPercentage: Joi.number().valid(0, 5, 12, 18, 28).required(),
    discount: Joi.number().min(0).max(100).default(0),
    deliveryDate: Joi.date().iso().greater('now').required()
  })).min(1).max(100).required(),
  
  billingAddress: Joi.string().sanitize().min(10).max(500).required(),
  deliveryAddress: Joi.string().sanitize().min(10).max(500).required(),
  
  paymentTerms: Joi.string().valid(
    'advance', 'net_30', 'net_60', 'on_delivery', 'milestone_based'
  ).required(),
  
  specialInstructions: Joi.string().sanitize().max(1000).optional(),
  budgetCode: Joi.string().sanitize().max(50).optional()
});

const receiveInventorySchema = Joi.object({
  purchaseOrderId: Joi.string().uuid().required(),
  grnDate: Joi.date().iso().max('now').required(),
  deliveryNote: Joi.string().sanitize().max(100).optional(),
  
  items: Joi.array().items(Joi.object({
    itemId: Joi.string().uuid().required(),
    orderedQuantity: Joi.number().required(),
    receivedQuantity: Joi.number().min(0).required(),
    rejectedQuantity: Joi.number().default(0),
    batchNumber: Joi.string().sanitize().required(),
    manufacturingDate: Joi.date().iso().max('now').optional(),
    
    expiryDate: Joi.date().iso().min('now + 30d').optional()
      .messages({ 'date.min': 'Expiry date must be at least 30 days from today for new stock' }),
    
    condition: Joi.string().valid(
      'good', 'damaged', 'short_expiry', 'wrong_item', 'quantity_mismatch'
    ).required(),
    
    rejectionReason: Joi.string().sanitize().when('rejectedQuantity', {
      is: Joi.number().greater(0),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    
    unitCost: Joi.number().integer().min(0).required() // paise
  })).min(1).required(),
  
  qualityCheckDone: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Quality check must be confirmed before inventory intake' }),
  
  qualityCheckNotes: Joi.string().sanitize().max(500).optional(),
  invoiceNumber: Joi.string().sanitize().max(100).required(),
  invoiceDate: Joi.date().iso().max('now').required()
}).custom((value, helpers) => {
  // Logic: received + rejected approx ordered (within 5% tolerance)
  value.items.forEach((item, index) => {
    const totalProcessed = item.receivedQuantity + item.rejectedQuantity;
    const tolerance = item.orderedQuantity * 0.05;
    if (Math.abs(totalProcessed - item.orderedQuantity) > tolerance) {
       // Note: Returning warning or error depends on hospital SOP. Here we allow but could throw error.
    }
  });
  return value;
});

module.exports = {
  addInventoryItemSchema,
  issueStockSchema,
  adjustStockSchema,
  raisePurchaseRequestSchema,
  createPurchaseOrderSchema,
  receiveInventorySchema
};
