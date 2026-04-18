const patientService = require('./patient.service');
const Response = require('../../utils/response.util');
const { getPagination } = require('../../utils/pagination.util');
const logger = require('../../utils/logger.util');

/**
 * Patient Management Controller
 * 
 * Thin layer orchestration for patient clinical data.
 * All business logic is delegated to the PatientService.
 */

/**
 * Log entry trace helper
 */
const logEntry = (req, method) => {
  logger.debug(`[PatientController] Entering ${method} | ReqID: ${req.requestId || 'N/A'}`);
};

/**
 * @desc    Register a new patient
 * @route   POST /api/v1/patients
 * @access  Private (Receptionist/Admin)
 */
const registerPatient = async (req, res, next) => {
  logEntry(req, 'registerPatient');
  try {
    const data = await patientService.registerPatient(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Patient registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get patient profile by ID
 * @route   GET /api/v1/patients/:id
 * @access  Private (Staff/Own)
 */
const getPatientById = async (req, res, next) => {
  logEntry(req, 'getPatientById');
  try {
    const data = await patientService.getPatientById(req.params.id, req.user);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update patient information
 * @route   PUT /api/v1/patients/:id
 */
const updatePatient = async (req, res, next) => {
  logEntry(req, 'updatePatient');
  try {
    const data = await patientService.updatePatient(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Patient information updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete patient record
 * @route   DELETE /api/v1/patients/:id
 * @access  Private (Admin Only)
 */
const deletePatient = async (req, res, next) => {
  logEntry(req, 'deletePatient');
  try {
    await patientService.deletePatient(req.params.id, req.user.id);
    Response.sendSuccess(res, null, 'Patient record deactivated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all patients with pagination and filters
 * @route   GET /api/v1/patients
 */
const listPatients = async (req, res, next) => {
  logEntry(req, 'listPatients');
  try {
    const pagination = getPagination(req.query);
    const data = await patientService.listPatients(req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search patients by query
 * @route   GET /api/v1/patients/search
 */
const searchPatients = async (req, res, next) => {
  logEntry(req, 'searchPatients');
  try {
    const pagination = getPagination(req.query);
    const data = await patientService.searchPatients(req.query.q, req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get full medical history
 */
const getPatientMedicalHistory = async (req, res, next) => {
  logEntry(req, 'getPatientMedicalHistory');
  try {
    const data = await patientService.getMedicalHistory(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get vitals time-series data
 */
const getPatientVitals = async (req, res, next) => {
  logEntry(req, 'getPatientVitals');
  try {
    const data = await patientService.getPatientVitals(req.params.id, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add new vitals reading
 */
const addPatientVitals = async (req, res, next) => {
  logEntry(req, 'addPatientVitals');
  try {
    const data = await patientService.addPatientVitals(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Vitals recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admit patient to IPD
 */
const admitPatient = async (req, res, next) => {
  logEntry(req, 'admitPatient');
  try {
    const data = await patientService.admitPatient(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Patient admitted to ward', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Discharge patient from IPD
 */
const dischargePatient = async (req, res, next) => {
  logEntry(req, 'dischargePatient');
  try {
    const data = await patientService.dischargePatient(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Discharge process completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List patient admission history
 */
const getPatientAdmissions = async (req, res, next) => {
  logEntry(req, 'getPatientAdmissions');
  try {
    const data = await patientService.getAdmissions(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List patient appointments
 */
const getPatientAppointments = async (req, res, next) => {
  logEntry(req, 'getPatientAppointments');
  try {
    const data = await patientService.getAppointments(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List patient billing history
 */
const getPatientBills = async (req, res, next) => {
  logEntry(req, 'getPatientBills');
  try {
    const data = await patientService.getBills(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload medical document to patient folder
 */
const uploadPatientDocument = async (req, res, next) => {
  logEntry(req, 'uploadPatientDocument');
  try {
    const data = await patientService.uploadDocument(req.params.id, req.file, req.body.type);
    Response.sendSuccess(res, data, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List patient medical documents
 */
const getPatientDocuments = async (req, res, next) => {
  logEntry(req, 'getPatientDocuments');
  try {
    const data = await patientService.getDocuments(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate printable QR code for patient card
 */
const generatePatientQR = async (req, res, next) => {
  logEntry(req, 'generatePatientQR');
  try {
    const data = await patientService.generateQRCode(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transfer patient between wards/doctors
 */
const transferPatient = async (req, res, next) => {
  logEntry(req, 'transferPatient');
  try {
    const data = await patientService.transferPatient(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Patient transfer completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get statistics for patients under a specific doctor
 */
const getPatientStatsByDoctor = async (req, res, next) => {
  logEntry(req, 'getPatientStatsByDoctor');
  try {
    const data = await patientService.getStatsByDoctor(req.params.doctorId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export full patient medical report as PDF
 */
const exportPatientReport = async (req, res, next) => {
  logEntry(req, 'exportPatientReport');
  try {
    const pdfBuffer = await patientService.exportReport(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=patient-report-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  listPatients,
  searchPatients,
  getPatientMedicalHistory,
  getPatientVitals,
  addPatientVitals,
  admitPatient,
  dischargePatient,
  getPatientAdmissions,
  getPatientAppointments,
  getPatientBills,
  uploadPatientDocument,
  getPatientDocuments,
  generatePatientQR,
  transferPatient,
  getPatientStatsByDoctor,
  exportPatientReport
};
