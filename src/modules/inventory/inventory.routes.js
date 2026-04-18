const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { 
  uploadInventoryDoc 
} = require('../../middleware/upload.middleware');
const { amountThresholdCheck } = require('../../middleware/inventory.middleware');

const { 
  addInventoryItemSchema, 
  issueStockSchema, 
  raisePRSchema, 
  receiveGRNSchema, 
  adjustStockSchema, 
  purchaseOrderSchema 
} = require('./inventory.validator');

/**
 * Hospital Inventory & Supply Chain API Gateway
 * Base Path: /api/v1/inventory
 * 
 * Secure procurement lifecycle from PR/PO orchestration to stock issuance and GRN.
 */

// --- 1. Item Management ---

router.post('/items',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate({ body: addInventoryItemSchema }),
  inventoryController.addInventoryItem
);

router.get('/items',
  authenticate,
  inventoryController.listInventoryItems
);

router.get('/items/search',
  authenticate,
  inventoryController.searchInventoryItems
);

router.get('/items/low-stock',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.getLowStockAlerts
);

router.get('/items/valuation',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
  inventoryController.getInventoryValuation
);

router.get('/items/:id',
  authenticate,
  inventoryController.getInventoryItemById
);

router.post('/items/:id/spec-sheet',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  uploadInventoryDoc.single('specSheet'),
  inventoryController.uploadItemSpecSheet
);

// --- 2. Stock Operations ---

router.post('/stock/issue',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'DEPT_HOD']),
  validate({ body: issueStockSchema }),
  auditMiddleware, // Medico-legal tracking of stock movement
  inventoryController.issueStock
);

router.post('/stock/return',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  auditMiddleware,
  inventoryController.returnStock
);

router.post('/stock/adjust',
  authenticate,
  authorize('ADMIN'),
  validate({ body: adjustStockSchema }),
  auditMiddleware,
  inventoryController.adjustStock
);

router.post('/stock/audit',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.conductStockAudit
);

// --- 3. Purchase Requests (PR) ---

router.post('/purchase-requests',
  authenticate,
  validate({ body: raisePRSchema }),
  inventoryController.raisePurchaseRequest
);

router.get('/purchase-requests',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']),
  inventoryController.listPurchaseRequests
);

router.get('/purchase-requests/:id',
  authenticate,
  // Custom ownership logic in controller
  inventoryController.getPurchaseRequestById
);

router.put('/purchase-requests/:id/approve',
  authenticate,
  authorize(['ADMIN', 'HOD']),
  amountThresholdCheck, // Layer 2 security: Verifies HOD limit vs PR amount
  inventoryController.approvePurchaseRequest
);

router.put('/purchase-requests/:id/reject',
  authenticate,
  authorize(['ADMIN', 'HOD']),
  inventoryController.rejectPurchaseRequest
);

// --- 4. Purchase Orders (PO) ---

router.post('/purchase-orders',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate({ body: purchaseOrderSchema }),
  inventoryController.createPurchaseOrder
);

router.get('/purchase-orders',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']),
  inventoryController.listPurchaseOrders
);

router.get('/purchase-orders/:id/pdf',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.getPurchaseOrderPDF
);

router.post('/purchase-orders/:id/send',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.sendPOToVendor
);

// --- 5. GRN (Goods Receipt) ---

router.post('/grn',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  validate({ body: receiveGRNSchema }),
  auditMiddleware, // Accountability for vendor receiving
  inventoryController.receiveInventory
);

router.get('/grn',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']),
  inventoryController.listGRNs
);

// --- 6. Analytics & Reports ---

router.get('/dashboard',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.getInventoryDashboard
);

router.get('/reports/consumption',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER']),
  inventoryController.getConsumptionReport
);

router.get('/reports/dead-stock',
  authenticate,
  authorize(['ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT']),
  inventoryController.getDeadStockReport
);

module.exports = router;
