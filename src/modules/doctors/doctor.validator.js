const Joi = require('../../utils/joi.extensions');

/**
 * Doctor Module Validators
 */

const createDoctorSchema = Joi.object({
  firstName: Joi.string().sanitize().min(2).max(50).required(),
  lastName: Joi.string().sanitize().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.hospital().phoneNumber().required(),
  specialization: Joi.string().sanitize().required(),
  departmentId: Joi.string().uuid().required(),
  qualifications: Joi.array().items(Joi.string().sanitize()).required(),
  experienceYears: Joi.number().integer().min(0).required(),
  registrationNumber: Joi.string().required(),
  consultationFee: Joi.number().positive().required(),
  bio: Joi.string().sanitize().max(1000).optional()
});

const updateScheduleSchema = Joi.object({
  day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  slotDuration: Joi.number().valid(15, 30, 45, 60).required(),
  maxPatients: Joi.number().integer().min(1).required()
});

const blockSlotSchema = Joi.object({
  date: Joi.date().iso().min('now').required(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  reason: Joi.string().sanitize().max(200).required()
});

const applyLeaveSchema = Joi.object({
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  reason: Joi.string().sanitize().max(500).required(),
  leaveType: Joi.string().valid('sick', 'casual', 'emergency', 'other').required()
});

const manageLeaveSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminRemarks: Joi.string().sanitize().max(500).optional()
});

module.exports = {
  createDoctorSchema,
  updateScheduleSchema,
  blockSlotSchema,
  applyLeaveSchema,
  manageLeaveSchema
};
