const supplierService = require('./supplier.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const dateTimeUtil = require('../../utils/dateTime.util');
const AppError = require('../../utils/appError');

/**
 * Hospital Procurement & Supplier Management Controller
 * 
 * Orchestrates vendor relationships, supply chain metrics, and 
 * regulatory documentation for clinical procurement workflows.
 */

/**
 * --- Supplier Identity & CRUD ---
 */

/**
 * @description Onboards a new clinical/pharmaceutical vendor
 * @access PRIVATE [ADMIN, PROCUREMENT_MANAGER]
 */
const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body, req.user);
    Response.sendCreated(res, supplier, 'Supplier profile initiated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieves full vendor profile including business volume stats
 */
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.supplierId);
    Response.sendSuccess(res, supplier, 'Supplier profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Places a vendor on the restricted list to prevent further PO generation
 * @access PRIVATE [ADMIN ONLY]
 */
const blacklistSupplier = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return next(new AppError('Forbidden: Only Administrators can blacklist vendors', 403));
    if (!req.body.reason) return next(new AppError('Missing field: Blacklist reason is mandatory', 400));
    
    const result = await supplierService.blacklistSupplier(req.params.supplierId, req.body.reason, req.user);
    Response.sendSuccess(res, result, 'Vendor restricted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Catalog & Sourcing Intelligence ---
 */

/**
 * @description Identifies compliant suppliers for a specific clinical asset or consumable
 */
const getApprovedSuppliersForItem = async (req, res, next) => {
  try {
    const { itemId } = req.query;
    if (!itemId || !/^[0-9a-fA-F-]{36}$/.test(itemId)) {
      return next(new AppError('Invalid Request: UUID itemId is required', 400));
    }
    const suppliers = await supplierService.getApprovedSupplierList(itemId);
    Response.sendSuccess(res, suppliers, 'Qualified supplier matrix retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Performance & Payables ---
 */

/**
 * @description Aggregates vendor reliability metrics (Lead-time/Fulfillment/Quality)
 */
const getSupplierPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!dateTimeUtil.isValidRange(startDate, endDate)) {
      return next(new AppError('Invalid date range for performance analysis', 400));
    }
    const performance = await supplierService.getSupplierPerformance(req.params.supplierId, { startDate, endDate });
    Response.sendSuccess(res, performance, 'Supplier performance scorecard generated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Provides a hospital-wide summary of outstanding vendor liabilities
 * @access PRIVATE [ADMIN, ACCOUNTANT]
 */
const getAllSupplierPayablesSummary = async (req, res, next) => {
  try {
    if (!['ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      return next(new AppError('Forbidden: Financial summary restricted to Accountants and Admins', 403));
    }
    const summary = await supplierService.getAllPayablesSummary();
    Response.sendSuccess(res, summary, 'Global vendor payables summary retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Document Management ---
 */

/**
 * @description Secure S3 archival of Trade Licenses, GST Certificates, and NDAs
 */
const uploadSupplierDocument = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No document provided for upload', 400));
    const result = await supplierService.archiveDocument(req.params.supplierId, req.file, req.body.documentType, req.user);
    Response.sendSuccess(res, result, 'Regulatory document archived successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupplier,
  getSupplierById,
  updateSupplier: async (req, res, next) => Response.sendSuccess(res, await supplierService.updateSupplier(req.params.supplierId, req.body, req.user)),
  deactivateSupplier: async (req, res, next) => Response.sendSuccess(res, await supplierService.deactivateSupplier(req.params.supplierId, req.user)),
  reactivateSupplier: async (req, res, next) => Response.sendSuccess(res, await supplierService.reactivateSupplier(req.params.supplierId, req.user)),
  listSuppliers: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await supplierService.getAllSuppliers(req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  searchSuppliers: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await supplierService.searchSuppliers(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  blacklistSupplier,
  removeFromBlacklist: async (req, res, next) => Response.sendSuccess(res, await supplierService.restoreSupplier(req.params.supplierId, req.user)),
  uploadSupplierDocument,
  getSupplierDocuments: async (req, res, next) => Response.sendSuccess(res, await supplierService.getDocuments(req.params.supplierId)),
  deleteSupplierDocument: async (req, res, next) => Response.sendSuccess(res, await supplierService.deleteDocument(req.params.docId, req.user)),
  addSupplierCatalog: async (req, res, next) => Response.sendSuccess(res, await supplierService.addCatalogItems(req.params.supplierId, req.body.items, req.user)),
  updateCatalogItem: async (req, res, next) => Response.sendSuccess(res, await supplierService.updateCatalogItem(req.params.supplierId, req.params.itemId, req.body, req.user)),
  removeCatalogItem: async (req, res, next) => Response.sendSuccess(res, await supplierService.removeCatalogItem(req.params.supplierId, req.params.itemId, req.user)),
  getSupplierCatalog: async (req, res, next) => Response.sendSuccess(res, await supplierService.getCatalog(req.params.supplierId)),
  getApprovedSuppliersForItem,
  getSupplierPerformance,
  getSupplierScorecard: async (req, res, next) => Response.sendSuccess(res, await supplierService.getScorecard(req.params.supplierId)),
  getSupplierTransactionHistory: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await supplierService.getTransactions(req.params.supplierId, req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getSupplierPayables: async (req, res, next) => Response.sendSuccess(res, await supplierService.getSupplierPayables(req.params.supplierId, req.query)),
  getAllSupplierPayablesSummary,
  getTopSuppliersByVolume: async (req, res, next) => Response.sendSuccess(res, await supplierService.getTopSuppliers(req.query.limit)),
  recordSupplierPayment: async (req, res, next) => Response.sendSuccess(res, await supplierService.recordPayment(req.body, req.user)),
  getPaymentHistory: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await supplierService.getPayments(req.params.supplierId, req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getOverduePayments: async (req, res, next) => Response.sendSuccess(res, await supplierService.getOverdue(req.query)),
  getSupplierReport: async (req, res, next) => Response.sendSuccess(res, await supplierService.generateReport(req.params.supplierId, req.query)),
  exportSupplierList: async (req, res, next) => {
    const { buffer, filename } = await supplierService.exportSuppliers(req.query);
    Response.sendFileResponse(res, buffer, filename, 'text/csv');
  }
};
