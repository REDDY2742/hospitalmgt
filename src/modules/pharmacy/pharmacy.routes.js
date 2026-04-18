const express = require('express');
const router = express.Router();
const pharmacyController = require('./pharmacy.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail } = require('../../middleware/audit.middleware');
const { uploadMedicalDocument } = require('../../middleware/upload.middleware');
const {
  addMedicineSchema,
  addBatchSchema,
  adjustStockSchema,
  receivePOSchema,
  createPrescriptionSchema,
  checkInteractionSchema
} = require('./pharmacy.validator');

/**
 * Pharmacy & Inventory Gateway
 * Base Path: /api/v1/pharmacy
 */

// --- Medicine Master Management ---

router.post('/medicines',
  authenticate,
  authorize('pharmacy:create_medicine'),
  validate({ body: addMedicineSchema }),
  auditTrail,
  pharmacyController.addMedicine
);

router.get('/medicines',
  authenticate,
  authorize('pharmacy:read_medicine_list'),
  pharmacyController.listMedicines
);

router.get('/medicines/search',
  authenticate,
  authorize('pharmacy:search_medicine'),
  pharmacyController.searchMedicine
);

router.get('/medicines/low-stock',
  authenticate,
  authorize('pharmacy:read_low_stock'),
  pharmacyController.getLowStockAlerts
);

router.get('/medicines/expiring',
  authenticate,
  authorize('pharmacy:read_expiring'),
  pharmacyController.getExpiringMedicines
);

router.get('/medicines/:medicineId',
  authenticate,
  authorize('pharmacy:read_medicine'),
  pharmacyController.getMedicineById
);

router.put('/medicines/:medicineId',
  authenticate,
  authorize('pharmacy:update_medicine'),
  auditTrail,
  pharmacyController.updateMedicine
);

router.delete('/medicines/:medicineId',
  authenticate,
  authorize('pharmacy:delete_medicine'),
  auditTrail,
  pharmacyController.deactivateMedicine
);

router.post('/medicines/:medicineId/image',
  authenticate,
  authorize('pharmacy:upload_image'),
  uploadMedicalDocument, // Reusing medical document uploader for consistency
  pharmacyController.uploadMedicineImage
);

router.get('/medicines/:medicineId/batches',
  authenticate,
  authorize('pharmacy:read_batches'),
  pharmacyController.getMedicineBatches
);

router.post('/medicines/:medicineId/batches',
  authenticate,
  authorize('pharmacy:create_batch'),
  validate({ body: addBatchSchema }),
  auditTrail,
  pharmacyController.addMedicineBatch
);

router.post('/medicines/check-interaction',
  authenticate,
  authorize('pharmacy:check_interaction'),
  validate({ body: checkInteractionSchema }),
  pharmacyController.checkDrugInteraction
);

// --- Stock & Supply Chain ---

router.put('/stock/:medicineId/adjust',
  authenticate,
  authorize('pharmacy:adjust_stock'),
  validate({ body: adjustStockSchema }),
  auditTrail,
  pharmacyController.updateStockManually
);

router.post('/stock/receive-po',
  authenticate,
  authorize('pharmacy:receive_po'),
  validate({ body: receivePOSchema }),
  auditTrail,
  pharmacyController.receivePurchaseOrder
);

// --- Prescription & Dispensing ---

router.post('/prescriptions',
  authenticate,
  authorize('prescriptions:create'),
  validate({ body: createPrescriptionSchema }),
  auditTrail,
  pharmacyController.createPrescription
);

router.get('/prescriptions/:id',
  authenticate,
  authorize('prescriptions:read'),
  pharmacyController.getPrescriptionById
);

router.get('/prescriptions/:id/pdf',
  authenticate,
  authorize('prescriptions:read_pdf'),
  pharmacyController.getPrescriptionPDF
);

router.get('/prescriptions/patient/:patientId',
  authenticate,
  authorize('prescriptions:read_by_patient'),
  pharmacyController.getPrescriptionsByPatient
);

router.get('/prescriptions/doctor/:doctorId',
  authenticate,
  authorize('prescriptions:read_by_doctor'),
  pharmacyController.getPrescriptionsByDoctor
);

router.post('/prescriptions/:id/dispense',
  authenticate,
  authorize('pharmacy:dispense'),
  auditTrail,
  pharmacyController.dispensePrescription
);

router.post('/prescriptions/:id/return',
  authenticate,
  authorize('pharmacy:return'),
  auditTrail,
  pharmacyController.returnMedicine
);

// --- Analytical Reports ---

router.get('/reports/consumption',
  authenticate,
  authorize('pharmacy:read_consumption'),
  pharmacyController.getConsumptionReport
);

router.get('/reports/dashboard',
  authenticate,
  authorize('pharmacy:read_dashboard'),
  pharmacyController.getPharmacyDashboard
);

router.get('/reports/inventory/export',
  authenticate,
  authorize('pharmacy:export_inventory'),
  pharmacyController.exportInventoryReport
);

module.exports = router;
