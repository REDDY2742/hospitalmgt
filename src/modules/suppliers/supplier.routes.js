const express = require('express');
const router = express.Router();
const supplierController = require('./supplier.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadInventoryDoc: uploadMiddleware } = require('../../middleware/upload.middleware');

const {
  createSupplierSchema,
  updateSupplierSchema,
  addCatalogItemsSchema,
  recordPaymentSchema
} = require('./supplier.validator');

/**
 * Hospital Procurement & Supplier API Gateway
 * Base Path: /api/v1/suppliers
 * 
 * Orchestrates vendor lifecycle, pharmaceutical-grade cataloging, 
 * and financial payout audit trails for the supply chain.
 */

router.use(authenticate); // Global requirement for all procurement routes

// --- 1. Supplier Lifecycle Management ---

router.post('/', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  validate({ body: createSupplierSchema }), 
  auditMiddleware, 
  supplierController.createSupplier
);

router.get('/', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.listSuppliers
);

router.get('/search', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.searchSuppliers
);

router.get('/top-by-volume', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getTopSuppliersByVolume
);

router.get('/payables/overdue', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getOverduePayments
);

router.get('/payables/summary', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getAllSupplierPayablesSummary
);

router.get('/:supplierId', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.getSupplierById
);

router.put('/:supplierId', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  validate({ body: updateSupplierSchema }), 
  auditMiddleware, 
  supplierController.updateSupplier
);

router.post('/:supplierId/deactivate', authorize('ADMIN'), supplierController.deactivateSupplier);
router.post('/:supplierId/blacklist', authorize('ADMIN'), auditMiddleware, supplierController.blacklistSupplier);

// --- 2. Regulatory Documentary Archival ---

router.post('/:supplierId/documents', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  uploadMiddleware, 
  supplierController.uploadSupplierDocument
);

router.get('/:supplierId/documents', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.getSupplierDocuments
);

router.delete('/:supplierId/documents/:docId', 
  authorize('ADMIN'), 
  supplierController.deleteSupplierDocument
);

// --- 3. Procurement Catalog & Performance ---

router.post('/:supplierId/catalog', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  validate({ body: addCatalogItemsSchema }), 
  supplierController.addSupplierCatalog
);

router.get('/:supplierId/catalog', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  supplierController.getSupplierCatalog
);

router.get('/catalog/item/:itemId', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  supplierController.getApprovedSuppliersForItem
);

router.get('/:supplierId/performance', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  supplierController.getSupplierPerformance
);

router.get('/:supplierId/scorecard', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.getSupplierScorecard
);

// --- 4. Financial Status & Payouts ---

router.get('/:supplierId/transactions', 
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']), 
  supplierController.getSupplierTransactionHistory
);

router.get('/:supplierId/payables', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getSupplierPayables
);

router.post('/:supplierId/payments', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  validate({ body: recordPaymentSchema }), 
  auditMiddleware, 
  supplierController.recordSupplierPayment
);

router.get('/:supplierId/payments', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getPaymentHistory
);

// --- 5. Executive Reports ---

router.get('/reports/summary', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.getSupplierReport
);

router.get('/reports/export', 
  authorize(['ADMIN', 'ACCOUNTANT']), 
  supplierController.exportSupplierList
);

module.exports = router;
