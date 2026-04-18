const inventoryService = require('./inventory.service');
const Response = require('../../utils/response.util');
const { redis } = require('../../config/redis');
const emailService = require('../../utils/email.util');
const staffService = require('../staff/staff.service');

/**
 * Hospital Inventory & Supply Chain Controller
 * 
 * Orchestrates the procurement, receipt, and issuance of medical consumables, 
 * pharmaceutical stock, and surgical equipment.
 */

/**
 * --- Item Management ---
 */

/**
 * @description Catalog a new inventory item with stock-level thresholds
 * @access PRIVATE [ADMIN, INVENTORY_MANAGER]
 */
const addInventoryItem = async (req, res, next) => {
  try {
    const data = await inventoryService.createItem(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Inventory item cataloged', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Securely retrieve low-stock thresholds (Cached)
 * @access PRIVATE [STAFF]
 */
const getLowStockAlerts = async (req, res, next) => {
  try {
    const cacheKey = 'inventory:low_stock';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return Response.sendSuccess(res, JSON.parse(cached), 'Cached low-stock data', 200, { cached: true });
    }

    const data = await inventoryService.getAlerts();
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300); // 5 min cache

    Response.sendSuccess(res, data, 'Real-time low-stock alerts', 200, { cached: false });
  } catch (error) {
    next(error);
  }
};

/**
 * --- Stock Operations ---
 */

/**
 * @description Issue medical stock to specific clinical departments
 * @access PRIVATE [INVENTORY_MANAGER]
 */
const issueStock = async (req, res, next) => {
  try {
    const { departmentId, items } = req.body;
    
    // 1. Structural Verification: Dept existence and user affiliation
    const staff = await staffService.getStaff(req.user.id);
    if (!staff || staff.departmentId !== departmentId && req.user.role !== 'ADMIN') {
       return res.status(403).json({ message: 'Forbidden: You can only issue stock to your authorized department' });
    }

    const data = await inventoryService.processIssuance(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Stock issuance completed');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Trigger a physical-vs-digital stock audit
 * @access PRIVATE [ADMIN, INVENTORY_MANAGER]
 */
const conductStockAudit = async (req, res, next) => {
  try {
    const data = await inventoryService.performAudit(req.body, req.user.id);
    // Logic: Returns diff report immediately (data.discrepancies) 
    Response.sendSuccess(res, data, 'Stock audit completed - Discrepancy report generated');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Procurement Flow ---
 */

/**
 * @description Approve Purchase Request with multi-level threshold logic
 * @access PRIVATE [HOD, ADMIN]
 */
const approvePurchaseRequest = async (req, res, next) => {
  try {
    const request = await inventoryService.getPR(req.params.id);
    
    // Multi-level Approval Gate
    // Rules: HOD < 50k, ADMIN > 50k
    const amountThreshold = 5000000; // 50k in paise
    if (request.estimatedAmount > amountThreshold && req.user.role !== 'ADMIN') {
       return res.status(403).json({ message: 'Forbidden: Purchase requests above ₹50,000 require Administrator approval' });
    }

    const data = await inventoryService.processPR(req.params.id, 'APPROVED', req.user.id);
    Response.sendSuccess(res, data, 'Purchase request approved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Transmit finalized PO to external vendor
 * @access PRIVATE [PURCHASING_OFFICER, ADMIN]
 */
const sendPOToVendor = async (req, res, next) => {
  try {
    const data = await inventoryService.finalizePO(req.params.id);
    
    // Non-blocking Email Transmission
    emailService.sendPOToVendor(data.vendorEmail, data.pdfUrl, data.poNumber).catch(err => {
      logger.error(`PO_EMAIL_FAILURE: PO ${data.poNumber}, Vendor: ${data.vendorEmail}, Error: ${err.message}`);
    });

    Response.sendSuccess(res, data, 'Purchase Order finalized and queued for vendor transmission');
  } catch (error) {
    next(error);
  }
};

/**
 * --- GRN (Goods Receipt) ---
 */

/**
 * @description Record physical receipt of goods against a PO
 * @access PRIVATE [STORE_KEEPER, ADMIN]
 */
const receiveInventory = async (req, res, next) => {
  try {
    const data = await inventoryService.createGRN(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Goods received and inventory updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addInventoryItem,
  getInventoryItemById: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getItem(req.params.id)),
  updateInventoryItem: async (req, res, next) => Response.sendSuccess(res, await inventoryService.updateItem(req.params.id, req.body)),
  deactivateItem: async (req, res, next) => Response.sendSuccess(res, await inventoryService.softDeleteItem(req.params.id)),
  listInventoryItems: async (req, res, next) => Response.sendSuccess(res, await inventoryService.listItems(req.query)),
  searchInventoryItems: async (req, res, next) => Response.sendSuccess(res, await inventoryService.search(req.query.q)),
  getLowStockAlerts,
  getExpiringItems: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getExpiries()),
  getInventoryValuation: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getValuation()),
  uploadItemSpecSheet: async (req, res, next) => Response.sendSuccess(res, await inventoryService.saveSpecSheet(req.params.id, req.file)),
  getStockById: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getStockDetail(req.params.id)),
  getStockByItem,
  issueStock,
  returnStock: async (req, res, next) => Response.sendSuccess(res, await inventoryService.processReturn(req.body)),
  adjustStock: async (req, res, next) => Response.sendSuccess(res, await inventoryService.manualAdjust(req.body, req.user.id)),
  conductStockAudit,
  getStockMovementHistory: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getMovements(req.params.id)),
  getIssuanceHistory: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getIssuances(req.query)),
  raisePurchaseRequest: async (req, res, next) => Response.sendSuccess(res, await inventoryService.createPR(req.body, req.user.id), 'PR raised', 201),
  getPurchaseRequestById: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getPR(req.params.id)),
  listPurchaseRequests: async (req, res, next) => Response.sendSuccess(res, await inventoryService.listPRs(req.query)),
  approvePurchaseRequest,
  rejectPurchaseRequest: async (req, res, next) => Response.sendSuccess(res, await inventoryService.processPR(req.params.id, 'REJECTED', req.user.id, req.body.reason)),
  cancelPurchaseRequest: async (req, res, next) => Response.sendSuccess(res, await inventoryService.abortPR(req.params.id)),
  createPurchaseOrder: async (req, res, next) => Response.sendSuccess(res, await inventoryService.convertPRToPO(req.params.prId, req.user.id)),
  getPurchaseOrderById: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getPO(req.params.id)),
  listPurchaseOrders: async (req, res, next) => Response.sendSuccess(res, await inventoryService.listPOs(req.query)),
  updatePurchaseOrder: async (req, res, next) => Response.sendSuccess(res, await inventoryService.modifyPO(req.params.id, req.body)),
  sendPOToVendor,
  cancelPurchaseOrder: async (req, res, next) => Response.sendSuccess(res, await inventoryService.abortPO(req.params.id)),
  getPurchaseOrderPDF: async (req, res, next) => {
    const stream = await inventoryService.generatePOPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
  },
  receiveInventory,
  getGRNById: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getGRN(req.params.id)),
  listGRNs: async (req, res, next) => Response.sendSuccess(res, await inventoryService.listGRNs(req.query)),
  getGRNDiscrepancyReport: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getDiscrepancies(req.params.id)),
  getInventoryDashboard: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getDashboard()),
  getConsumptionReport: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getConsumption(req.query)),
  getDeadStockReport: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getDeadStock()),
  getPurchaseOrderReport: async (req, res, next) => Response.sendSuccess(res, await inventoryService.getPOAnalytics(req.query)),
  exportInventoryReport: async (req, res, next) => Response.sendSuccess(res, await inventoryService.exportReport(req.query))
};
