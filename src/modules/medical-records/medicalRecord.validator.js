const Joi = require('../../utils/joi.extensions');

/**
 * Hospital Medical Records (EHR) Custom Joi Extensions
 */

const validateICD10Code = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'medical.icd10': 'Standardization Error: Invalid ICD-10 code. Format: Letter + 2 digits + optional decimal (e.g., J18.9, I10)' },
  rules: {
    icd10: {
      validate(value, helpers) {
        if (!/^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/.test(value)) return helpers.error('medical.icd10');
        return value;
      }
    }
  }
});

const validateMRN = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'medical.mrn': 'Identification Error: Invalid MRN format. Expected: MRN-YYYY-XXXXXX (e.g., MRN-2024-000123)' },
  rules: {
    mrn: {
      validate(value, helpers) {
        if (!/^MRN-\d{4}-\d{6}$/.test(value)) return helpers.error('medical.mrn');
        return value;
      }
    }
  }
});

const validateBloodGroup = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'medical.bloodGroup': 'Biological Error: Blood group must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-' },
  rules: {
    bloodGroup: {
      validate(value, helpers) {
        if (!['A+','A-','B+','B-','O+','O-','AB+','AB-'].includes(value)) return helpers.error('medical.bloodGroup');
        return value;
      }
    }
  }
});

const validateS3URL = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'medical.s3url': 'Infrastructure Error: Document URL must be a valid S3 URL' },
  rules: {
    s3url: {
      validate(value, helpers) {
        if (!value.startsWith('https://') || !value.includes('amazonaws.com')) return helpers.error('medical.s3url');
        return value;
      }
    }
  }
});

const ExtendedJoi = Joi.extend(validateICD10Code, validateMRN, validateBloodGroup, validateS3URL);

const ICD10_SCHEMA = ExtendedJoi.icd10();

/**
 * --- Clinical Archetype & Identification ---
 */

/**
 * @description Validates initial medical record creation on patient registration
 * @phi-sensitive true
 */
