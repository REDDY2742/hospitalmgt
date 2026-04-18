const medicalRecordService = require('./medicalRecord.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const dateTimeUtil = require('../../utils/dateTime.util');
const { ForbiddenError, BadRequestError } = require('../../utils/appError');
const logger = require('../../utils/logger').createChildLogger('medical-records-controller');
const pdfUtil = require('../../utils/pdf.util');

/**
 * Hospital Medical Records (EHR) Controller
 * 
 * Orchestrates clinical health information lifecycles, forensic PHI access gating,
 * consultation versioning, and secure clinical document management.
 */

// --- 1. Master Medical Record Core ---

/**
 * @description Provisions a master medical record (EHR)
 * @access PRIVATE [ADMIN, RECEPTIONIST]
 * @phi-sensitive true
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const data = await medicalRecordService.createMedicalRecord(patientId, req.body, req.user.id);
    Response.sendCreated(res, data, 'Medical record created successfully');
  } catch (error) { next(error); }
};

/**
 * @description Retrieves shaped medical record with strict clinical role-based sharding
 * @access PRIVATE [DOCTOR, NURSE, PATIENT, ADMIN]
 * @phi-sensitive true
 */
const getMedicalRecord = async (req, res, next) => {
  try {
    const data = await medicalRecordService.getMedicalRecord(req.params.patientId, req.user);
    res.setHeader('X-PHI-Access', 'true');
    res.setHeader('X-Access-Level', data.accessLevel);
    Response.sendSuccess(res, data, 'Medical record retrieved');
  } catch (error) { next(error); }
};

/**
 * @description Lightweight clinical quick-reference summary
 */
const getMedicalSummary = async (req, res, next) => {
  try {
    const data = await medicalRecordService.getMedicalSummary(req.params.patientId);
    res.setHeader('X-Cache-Status', data._cacheStatus || 'MISS');
    Response.sendSuccess(res, data, 'Medical summary retrieved');
  } catch (error) { next(error); }
};

/**
 * @description Validates and searches for patients by MRN format
 */
const searchByMRN = async (req, res, next) => {
  try {
    const { mrn } = req.query;
    if (!/^MRN-\d{4}-\d{6}$/.test(mrn)) {
      return next(new BadRequestError('Logistics Error: Invalid MRN format (Expected MRN-YYYY-XXXXXX)'));
    }
    const data = await medicalRecordService.searchByMRN(mrn);
    Response.sendSuccess(res, data, 'Patient found');
  } catch (error) { next(error); }
};

/**
 * @description Built-in unified patient timeline with cursor-based pagination
 */
const getPatientTimeline = async (req, res, next) => {
  try {
    const { startDate, endDate, cursor, limit = 20 } = req.query;
    if (startDate && endDate) {
      dateTimeUtil.validateDateRange(startDate, endDate, 365); // Max 1yr range
    }
    const data = await medicalRecordService.getPatientTimeline(req.params.patientId, req.query, { cursor, limit });
    Response.sendSuccess(res, data, 'Patient clinical timeline retrieved');
  } catch (error) { next(error); }
};

// --- 2. Consultation Records & Clinical Notes ---

/**
 * @description Registers clinical encounter documentation
 * @security Prevents doctor impersonation by ignoring body.doctorId
 */
const addConsultationRecord = async (req, res, next) => {
  try {
    const data = await medicalRecordService.addConsultationRecord(req.params.patientId, req.body, req.user.id);
    if (data.newConditionDetected) res.setHeader('X-New-Condition-Detected', 'true');
    Response.sendCreated(res, data, 'Consultation record added');
  } catch (error) { next(error); }
};

/**
 * @description Retrieves clinical consultation withauthor-specific note decryption
 */
const getConsultationById = async (req, res, next) => {
  try {
    const data = await medicalRecordService.getConsultationById(req.params.consultationId, req.user);
    res.setHeader('X-PHI-Access', 'true');
    Response.sendSuccess(res, data, 'Consultation details retrieved');
  } catch (error) { next(error); }
};

/**
 * @description Enforces author-only modification and 24h forensics window
 */
const updateConsultationRecord = async (req, res, next) => {
  try {
    const consultation = await medicalRecordService.getConsultationById(req.params.consultationId, req.user);
    if (consultation.doctorId !== req.user.id) {
      throw new ForbiddenError('IdentityError: Only the authoring physician can modify these notes');
    }
    const data = await medicalRecordService.updateConsultationRecord(req.params.consultationId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Consultation updated successfully');
  } catch (error) { next(error); }
};

/**
 * @description Forensic clinical document generation (PDF)
 */
const getConsultationPDF = async (req, res, next) => {
  try {
    const data = await medicalRecordService.getConsultationById(req.params.consultationId, req.user);
    const pdfBuffer = await pdfUtil.generateConsultationPDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="consultation-${req.params.consultationId}.pdf"`);
    res.send(pdfBuffer);
    // Log PHI access done in service.getConsultationById
  } catch (error) { next(error); }
};

// --- 3. Biological Safety & Clinical Triage ---

/**
 * @description Updates biological allergies with real-time drug cross-check alerting
 */
const updateAllergies = async (req, res, next) => {
  try {
    const data = await medicalRecordService.updateAllergies(req.params.patientId, req.body, req.user.id);
    if (data.drugConflictWarnings?.length) res.setHeader('X-Drug-Conflict-Warning', 'true');
    Response.sendSuccess(res, data, 'Allergy profiles updated');
  } catch (error) { next(error); }
};

/**
 * --- 4. Clinical Documents & S3 Vault ---
 */

/**
 * @description Secure clinical document archival with S3 server-side encryption
 */
const uploadMedicalDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new BadRequestError('Infrastructure Error: No clinical file uploaded');
    const data = await medicalRecordService.uploadMedicalDocument(req.params.patientId, {
      ...req.body,
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    }, req.user.id);
    Response.sendCreated(res, data, 'Document archived in secure clinical vault');
  } catch (error) { next(error); }
};

/**
 * @description Generates expiring pre-signed URLs for authorized clinical review
 */
const getDocumentDownloadURL = async (req, res, next) => {
  try {
    const data = await medicalRecordService.getDocumentDownloadURL(req.params.documentId, req.user);
    res.setHeader('X-PHI-Access', 'true');
    Response.sendSuccess(res, data, 'Secure download token generated');
  } catch (error) { next(error); }
};

/**
 * @description Orchestrates massive clinical history exports with Bull-queued resilience
 */
const getMedicalRecordExport = async (req, res, next) => {
  try {
    const { exportFormat } = req.query;
    if (exportFormat === 'pdf') {
       // Complexity estimate logic here or in service
       const result = await medicalRecordService.processLargeExport(req.params.patientId, 'pdf', req.user.id);
       if (result.status === 'QUEUED') return Response.sendAccepted(res, result, 'Large history export protocol initiated. You will be notified via UI alert.');
       
       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('X-PHI-Access', 'true');
       return res.send(result.buffer);
    }
    const data = await medicalRecordService.buildFullExport(req.params.patientId, req.user);
    Response.sendSuccess(res, data, 'Full JSON medical history exported');
  } catch (error) { next(error); }
};

// --- 5. Sovereign Access & Compliance ---

/**
 * @description Provides forensic visibility of PHI access for authorized auditors
 * @access PRIVATE [ADMIN, SUPER_ADMIN]
 */
const getMedicalRecordAuditTrail = async (req, res, next) => {
  try {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenError('SecurityError: Insufficient clearance to view forensic audit trails');
    }
    const pagination = paginationUtil.extractPaginationParams(req.query);
    const data = await medicalRecordService.getMedicalRecordAuditTrail(req.params.patientId, req.query, pagination);
    Response.sendSuccess(res, data, 'Forensic PHI audit trail retrieved');
  } catch (error) { next(error); }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecord,
  getMedicalSummary,
  getMRNByPatientId: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getMRNByPatientId(req.params.patientId), 'MRN retrieved'),
  searchByMRN,
  getPatientTimeline,
  addConsultationRecord,
  getConsultationById,
  getMedicalHistory: async (req, res, next) => {
    const pagination = paginationUtil.extractPaginationParams(req.query);
    const data = await medicalRecordService.getMedicalHistory(req.params.patientId, req.query, pagination);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  updateConsultationRecord,
  addConsultationAddendum,
  getConsultationPDF,
  updateAllergies,
  getAllergies: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getAllergies(req.params.patientId, req.user), 'Allergy list retrieved'),
  updateChronicConditions: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.updateChronicConditions(req.params.patientId, req.body, req.user.id), 'Chronic conditions updated'),
  getChronicConditions: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getChronicConditions(req.params.patientId), 'Chronic conditions retrieved'),
  addSurgicalHistory: async (req, res, next) => Response.sendCreated(res, await medicalRecordService.addSurgicalHistory(req.params.patientId, req.body, req.user.id), 'Surgical history registered'),
  getSurgicalHistory: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getSurgicalHistory(req.params.patientId), 'Surgical history retrieved'),
  addVaccinationRecord: async (req, res, next) => Response.sendCreated(res, await medicalRecordService.addVaccinationRecord(req.params.patientId, req.body, req.user.id), 'Immunization registered'),
  getVaccinationHistory: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getVaccinationHistory(req.params.patientId), 'Vaccination history retrieved'),
  updateFamilyHistory: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.updateFamilyHistory(req.params.patientId, req.body, req.user.id), 'Family history updated'),
  updateSocialHistory: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.updateSocialHistory(req.params.patientId, req.body, req.user.id), 'Social history updated'),
  uploadMedicalDocument,
  getPatientDocuments: async (req, res, next) => {
    const pagination = paginationUtil.extractPaginationParams(req.query);
    const data = await medicalRecordService.getPatientDocuments(req.params.patientId, req.query, pagination, req.user);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getDocumentById: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getDocumentById(req.params.documentId, req.user), 'Document metadata retrieved'),
  getDocumentDownloadURL,
  deleteDocument: async (req, res, next) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') throw new ForbiddenError('ArchivalError: Only administrative leads can archive clinical documents');
    await medicalRecordService.deleteDocument(req.params.documentId, req.user.id);
    Response.sendSuccess(res, null, 'Document archived successfully');
  },
  updateDocumentMetadata: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.updateDocumentMetadata(req.params.documentId, req.body, req.user.id), 'Metadata updated'),
  getMedicalRecordExport,
  grantRecordAccess: async (req, res, next) => Response.sendCreated(res, await medicalRecordService.grantRecordAccess(req.params.patientId, req.body, req.user.id), 'Record access granted'),
  revokeRecordAccess: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.revokeRecordAccess(req.params.patientId, req.params.grantId, req.user.id), 'Record access revoked'),
  getAccessGrants: async (req, res, next) => Response.sendSuccess(res, await medicalRecordService.getAccessGrants(req.params.patientId, req.user), 'Access grants retrieved'),
  getMedicalRecordAuditTrail
};
