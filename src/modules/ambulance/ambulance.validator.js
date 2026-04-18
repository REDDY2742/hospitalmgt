const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Ambulance Fleet & Logistics Validators
 */

const registerAmbulanceSchema = Joi.object({
  vehicleNumber: Joi.string().uppercase().replace(/\s/g, '').max(15).required()
    .messages({ 'string.pattern.base': 'Vehicle number must be alphanumeric, uppercase, and without spaces' }),
  
  ambulanceType: Joi.string().valid(
    'BLS', 'ALS', 'MICU', 'neonatal', 'pediatric', 'bariatric', 'mortuary'
  ).required(),
  
  manufacturer: Joi.string().sanitize().max(100).required(),
  model: Joi.string().sanitize().max(100).required(),
  year: Joi.number().integer().min(2000).max(new Date().getFullYear() + 1).required(),
  
  registrationExpiry: Joi.date().iso().greater('now').required(),
  insuranceExpiry: Joi.date().iso().greater('now').required(),
  fitnessExpiry: Joi.date().iso().greater('now').required(),
  
  seatingCapacity: Joi.number().integer().min(2).max(6).required(),
  equipment: Joi.array().items(Joi.string().sanitize()).min(1).required(),
  
  fuelType: Joi.string().valid('diesel', 'petrol', 'electric', 'cng').default('diesel'),
  gpsDeviceId: Joi.string().sanitize().optional()
});

const createDispatchRequestSchema = Joi.object({
  pickupLatitude: Joi.number().min(-90).max(90).precision(6).required(),
  pickupLongitude: Joi.number().min(-180).max(180).precision(6).required(),
  pickupAddress: Joi.string().sanitize().min(10).max(500).required(),
  
  destinationLatitude: Joi.number().min(-90).max(90).precision(6).optional(),
  destinationLongitude: Joi.number().min(-180).max(180).precision(6).optional(),
  destinationAddress: Joi.string().sanitize().optional(),
  
  patientId: Joi.string().uuid().optional(),
  callerName: Joi.string().sanitize().min(2).max(100).required(),
  callerPhone: Joi.string().phone().required(),
  
  patientCondition: Joi.string().sanitize().min(5).max(500).required(),
  triageLevel: Joi.string().valid('P1_critical', 'P2_urgent', 'P3_less_urgent', 'P4_minor').required(),
  dispatchType: Joi.string().valid(
    'emergency', 'scheduled', 'inter_facility', 'patient_transport', 'body_transport'
  ).required(),
  
  specialRequirements: Joi.array().items(Joi.string().valid(
    'oxygen', 'defibrillator', 'incubator', 'wheelchair', 'stretcher'
  )).optional()
});

const updateLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).precision(6).required(),
  longitude: Joi.number().min(-180).max(180).precision(6).required(),
  speed: Joi.number().min(0).max(200).optional(), // km/h
  heading: Joi.number().min(0).max(360).optional(), // degrees
  accuracy: Joi.number().optional(), // meters
  timestamp: Joi.date().iso().required()
});

const completeTripSchema = Joi.object({
  pickupTime: Joi.date().iso().required(),
  
  hospitalArrivalTime: Joi.date().iso().greater(Joi.ref('pickupTime')).required()
    .messages({ 'date.greater': 'Hospital arrival time must be after pickup time' }),
  
  patientHandoverTime: Joi.date().iso().greater(Joi.ref('hospitalArrivalTime')).required(),
  
  distanceCovered: Joi.number().min(0).max(1000).required(), // km
  fuelConsumed: Joi.number().min(0).max(200).optional(),
  
  patientConditionOnPickup: Joi.string().sanitize().min(5).max(500).required(),
  patientConditionOnArrival: Joi.string().sanitize().min(5).max(500).required(),
  
  treatmentsGiven: Joi.array().items(Joi.string().sanitize()).optional(),
  complications: Joi.string().sanitize().max(500).optional(),
  driverNotes: Joi.string().sanitize().max(500).optional(),
  paramedicNotes: Joi.string().sanitize().max(1000).optional()
});

const scheduleMaintenanceSchema = Joi.object({
  ambulanceId: Joi.string().uuid().required(),
  maintenanceType: Joi.string().valid(
    'scheduled_service', 'breakdown_repair', 'inspection', 'deep_cleaning', 
    'equipment_check', 'tyre_change', 'battery'
  ).required(),
  scheduledDate: Joi.date().iso().greater('now').required(),
  estimatedDurationHours: Joi.number().min(0.5).max(72).required(),
  serviceCenterId: Joi.string().uuid().optional(),
  notes: Joi.string().sanitize().max(500).optional(),
  odometer: Joi.number().integer().min(0).required()
});

module.exports = {
  registerAmbulanceSchema,
  createDispatchRequestSchema,
  updateLocationSchema,
  completeTripSchema,
  scheduleMaintenanceSchema
};
