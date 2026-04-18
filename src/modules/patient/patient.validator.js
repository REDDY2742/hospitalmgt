const Joi = require('../../utils/joi.extensions');

/**
 * Patient Module Validators
 */

const patientSchema = {
  // Body Validation
  body: Joi.object({
    firstName: Joi.string().sanitize().required().max(50),
    lastName: Joi.string().sanitize().required().max(50),
    phone: Joi.hospital().phoneNumber().required(),
    aadhaar: Joi.hospital().aadhaarNumber().required(),
    bloodGroup: Joi.hospital().bloodGroup().required(),
    
    // Conditional Validation: If admissionType is IPD, wardId is required
    admissionType: Joi.string().valid('OPD', 'IPD').required(),
    wardId: Joi.number().when('admissionType', {
      is: 'IPD',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    
    diagnosisCode: Joi.hospital().icd10().optional()
  }),

  // Params Validation
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

const appointmentSchema = {
  body: Joi.object({
    patientId: Joi.number().required(),
    doctorId: Joi.number().required(),
    slotTime: Joi.hospital().appointmentTime().required(),
    notes: Joi.string().sanitize().max(500).optional()
  })
};

module.exports = {
  patientSchema,
  appointmentSchema
};
