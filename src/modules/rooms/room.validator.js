const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Facilities & Infrastructure Validation Schemas
 * 
 * Enforced standards for clinical space provisioning, sterilization 
 * cycles, and atomic bed-anchoring patterns.
 */

const createRoomSchema = Joi.object({
  roomNumber: Joi.string().regex(/^[a-zA-Z0-9-]+$/).min(1).max(20).required().messages({
    'string.pattern.base': 'Infrastructure Error: Room number must be alphanumeric and may contain hyphens only.'
  }),
  wardId: Joi.string().uuid().required(),
  floor: Joi.number().integer().min(0).max(50).required(),
  building: Joi.string().max(50).default('Main'),
  roomType: Joi.string().valid(
    'single_private', 'double_sharing', 'triple_sharing', 'general_ward', 
    'icu', 'nicu', 'ot', 'picu', 'recovery', 'isolation', 
    'consultation', 'procedure_room', 'pharmacy', 'laboratory', 
    'reception', 'administration', 'storage', 'utility', 'cafeteria'
  ).required(),
  capacity: Joi.number().integer().required()
    .when('roomType', {
      is: Joi.string().valid('icu', 'nicu', 'picu', 'ot'),
      then: Joi.number().min(1).max(3).messages({ 'number.max': 'Infrastructure Constraint Error: Room capacity for ICU/OT must be between 1-3 beds.' }),
      otherwise: Joi.when('roomType', {
        is: 'general_ward',
        then: Joi.number().min(4).max(50),
        otherwise: Joi.number().min(1).max(10)
      })
    }),
  chargePerDay: Joi.number().integer().min(0).required() // paise
    .when('roomType', {
      is: Joi.string().valid('administration', 'storage', 'utility', 'reception', 'cafeteria'),
      then: Joi.equal(0).messages({ 'any.only': 'Tariff Policy Error: Administrative and storage rooms cannot have a daily patient charge.' })
    }),
  amenities: Joi.array().items(Joi.string().valid(
    'ac', 'tv', 'wifi', 'attached_bathroom', 'private_bathroom', 
    'refrigerator', 'visitor_couch', 'nursing_call_button', 
    'oxygen_port', 'suction_port', 'cardiac_monitor', 
    'ventilator_port', 'wardrobe', 'safe'
  )).optional(),
  isActive: Joi.boolean().default(true),
  maintenanceNotes: Joi.string().max(500).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Clinical Allocation & Admission ---
 */

const allocateRoomSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  bedId: Joi.string().uuid().required(),
  admissionId: Joi.string().uuid().required(),
  expectedDurationDays: Joi.number().integer().min(1).max(365).optional(),
  specialRequirements: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(300).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Infrastructure Lifecycle & Sterilization ---
 */

const releaseRoomSchema = Joi.object({
  bedId: Joi.string().uuid().required(),
  releaseReason: Joi.string().valid(
    'patient_discharged', 'patient_transferred', 
    'patient_deceased', 'admin_release'
  ).required(),
  cleaningRequired: Joi.boolean().default(true),
  cleaningDurationMinutes: Joi.number().integer().min(30).max(480).default(120),
  notes: Joi.string().max(300).optional()
}).options({ abortEarly: false, stripUnknown: true });

const roomMaintenanceSchema = Joi.object({
  maintenanceType: Joi.string().valid(
    'electrical', 'plumbing', 'hvac', 'furniture', 
    'equipment', 'painting', 'deep_cleaning', 'inspection'
  ).required(),
  scheduledStartDate: Joi.date().iso().min('now').required(),
  estimatedEndDate: Joi.date().iso().greater(Joi.ref('scheduledStartDate')).required(),
  technicianName: Joi.string().max(100).optional(),
  maintenanceCompany: Joi.string().max(100).optional(),
  notes: Joi.string().min(10).max(500).required()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Financial Sovereignty ---
 */

const updateChargesSchema = Joi.object({
  chargePerDay: Joi.number().integer().min(0).required(),
  effectiveFrom: Joi.date().iso().min('now').required(), // Simplified 'now' for past-1-day usually handled in service logic
  reason: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Audit Compliance Error: A justification (min 5 chars) is mandatory for room tariff changes.'
  })
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Search & Telemetry ---
 */

const roomAvailabilityQuerySchema = Joi.object({
  wardId: Joi.string().uuid().optional(),
  roomType: Joi.string().optional(),
  minCapacity: Joi.number().integer().min(1).optional(),
  amenities: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  dateTime: Joi.date().iso().optional(),
  availableOnly: Joi.boolean().default(true)
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createRoomSchema,
  updateRoomSchema: Joi.object({
    roomNumber: Joi.string().max(20).optional(),
    capacity: Joi.number().integer().optional(),
    chargePerDay: Joi.number().integer().min(0).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    isAvailable: Joi.boolean().optional()
  }).min(1).options({ abortEarly: false, stripUnknown: true }),
  allocateRoomSchema,
  releaseRoomSchema,
  roomMaintenanceSchema,
  updateChargesSchema,
  roomAvailabilityQuerySchema
};