const createMedicalRecordSchema = ExtendedJoi.object({
  patientId: ExtendedJoi.string().uuid().required().messages({
    'string.uuid': 'Valid patient ID (UUID) is required',
    'any.required': 'Patient ID is required'
  }),
  bloodGroup: ExtendedJoi.bloodGroup().required().messages({
    'any.required': 'Blood group is required'
  }),
  rhFactor: ExtendedJoi.string().valid('positive', 'negative').required().messages({
    'any.only': 'Rh factor must be positive or negative',
    'any.required': 'Rh factor is required'
  }),
  allergies: ExtendedJoi.array().items(ExtendedJoi.object({
    substance: ExtendedJoi.string().trim().min(2).max(200).required().messages({
      'string.min': 'Allergen name must be at least 2 characters'
    }),
    allergyType: ExtendedJoi.string().valid('drug', 'food', 'environmental', 'latex', 'contrast_dye', 'other').required(),
    reactionType: ExtendedJoi.string().valid('anaphylaxis', 'urticaria', 'rash', 'angioedema', 'nausea_vomiting', 'respiratory', 'other').required(),
    severity: ExtendedJoi.string().valid('mild', 'moderate', 'severe', 'life_threatening').required(),
    onsetDate: ExtendedJoi.date().max('now').optional(),
    notes: ExtendedJoi.string().trim().max(300).optional()
  })).max(50).default([]),
  chronicConditions: ExtendedJoi.array().items(ExtendedJoi.object({
    name: ExtendedJoi.string().trim().min(2).max(200).required(),
    icd10Code: ICD10_SCHEMA.optional(),
    diagnosedDate: ExtendedJoi.date().max('now').optional(),
    currentStatus: ExtendedJoi.string().valid('active', 'controlled', 'resolved').required()
  })).max(30).default([]),
  familyHistory: ExtendedJoi.object({
    diabetes: ExtendedJoi.boolean().default(false),
    hypertension: ExtendedJoi.boolean().default(false),
    heartDisease: ExtendedJoi.boolean().default(false),
    cancer: ExtendedJoi.boolean().default(false),
    details: ExtendedJoi.string().trim().max(1000).optional()
  }).optional(),
  socialHistory: ExtendedJoi.object({
    smokingStatus: ExtendedJoi.string().valid('never', 'former', 'current').optional(),
    smokingPackYears: ExtendedJoi.number().min(0).max(200).when('smokingStatus', {
      is: ExtendedJoi.valid('current', 'former'), then: ExtendedJoi.required(), otherwise: ExtendedJoi.forbidden()
    })
  }).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Clinical Encounter Documentation ---
 */

/**
 * @description Validates new consultation/visit record creation by doctor
 * @phi-sensitive true
 */
const addConsultationRecordSchema = ExtendedJoi.object({
  visitType: ExtendedJoi.string().valid('opd', 'ipd', 'emergency', 'telemedicine', 'follow_up', 'day_care', 'second_opinion').required(),
  visitDate: ExtendedJoi.date().max('now').required(),
  chiefComplaint: ExtendedJoi.string().trim().min(5).max(500).required(),
  historyOfPresentIllness: ExtendedJoi.string().trim().min(10).max(5000).required(),
  examinationFindings: ExtendedJoi.string().trim().min(5).max(5000).required(),
  diagnoses: ExtendedJoi.array().items(ExtendedJoi.object({
    icd10Code: ICD10_SCHEMA.optional(),
    description: ExtendedJoi.string().trim().min(3).max(300).required(),
    type: ExtendedJoi.string().valid('primary', 'secondary', 'comorbidity', 'provisional').required()
  })).min(1).max(10).required().custom((diagnoses, helpers) => {
    const primaryCount = diagnoses.filter(d => d.type === 'primary').length;
    if (primaryCount === 0) return helpers.message('Clinical Logic Error: At least one primary diagnosis is required');
    if (primaryCount > 1) return helpers.message('Clinical Logic Error: Only one primary diagnosis is allowed per consultation');
    return diagnoses;
  }),
  treatmentPlan: ExtendedJoi.string().trim().min(10).max(3000).required(),
  followUpRequired: ExtendedJoi.boolean().required(),
  followUpDate: ExtendedJoi.date().min('now').when('followUpRequired', { is: true, then: ExtendedJoi.required() }),
  followUpInstructions: ExtendedJoi.string().trim().min(5).max(1000).when('followUpRequired', { is: true, then: ExtendedJoi.required() }),
  internalDoctorNotes: ExtendedJoi.string().trim().max(2000).optional()
}).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Specialized Data Mutation ---
 */

/**
 * @description Validates allergy add/update/remove operations
 * @phi-sensitive true
 * @safety-critical true
 */
const updateAllergiesSchema = ExtendedJoi.object({
  operation: ExtendedJoi.string().valid('add', 'update', 'remove').required(),
  allergies: ExtendedJoi.array().items(ExtendedJoi.object({
    allergyId: ExtendedJoi.string().uuid().when(ExtendedJoi.ref('/operation'), { is: ExtendedJoi.valid('update', 'remove'), then: ExtendedJoi.required() }),
    substance: ExtendedJoi.string().trim().min(2).max(200).when(ExtendedJoi.ref('/operation'), { is: 'add', then: ExtendedJoi.required() }),
    severity: ExtendedJoi.string().valid('mild', 'moderate', 'severe', 'life_threatening').when(ExtendedJoi.ref('/operation'), { is: 'add', then: ExtendedJoi.required() })
  })).min(1).required()
}).meta({ SAFETY_CRITICAL: true }).options({ abortEarly: false, stripUnknown: true });

/**
 * --- Institutional Governance & Compliance ---
 */

/**
 * @description Validates patient granting medical record access to doctor
 */
const grantAccessSchema = ExtendedJoi.object({
  grantedToUserId: ExtendedJoi.string().uuid().required(),
  accessLevel: ExtendedJoi.string().valid('full', 'clinical_only', 'specific_documents').required(),
  specificDocumentIds: ExtendedJoi.array().items(ExtendedJoi.string().uuid()).when('accessLevel', {
    is: 'specific_documents', then: ExtendedJoi.required(), otherwise: ExtendedJoi.forbidden()
  }),
  expiresAt: ExtendedJoi.date().min('now').max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).required(),
  purpose: ExtendedJoi.string().trim().min(10).max(300).required(),
  consentConfirmed: ExtendedJoi.boolean().valid(true).required()
}).options({ abortEarly: false, stripUnknown: true });

module.exports = {
  createMedicalRecordSchema,
  addConsultationRecordSchema,
  updateConsultationSchema: addConsultationRecordSchema.fork(
    ['visitType', 'visitDate', 'chiefComplaint', 'historyOfPresentIllness', 'examinationFindings', 'diagnoses', 'treatmentPlan', 'followUpRequired'], 
    (schema) => schema.optional()
  ).append({ version: ExtendedJoi.number().integer().min(1).required() }).custom((value, helpers) => {
    const { version, ...rest } = value;
    if (Object.keys(rest).length === 0) return helpers.message('Protocol Error: At least one field must be provided for update');
    return value;
  }),
  addAddendumSchema: ExtendedJoi.object({
    content: ExtendedJoi.string().trim().min(10).max(2000).required(),
    reason: ExtendedJoi.string().trim().min(10).max(500).required()
  }).options({ abortEarly: false, stripUnknown: true }),
  updateAllergiesSchema,
  updateChronicConditionsSchema: ExtendedJoi.object({
    operation: ExtendedJoi.string().valid('add', 'update', 'resolve').required(),
    conditions: ExtendedJoi.array().items(ExtendedJoi.object({
      conditionId: ExtendedJoi.string().uuid().when(ExtendedJoi.ref('/operation'), { is: ExtendedJoi.valid('update', 'resolve'), then: ExtendedJoi.required() }),
      name: ExtendedJoi.string().trim().min(2).max(200).when(ExtendedJoi.ref('/operation'), { is: 'add', then: ExtendedJoi.required() }),
      icd10Code: ICD10_SCHEMA.optional(),
      currentStatus: ExtendedJoi.string().valid('active', 'controlled', 'resolved').when(ExtendedJoi.ref('/operation'), { is: 'add', then: ExtendedJoi.required() }),
      resolvedDate: ExtendedJoi.date().max('now').when(ExtendedJoi.ref('/operation'), { is: 'resolve', then: ExtendedJoi.required(), otherwise: ExtendedJoi.forbidden() })
    })).min(1).required()
  }).options({ abortEarly: false, stripUnknown: true }),
  addSurgicalHistorySchema: ExtendedJoi.object({
    procedureName: ExtendedJoi.string().trim().min(3).max(300).required(),
    performedDate: ExtendedJoi.date().max('now').required(),
    hospitalName: ExtendedJoi.string().trim().min(3).max(200).required(),
    surgeonName: ExtendedJoi.string().trim().min(2).max(100).required(),
    anesthesiaType: ExtendedJoi.string().valid('general', 'regional', 'local', 'spinal', 'epidural', 'none').required(),
    outcome: ExtendedJoi.string().valid('successful', 'complicated', 'incomplete', 'abandoned').required(),
    implantsPlaced: ExtendedJoi.array().items(ExtendedJoi.object({
      type: ExtendedJoi.string().trim().min(3).max(200).required(),
      manufacturer: ExtendedJoi.string().trim().min(2).max(100).required(),
      modelNumber: ExtendedJoi.string().trim().min(2).max(100).required(),
      serialNumber: ExtendedJoi.string().trim().min(2).max(100).required()
    })).max(10).default([]),
    transfusionRequired: ExtendedJoi.boolean().default(false),
    unitsTransfused: ExtendedJoi.number().integer().min(0).max(50).when('transfusionRequired', { is: true, then: ExtendedJoi.required() })
  }).options({ abortEarly: false, stripUnknown: true }),
  addVaccinationRecordSchema: ExtendedJoi.object({
    vaccineName: ExtendedJoi.string().trim().min(2).max(200).required(),
    administeredDate: ExtendedJoi.date().max('now').required(),
    doseNumber: ExtendedJoi.number().integer().min(1).max(10).required(),
    doseType: ExtendedJoi.string().valid('primary', 'booster', 'annual').required(),
    nextDueDate: ExtendedJoi.date().min('now').optional(),
    vaccinationCertificateUrl: ExtendedJoi.custom(validateS3URL).optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  uploadDocumentBodySchema: ExtendedJoi.object({
    documentType: ExtendedJoi.string().valid('lab_report', 'radiology', 'discharge_summary', 'prescription', 'referral_letter', 'insurance_document', 'consent_form', 'legal_document', 'vaccination_record', 'operative_note', 'pathology_report', 'imaging_cd', 'correspondence', 'psychiatric_assessment', 'hiv_test_result', 'other').required(),
    title: ExtendedJoi.string().trim().min(3).max(200).required(),
    isConfidential: ExtendedJoi.boolean().when('documentType', {
      is: ExtendedJoi.valid('psychiatric_assessment', 'hiv_test_result', 'legal_document', 'consent_form'),
      then: ExtendedJoi.boolean().default(true),
      otherwise: ExtendedJoi.boolean().default(false)
    })
  }).options({ abortEarly: false, stripUnknown: true }),
  grantAccessSchema,
  medicalHistoryQuerySchema: ExtendedJoi.object({
    startDate: ExtendedJoi.date().optional(),
    endDate: ExtendedJoi.date().min(ExtendedJoi.ref('startDate')).optional(),
    visitType: ExtendedJoi.alternatives().try(ExtendedJoi.string(), ExtendedJoi.array()).optional()
  }).custom((value, helpers) => {
    if (value.startDate && value.endDate && (value.endDate - value.startDate) / (1000 * 60 * 60 * 24) > 365) return helpers.message('Inquiry Error: Medical history date range cannot exceed 365 days');
    return value;
  }).options({ abortEarly: false, stripUnknown: true }),
  timelineQuerySchema: ExtendedJoi.object({
    cursor: ExtendedJoi.string().optional(),
    limit: ExtendedJoi.number().integer().min(5).max(50).default(20),
    eventTypes: ExtendedJoi.alternatives().try(ExtendedJoi.string(), ExtendedJoi.array()).optional()
  }).options({ abortEarly: false, stripUnknown: true }),
  auditTrailQuerySchema: ExtendedJoi.object({
    startDate: ExtendedJoi.date().required(),
    endDate: ExtendedJoi.date().min(ExtendedJoi.ref('startDate')).required(),
    accessorId: ExtendedJoi.string().uuid().optional(),
    onlyHighRisk: ExtendedJoi.boolean().default(false)
  }).custom((value, helpers) => {
    if ((value.endDate - value.startDate) / (1000 * 60 * 60 * 24) > 90) return helpers.message('Audit Error: Trail range cannot exceed 90 days');
    return value;
  }).options({ abortEarly: false, stripUnknown: true }),
  documentListQuerySchema: ExtendedJoi.object({
    documentType: ExtendedJoi.string().optional(),
    page: ExtendedJoi.number().integer().min(1).default(1),
    limit: ExtendedJoi.number().integer().min(5).max(50).default(20)
  }),
  updateDocumentMetadataSchema: ExtendedJoi.object({
    title: ExtendedJoi.string().trim().min(3).max(200).optional(),
    isConfidential: ExtendedJoi.boolean().optional()
  }).min(1),
  searchByMRNSchema: ExtendedJoi.object({
    mrn: ExtendedJoi.custom(validateMRN).required()
  }).options({ abortEarly: false, stripUnknown: true }),
  exportQuerySchema: ExtendedJoi.object({
    format: ExtendedJoi.string().valid('pdf', 'json').default('json'),
    includeDocuments: ExtendedJoi.boolean().default(false)
  })
};
