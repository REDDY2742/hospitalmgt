const labService = require('./lab.service');
const Response = require('../../utils/response.util');
const { getPagination } = require('../../utils/pagination.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Laboratory & Diagnostics Controller
 * 
 * Orchestrates clinical diagnostic workflows, sample logistics, 
 * and pathologist verifications.
 */

// Helper: Extract domain-specific filters for Lab
const extractLabFilters = (query) => {
  const { status, urgency, category, doctorId, patientId, departmentId, dateRange } = query;
  return { status, urgency, category, doctorId, patientId, departmentId, dateRange };
};

/**
 * --- Test Master Management ---
 */

/**
 * @description Add new lab test to hospital master catalog
 * @access PRIVATE [ADMIN, LAB_TECHNICIAN]
 */
const addLabTest = async (req, res, next) => {
  try {
    const data = await labService.addTestToMaster(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Lab test added to catalog', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get detailed metadata of a specific lab test
 * @access PRIVATE [ALL STAFF]
 */
const getLabTestById = async (req, res, next) => {
  try {
    const data = await labService.getTestById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update lab test parameters (cost, TAT, ref ranges)
 * @access PRIVATE [ADMIN, LAB_TECHNICIAN]
 */
const updateLabTest = async (req, res, next) => {
  try {
    const data = await labService.updateTestMaster(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Lab test updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Soft-delete a lab test from active service
 * @access PRIVATE [ADMIN]
 */
const deactivateLabTest = async (req, res, next) => {
  try {
    await labService.deactivateTest(req.params.id, req.user.id);
    Response.sendSuccess(res, null, 'Lab test deactivated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description List the searchable lab test catalog
 * @access PRIVATE [ALL STAFF]
 */
const getLabTestCatalog = async (req, res, next) => {
  try {
    const filters = extractLabFilters(req.query);
    const data = await labService.getLabTestCatalog(filters);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Add demographic-aware reference ranges to a test
 * @access PRIVATE [LAB_TECHNICIAN, PATHOLOGIST]
 */
const addReferenceRanges = async (req, res, next) => {
  try {
    const data = await labService.updateReferenceRanges(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Reference ranges updated');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Order Management ---
 */

/**
 * @description Create a new lab diagnostic order
 * @access PRIVATE [DOCTOR]
 */
const createLabOrder = async (req, res, next) => {
  try {
    const data = await labService.createLabTestOrder(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Lab order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve full context of a lab order
 * @access PRIVATE [DOCTOR, LAB_TECHNICIAN, PATIENT]
 */
const getLabOrderById = async (req, res, next) => {
  try {
    const data = await labService.getOrderById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Modify order details before sample collection
 * @access PRIVATE [DOCTOR]
 */
const updateLabOrder = async (req, res, next) => {
  try {
    const data = await labService.updateLabOrder(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Lab order updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Cancel a lab order with clinical justification
 * @access PRIVATE [DOCTOR, ADMIN]
 */
const cancelLabOrder = async (req, res, next) => {
  try {
    await labService.cancelOrder(req.params.id, req.body.reason, req.user.id);
    Response.sendSuccess(res, null, 'Lab order cancelled');
  } catch (error) {
    next(error);
  }
};

/**
 * @description List diagnostic orders with clinical filters
 * @access PRIVATE [LAB_TECHNICIAN, ADMIN]
 */
const listLabOrders = async (req, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const filters = extractLabFilters(req.query);
    const data = await labService.listOrders(filters, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get all orders for a specific patient
 * @access PRIVATE [DOCTOR, PATIENT]
 */
const getOrdersByPatient = async (req, res, next) => {
  try {
    const data = await labService.getOrdersByPatient(req.params.patientId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Assign technician to an active lab order
 * @access PRIVATE [ADMIN, LAB_TECHNICIAN_SENIOR]
 */
const assignLabTechnician = async (req, res, next) => {
  try {
    const data = await labService.assignTechnician(req.params.id, req.body.technicianId);
    Response.sendSuccess(res, data, 'Technician assigned');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve current operational workload for lab staff
 * @access PRIVATE [LAB_TECHNICIAN]
 */
const getLabWorkload = async (req, res, next) => {
  try {
    const data = await labService.getLabWorkload(req.query.date, req.user.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Sample Management ---
 */

/**
 * @description Record phlebotomy/sample collection event
 * @access PRIVATE [LAB_TECHNICIAN, NURSE]
 */
const collectSample = async (req, res, next) => {
  try {
    const data = await labService.collectSample(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Sample collection recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update clinical condition of a collected sample
 * @access PRIVATE [LAB_TECHNICIAN]
 */
const updateSampleCondition = async (req, res, next) => {
  try {
    const data = await labService.updateSampleCondition(req.params.id, req.body);
    Response.sendSuccess(res, data, 'Sample condition updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Reject sample due to clinical compromise (e.g., Hemolysis)
 * @access PRIVATE [LAB_TECHNICIAN]
 */
const rejectSample = async (req, res, next) => {
  try {
    const data = await labService.rejectSample(req.params.id, req.body.reason, req.user.id);
    Response.sendSuccess(res, data, 'Sample rejected - Re-collection triggered');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Result Management ---
 */

/**
 * @description Input clinical results for diagnostic tests
 * @access PRIVATE [LAB_TECHNICIAN]
 */
const enterLabResults = async (req, res, next) => {
  try {
    const data = await labService.enterLabResults(req.params.id, req.body.results, req.user.id);
    Response.sendSuccess(res, data, 'Results entered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update results before formal pathologist verification
 * @access PRIVATE [LAB_TECHNICIAN]
 */
const updateLabResults = async (req, res, next) => {
  try {
    const data = await labService.updateLabResults(req.params.id, req.body.results, req.user.id);
    Response.sendSuccess(res, data, 'Results updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Pathologist sign-off/verification of results
 * @access PRIVATE [PATHOLOGIST, ADMIN]
 */
const verifyLabResults = async (req, res, next) => {
  try {
    const data = await labService.verifyLabResults(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Results verified and report generated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve diagnostic results (Role-filtered)
 * @access PRIVATE [DOCTOR, PATIENT]
 */
const getLabResults = async (req, res, next) => {
  try {
    const data = await labService.getLabResults(req.params.id, req.user.role);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Stream diagnostic report PDF from secure storage
 * @access PRIVATE [DOCTOR, PATIENT]
 */
const getLabResultPDF = async (req, res, next) => {
  try {
    const stream = await labService.getReportPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.id}.pdf`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Add post-verification clinical addendum
 * @access PRIVATE [PATHOLOGIST]
 */
const addResultAddendum = async (req, res, next) => {
  try {
    const data = await labService.addResultAddendum(req.params.id, req.body.note, req.user.id);
    Response.sendSuccess(res, data, 'Clinical addendum added');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Dashboard & Reporting ---
 */

/**
 * @description Global lab operational stats
 * @access PRIVATE [ADMIN, LAB_TECHNICIAN]
 */
const getLabDashboard = async (req, res, next) => {
  try {
    const data = await labService.getLabDashboardStats();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Turnaround Time (TAT) analytics
 * @access PRIVATE [ADMIN]
 */
const getTATReport = async (req, res, next) => {
  try {
    const data = await labService.getTATReport(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Detailed workload analytics report
 * @access PRIVATE [ADMIN]
 */
const getWorkloadReport = async (req, res, next) => {
  try {
    const data = await labService.getWorkloadReport(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Security log of critical/panic values intercepted
 * @access PRIVATE [ADMIN, CHIEF_MEDICAL_OFFICER]
 */
const getCriticalValuesLog = async (req, res, next) => {
  try {
    logger.info(`[SECURITY_AUDIT] Critical Values Log accessed by ${req.user.id}`);
    const data = await labService.getCriticalValuesLog(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addLabTest,
  getLabTestById,
  updateLabTest,
  deactivateLabTest,
  getLabTestCatalog,
  addReferenceRanges,
  createLabOrder,
  getLabOrderById,
  updateLabOrder,
  cancelLabOrder,
  listLabOrders,
  getOrdersByPatient,
  assignLabTechnician,
  getLabWorkload,
  collectSample,
  updateSampleCondition,
  rejectSample,
  enterLabResults,
  updateLabResults,
  verifyLabResults,
  getLabResults,
  getLabResultPDF,
  addResultAddendum,
  getLabDashboard,
  getTATReport,
  getWorkloadReport,
  getCriticalValuesLog
};
