const pharmacyService = require('./pharmacy.service');
const Response = require('../../utils/response.util');
const { getPagination } = require('../../utils/pagination.util');
const logger = require('../../utils/logger.util');

/**
 * Pharmacy & Inventory Controller
 */

const logEntry = (req, method) => {
  logger.debug(`[PharmacyController] Entering ${method} | ReqID: ${req.requestId || 'N/A'}`);
};

/**
 * Medicine Management
 */

/** @description Register a new medicine in the master list */
const addMedicine = async (req, res, next) => {
  logEntry(req, 'addMedicine');
  try {
    const data = await pharmacyService.addMedicine(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Medicine added to master record', 201);
  } catch (error) {
    next(error);
  }
};

/** @description Get detailed medicine information */
const getMedicineById = async (req, res, next) => {
  logEntry(req, 'getMedicineById');
  try {
    const data = await pharmacyService.getMedicineById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Update medicine master data */
const updateMedicine = async (req, res, next) => {
  logEntry(req, 'updateMedicine');
  try {
    const data = await pharmacyService.updateMedicine(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Medicine record updated');
  } catch (error) {
    next(error);
  }
};

/** @description Deactivate medicine (Soft Delete) */
const deactivateMedicine = async (req, res, next) => {
  logEntry(req, 'deactivateMedicine');
  try {
    await pharmacyService.deactivateMedicine(req.params.id, req.user.id);
    Response.sendSuccess(res, null, 'Medicine deactivated from inventory');
  } catch (error) {
    next(error);
  }
};

/** @description List medicines with filters and pagination */
const listMedicines = async (req, res, next) => {
  logEntry(req, 'listMedicines');
  try {
    const pagination = getPagination(req.query);
    const data = await pharmacyService.listMedicines(req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Full-text search for medicines */
const searchMedicine = async (req, res, next) => {
  logEntry(req, 'searchMedicine');
  try {
    const data = await pharmacyService.searchMedicine(req.query.q, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Upload medical product imagery */
const uploadMedicineImage = async (req, res, next) => {
  logEntry(req, 'uploadMedicineImage');
  try {
    const data = await pharmacyService.uploadMedicineImage(req.params.id, req.file);
    Response.sendSuccess(res, data, 'Image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Stock & Inventory
 */

/** @description Get aggregated stock across all batches */
const getMedicineStock = async (req, res, next) => {
  logEntry(req, 'getMedicineStock');
  try {
    const data = await pharmacyService.getMedicineStock(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Manual inventory adjustment with audit reason */
const updateStockManually = async (req, res, next) => {
  logEntry(req, 'updateStockManually');
  try {
    const data = await pharmacyService.updateStockManually(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Manual adjustment recorded');
  } catch (error) {
    next(error);
  }
};

/** @description List medicines below reorder safety levels */
const getLowStockAlerts = async (req, res, next) => {
  logEntry(req, 'getLowStockAlerts');
  try {
    const data = await pharmacyService.checkLowStockMedicines();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description List medicines expiring soon */
const getExpiringMedicines = async (req, res, next) => {
  logEntry(req, 'getExpiringMedicines');
  try {
    const data = await pharmacyService.checkExpiringMedicines(req.query.days);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Process received purchase order items */
const receivePurchaseOrder = async (req, res, next) => {
  logEntry(req, 'receivePurchaseOrder');
  try {
    const data = await pharmacyService.receivePurchaseOrder(req.params.poId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Purchase items added to inventory');
  } catch (error) {
    next(error);
  }
};

/**
 * Prescription & Dispensing
 */

/** @description Generate a new medical prescription */
const createPrescription = async (req, res, next) => {
  logEntry(req, 'createPrescription');
  try {
    const data = await pharmacyService.createPrescription(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Prescription issued', 201);
  } catch (error) {
    next(error);
  }
};

/** @description Get prescription by ID */
const getPrescriptionById = async (req, res, next) => {
  logEntry(req, 'getPrescriptionById');
  try {
    const data = await pharmacyService.getPrescriptionById(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Dispense and bill medication against prescription */
const dispensePrescription = async (req, res, next) => {
  logEntry(req, 'dispensePrescription');
  try {
    const data = await pharmacyService.dispensePrescription(req.params.id, req.user.id);
    Response.sendSuccess(res, data, 'Medication dispensed successfully');
  } catch (error) {
    next(error);
  }
};

/** @description List patient prescription history */
const getPrescriptionsByPatient = async (req, res, next) => {
  logEntry(req, 'getPrescriptionsByPatient');
  try {
    const data = await pharmacyService.getPrescriptionsByPatient(req.params.patientId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description List prescriptions issued by doctor */
const getPrescriptionsByDoctor = async (req, res, next) => {
  logEntry(req, 'getPrescriptionsByDoctor');
  try {
    const data = await pharmacyService.getPrescriptionsByDoctor(req.user.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Process returned medication and refund */
const returnMedicine = async (req, res, next) => {
  logEntry(req, 'returnMedicine');
  try {
    const data = await pharmacyService.returnMedicine(req.params.dispenseId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Medication returned to inventory');
  } catch (error) {
    next(error);
  }
};

/** @description Stream prescription PDF from secure storage */
const getPrescriptionPDF = async (req, res, next) => {
  logEntry(req, 'getPrescriptionPDF');
  try {
    const stream = await pharmacyService.getPrescriptionPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prescription-${req.params.id}.pdf`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Batches
 */

/** @description Get all active batches for a medicine */
const getMedicineBatches = async (req, res, next) => {
  logEntry(req, 'getMedicineBatches');
  try {
    const data = await pharmacyService.getMedicineBatches(req.params.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Create a new inventory batch manually */
const addMedicineBatch = async (req, res, next) => {
  logEntry(req, 'addMedicineBatch');
  try {
    const data = await pharmacyService.addMedicineBatch(req.params.id, req.body, req.user.id);
    Response.sendSuccess(res, data, 'New batch added', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Drug Interaction
 */

/** @description Perform real-time drug-drug interaction check */
const checkDrugInteraction = async (req, res, next) => {
  logEntry(req, 'checkDrugInteraction');
  try {
    const data = await pharmacyService.checkDrugInteraction(req.body.medicationIds);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * Reports & Dashboard
 */

/** @description Get pharmaceutical consumption analytics */
const getConsumptionReport = async (req, res, next) => {
  logEntry(req, 'getConsumptionReport');
  try {
    const data = await pharmacyService.getMedicineConsumptionReport(req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Get pharmacy operational status dashboard */
const getPharmacyDashboard = async (req, res, next) => {
  logEntry(req, 'getPharmacyDashboard');
  try {
    const data = await pharmacyService.getPharmacyDashboardStats();
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/** @description Generate full inventory export as PDF/Excel */
const exportInventoryReport = async (req, res, next) => {
  logEntry(req, 'exportInventoryReport');
  try {
    // Implementation placeholder for PDF/Excel generation
    const data = await pharmacyService.exportInventory(req.query.format);
    res.send(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMedicine,
  getMedicineById,
  updateMedicine,
  deactivateMedicine,
  listMedicines,
  searchMedicine,
  uploadMedicineImage,
  getMedicineStock,
  updateStockManually,
  getLowStockAlerts,
  getExpiringMedicines,
  receivePurchaseOrder,
  createPrescription,
  getPrescriptionById,
  dispensePrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  returnMedicine,
  getPrescriptionPDF,
  getMedicineBatches,
  addMedicineBatch,
  checkDrugInteraction,
  getConsumptionReport,
  getPharmacyDashboard,
  exportInventoryReport
};
