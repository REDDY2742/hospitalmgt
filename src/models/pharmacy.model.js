const { Model, DataTypes, Op } = require('sequelize');
const schedule = require('node-schedule');
const logger = require('../utils/logger.util').createChildLogger('pharmacy-stock-model');

/**
 * Hospital Management System - Pharmacy Stock & Batch Model
 * 
 * Manages physical inventory batches, pharmaceutical expiry lifecycles, 
 * and FIFO (First-In, First-Out) dispensing logic.
 */
module.exports = (sequelize) => {
  class PharmacyStock extends Model {
    /**
     * @description Atomic stock deduction with FIFO adherence check
     */
    async dispense(quantity) {
      if (this.status !== 'active' || this.qualityCheckStatus !== 'approved') {
        throw new Error('Batch Error: Batch is either inactive or pending quality clearance.');
      }
      if (this.quantityAvailable < quantity) {
        throw new Error(`Insufficient Stock: Only ${this.quantityAvailable} available in batch ${this.batchNumber}`);
      }
      return this.increment('quantitySold', { by: quantity });
    }

    /**
     * @description Processes returns to manufacturer/supplier
     */
    async returnToSupplier(quantity, reason) {
      if (this.quantityAvailable < quantity) throw new Error('Return Error: Quantity exceeds availability.');
      return this.increment('quantityReturned', { by: quantity });
    }

    /**
     * @description Records physical asset damage or shrinkage
     */
    async markDamaged(quantity, reason) {
      if (this.quantityAvailable < quantity) throw new Error('Shrinkage Error: Quantity exceeds availability.');
      return this.increment('quantityDamaged', { by: quantity });
    }

    /**
     * @description Checks expiry urgency for clinical alerts
     */
    getExpiryStatus() {
      const today = new Date();
      const expiry = new Date(this.expiryDate);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      let status = 'good';
      if (diffDays <= 0) status = 'critical';
      else if (diffDays <= 30) status = 'critical';
      else if (diffDays <= 90) status = 'warning';
      
      return { status, daysRemaining: diffDays };
    }

    // --- Class Methods ---

    /**
     * @description Fetches all batches within N days of expiry
     */
    static async getExpiringBatches(days = 90) {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + days);
      return this.findAll({
        where: {
          expiryDate: { [Op.lte]: expiryThreshold, [Op.gt]: new Date() },
          isActive: true
        }
      });
    }

    /**
     * @description Enforces FIFO by finding the oldest unexpired batch
     */
    static async getFIFOBatch(medicineId) {
      return this.findOne({
        where: {
          medicineId,
          expiryDate: { [Op.gt]: new Date() },
          qualityCheckStatus: 'approved',
          isActive: true
        },
        order: [['expiryDate', 'ASC']] // Oldest expiry first
      });
    }
  }

  PharmacyStock.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Forensic Batch ID (BAT-YYYYMMDD-XXXXX) */
    batchId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'batch_id'
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'medicine_id',
      references: { model: 'medicines', key: 'id' }
    },
    supplierId: {
      type: DataTypes.UUID,
      field: 'supplier_id'
    },
    purchaseOrderId: {
      type: DataTypes.UUID,
      field: 'purchase_order_id'
    },
    /** @type {string} Manufacturer-assigned batch string */
    batchNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'batch_number'
    },
    manufacturedDate: { type: DataTypes.DATEONLY, field: 'manufactured_date' },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'expiry_date' },
    // --- Quantities ---
    quantityReceived: { type: DataTypes.INTEGER, defaultValue: 0, field: 'quantity_received' },
    quantitySold: { type: DataTypes.INTEGER, defaultValue: 0, field: 'quantity_sold' },
    quantityReturned: { type: DataTypes.INTEGER, defaultValue: 0, field: 'quantity_returned' },
    quantityDamaged: { type: DataTypes.INTEGER, defaultValue: 0, field: 'quantity_damaged' },
    // --- Pricing & Finance ---
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'purchase_price' },
    mrp: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    sellingPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'selling_price' },
    discountPercentage: { type: DataTypes.FLOAT, defaultValue: 0, field: 'discount_percentage' },
    gstPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'gst_percentage' },
    totalPurchaseValue: { type: DataTypes.DECIMAL(15, 2), field: 'total_purchase_value' },
    totalSellingValue: { type: DataTypes.DECIMAL(15, 2), field: 'total_selling_value' },
    storageLocation: { type: DataTypes.STRING(100), field: 'storage_location' },
    // --- Assurance & Compliance ---
    qualityCheckStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'on_hold'),
      defaultValue: 'pending',
      field: 'quality_check_status'
    },
    qualityCheckBy: { type: DataTypes.UUID, field: 'quality_check_by' },
    qualityCheckDate: { type: DataTypes.DATE, field: 'quality_check_date' },
    qualityCheckNotes: { type: DataTypes.TEXT, field: 'quality_check_notes' },
    invoiceNumber: { type: DataTypes.STRING(100), field: 'invoice_number' },
    invoiceDate: { type: DataTypes.DATEONLY, field: 'invoice_date' },
    invoiceDoc: { type: DataTypes.STRING, field: 'invoice_doc' },
    receivedBy: { type: DataTypes.UUID, field: 'received_by' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },

    // --- Virtuals ---
    daysToExpiry: {
      type: DataTypes.VIRTUAL,
      get() { return Math.ceil((new Date(this.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)); }
    },
    isExpired: {
      type: DataTypes.VIRTUAL,
      get() { return new Date(this.expiryDate) < new Date(); }
    },
    quantityAvailable: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.quantityReceived || 0) - (this.quantitySold || 0) - 
               (this.quantityReturned || 0) - (this.quantityDamaged || 0);
      }
    }
  }, {
    sequelize,
    modelName: 'PharmacyStock',
    tableName: 'pharmacy_stock',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['batch_id'] },
      { fields: ['medicine_id'] },
      { fields: ['expiry_date'] },
      { fields: ['batch_number'] },
      { fields: ['quality_check_status'] },
      { fields: ['supplier_id'] }
    ],
    scopes: {
      active: { where: { isActive: true, qualityCheckStatus: 'approved' } },
      expired: { where: { expiryDate: { [Op.lt]: new Date() } } },
      qualityApproved: { where: { qualityCheckStatus: 'approved' } },
      expiringSoon(days) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + days);
        return { where: { expiryDate: { [Op.lte]: threshold, [Op.gt]: new Date() } } };
      }
    },
    hooks: {
      beforeCreate: async (stock) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await PharmacyStock.count();
        stock.batchId = `BAT-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (stock) => {
        // 1. Rollup Stock to Master Medicine Record
        if (sequelize.models.Medicine) {
          await sequelize.models.Medicine.increment('currentStock', {
            by: stock.quantityReceived,
            where: { id: stock.medicineId }
          });
        }
        
        // 2. Schedule Expiry Alerts
        const alerts = [90, 60, 30];
        alerts.forEach(days => {
          const alertDate = new Date(stock.expiryDate);
          alertDate.setDate(alertDate.getDate() - days);
          
          if (alertDate > new Date()) {
            schedule.scheduleJob(alertDate, function() {
              logger.warn(`EXPIRY_WATCH: Batch ${stock.batchNumber} expires in ${days} days.`);
              // logic for system notification or email
            });
          }
        });
      },
      afterUpdate: async (stock) => {
        // Recalculate Master Stock on quantity shifts
        if (stock.changed('quantitySold') || stock.changed('quantityReturned') || stock.changed('quantityDamaged')) {
          const delta = (stock.quantitySold - stock.previous('quantitySold')) +
                        (stock.quantityReturned - stock.previous('quantityReturned')) +
                        (stock.quantityDamaged - stock.previous('quantityDamaged'));
          
          if (sequelize.models.Medicine) {
            await sequelize.models.Medicine.decrement('currentStock', {
               by: delta,
               where: { id: stock.medicineId }
            });
          }
        }
      },
      beforeDestroy: (stock) => {
        if (stock.quantitySold > 0) {
          throw new Error('Compliance Violation: Cannot delete a batch with active sales history.');
        }
      }
    }
  });

  /**
   * Hospital Management - Pharmacy Associations
   * @param {Object} models - Loaded models
   */
  PharmacyStock.associate = (models) => {
    PharmacyStock.belongsTo(models.Medicine, { foreignKey: 'medicineId', as: 'medicine' });
    PharmacyStock.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
  };

  return PharmacyStock;
};
