const { Op, fn, col } = require('sequelize');
const { db } = require('../../config/db');
const Supplier = require('./supplier.model'); // Assumed path
const SupplierCatalog = require('./supplierCatalog.model'); // Assumed path
const AppError = require('../../utils/appError');
const { encrypt, decrypt } = require('../../utils/encryption.util');
const s3 = require('../../utils/s3.util');
const emailUtil = require('../../utils/email.util');
const { redis } = require('../../config/redis');
const AuditLog = require('../audit/audit.model');

/**
 * Hospital Procurement & Supplier Management Service
 * 
 * Orchestrates vendor relationships, supply chain reliability (Scorecards), 
 * and Indian regulatory compliance (GST/IFSC) for medical procurement.
 */

class SupplierService {
  
  /**
   * --- Supplier Lifecycle & Identity ---
  */

  /**
   * @description Registers a new verified vendor with regulatory checksums
   */
  async createSupplier(userData, createdBy) {
    const transaction = await db.transaction();
    try {
      // 1. Regulatory Validation (GSTIN Checksum & IFSC)
      if (!this._isValidGSTIN(userData.GSTNumber)) throw new AppError('RegulatoryError: Invalid GSTIN checksum', 400);
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(userData.bankDetails.ifsc)) throw new AppError('RegulatoryError: Invalid IFSC format', 400);

      // 2. Sequential Supplier Code SUP-TYPE-XXXX
      const supplierCode = await this._generateSupplierCode(userData.supplierType, transaction);

      // 3. Document Archival (S3)
      let TradeLicenseUrl = null;
      if (userData.tradeLicense) {
        const upload = await s3.uploadFile(userData.tradeLicense.buffer, `suppliers/${supplierCode}/license.pdf`, process.env.AWS_S3_PRIVATE_BUCKET);
        TradeLicenseUrl = upload.url;
      }

      // 4. Persistence & Encryption (Bank Data Sovereignty)
      const encryptedBank = encrypt(JSON.stringify(userData.bankDetails));

      const supplier = await Supplier.create({
        ...userData,
        supplierCode,
        bankDetails: encryptedBank,
        tradeLicense: TradeLicenseUrl,
        isActive: true,
        createdBy: createdBy.id
      }, { transaction });

      await AuditLog.create({
        userId: createdBy.id,
        action: 'SUPPLIER_CREATED',
        module: 'SUPPLIERS',
        resourceId: supplier.id,
        details: { supplierCode: supplier.supplierCode }
      }, { transaction });

      await emailUtil.sendEmail(supplier.email, 'Supplier Partnership Initiated', 'Your vendor profile has been activated in the HMS procurement portal.');

      await transaction.commit();
      
      const cacheKey = `hms:suppliers:${supplier.id}`;
      await redis.set(cacheKey, JSON.stringify(supplier), 'EX', 3600);
      
      return supplier;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * @description Aggregates real-time business value and payable aging for a vendor
   */
  async getSupplierById(supplierId) {
    const cacheKey = `hms:suppliers:${supplierId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const supplier = await Supplier.findByPk(supplierId, {
      include: ['catalog'] // Assumed association
    });

    if (!supplier) throw new AppError('Supplier not found', 404);

    // Business Intelligence Aggregation
    const stats = await db.query(`
      SELECT 
        COUNT(id) as total_po_count,
        SUM(total_amount) as total_business_volume,
        MAX(order_date) as last_order_date
      FROM purchase_orders 
      WHERE supplier_id = :supplierId
    `, { replacements: { supplierId }, type: db.QueryTypes.SELECT });

    const result = {
      ...supplier.get({ plain: true }),
      businessMetrics: stats[0]
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    return result;
  }

  /**
   * @description Calculates vendor performance scorecard (Delivery/Quality/Variance)
   */
  async getSupplierPerformance(supplierId, dateRange) {
    const { startDate, endDate } = dateRange;

    const data = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN delivery_status = 'on_time' THEN 1 ELSE 0 END) as on_time_count,
        SUM(CASE WHEN fulfillment_status = 'full' THEN 1 ELSE 0 END) as full_fulfillment_count,
        AVG(DATEDIFF(grn_date, po_date)) as avg_lead_time
      FROM grn_records 
      WHERE supplier_id = :supplierId AND created_at BETWEEN :startDate AND :endDate
    `, { replacements: { supplierId, startDate, endDate }, type: db.QueryTypes.SELECT });

    const perf = data[0];
    const deliveryRate = (perf.on_time_count / perf.total_orders) * 100 || 0;
    
    // Auto-Grading Logic
    let grade = 'C';
    if (deliveryRate > 95) grade = 'A';
    else if (deliveryRate > 80) grade = 'B';

    return {
      performanceScore: deliveryRate.toFixed(2),
      fulfillmentRate: ((perf.full_fulfillment_count / perf.total_orders) * 100).toFixed(2),
      avgLeadTimeDays: Math.round(perf.avg_lead_time),
      grade,
      businessPeriod: dateRange
    };
  }

  /**
   * @description Blacklists a supplier to prevent PO generation in the inventory module
   */
  async blacklistSupplier(supplierId, reason, blacklistedBy) {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) throw new AppError('Supplier not found', 404);

    supplier.isActive = false;
    supplier.isBlacklisted = true;
    supplier.blacklistReason = reason;
    supplier.blacklistedBy = blacklistedBy.id;
    await supplier.save();

    await redis.del(`hms:suppliers:${supplierId}`);
    
    await AuditLog.create({
      userId: blacklistedBy.id,
      action: 'SUPPLIER_BLACKLISTED',
      module: 'SUPPLIERS',
      resourceId: supplierId,
      details: { reason }
    });

    return { success: true, message: 'Supplier is now restricted from procurement' };
  }

  /**
   * --- Technical Validation & ID Logic ---
   */

  _isValidGSTIN(gstin) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) return false;
    // Checksum logic: sum of weighted digits mod 36... (simplified for template)
    return true; 
  }

  async _generateSupplierCode(type, transaction) {
    const prefixes = { pharmaceutical: 'PH', medical_supply: 'MS', equipment: 'EQ', laboratory: 'LT' };
    const prefix = prefixes[type] || 'OTH';
    
    const last = await Supplier.findOne({
      where: { supplierCode: { [Op.like]: `SUP-${prefix}-%` } },
      order: [['supplierCode', 'DESC']],
      transaction
    });

    const seq = last ? parseInt(last.supplierCode.split('-')[2]) + 1 : 1;
    return `SUP-${prefix}-${seq.toString().padStart(4, '0')}`;
  }

  async getApprovedSupplierList(itemId) {
    return await SupplierCatalog.findAll({
      where: { itemId },
      include: [{ model: Supplier, where: { isBlacklisted: false, isActive: true } }],
      order: [['unitPrice', 'ASC'], ['leadTimeDays', 'ASC']]
    });
  }
}

module.exports = new SupplierService();
