const { Model, DataTypes, Op } = require('sequelize');
const schedule = require('node-schedule');
const logger = require('../utils/logger.util').createChildLogger('inventory-model');

/**
 * Hospital Management System - Supply Chain & Inventory Model
 * 
 * Manages institutional assets, medical equipment, surgical supplies, 
 * and sterile processing lifecycles.
 */
module.exports = (sequelize) => {
  class Inventory extends Model {
    /**
     * @description Professional stock deduction for department-level consumption
     */
    async consume(quantity, departmentId, consumedBy, purpose) {
      if (this.currentStock < quantity) {
        throw new Error(`Inventory Shortage: Only ${this.currentStock} ${this.unit}s of ${this.itemName} remaining.`);
      }
      
      const transaction = await sequelize.transaction();
      try {
        await this.decrement('currentStock', { by: quantity, transaction });
        // Logic to log to InventoryTransaction model
        await transaction.commit();
        return this.reload();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Inter-departmental resource shifting
     */
    async transfer(quantity, toDepartmentId, transferredBy) {
       // Logic for moving assets between cost centers
       return this.consume(quantity, toDepartmentId, transferredBy, 'Internal Transfer');
    }

    /**
     * @description Marks equipment as beyond economic repair
     */
    async condemn(reason, condemnedBy) {
      return this.update({
        status: 'condemned',
        condemnationReason: reason,
        condemnedBy,
        condemnedAt: new Date(),
        isActive: false
      });
    }

    /**
     * @description Orchestrates preventive maintenance tasks
     */
    async scheduleMainten() {
      if (!this.maintenanceRequired) return;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + this.maintenanceFrequencyDays);
      await this.update({ nextMaintenanceAt: nextDate });
      logger.info(`MAINTENANCE_SCHEDULED: ${this.itemName} [${this.itemCode}] set for review on ${nextDate}`);
    }

    // --- Class Methods ---

    static async getLowStockItems() {
       return this.findAll({
         where: {
           currentStock: { [Op.lte]: sequelize.col('minimum_stock') },
           isActive: true
         }
       });
    }
  }

  Inventory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential Asset ID (INV-XXXXX) */
    itemCode: {
      type: DataTypes.STRING,
      unique: true,
      field: 'item_code'
    },
    itemName: { type: DataTypes.STRING(255), allowNull: false, field: 'item_name' },
    description: { type: DataTypes.TEXT },
    category: {
      type: DataTypes.ENUM(
        'medical_equipment', 'surgical_supplies', 'consumables', 'linen', 'ppe', 
        'furniture', 'electronics', 'instruments', 'reagents', 
        'cleaning_supplies', 'office_supplies', 'kitchen', 'other'
      ),
      allowNull: false
    },
    subCategory: { type: DataTypes.STRING(100), field: 'sub_category' },
    brand: { type: DataTypes.STRING(100) },
    model: { type: DataTypes.STRING(100) },
    serialNumber: { type: DataTypes.STRING(100), field: 'serial_number' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    /** @type {Object} Physical storage markers {building, floor, room, rack, shelf, bin} */
    location: { type: DataTypes.JSON, defaultValue: {} },
    unit: {
      type: DataTypes.ENUM('piece', 'box', 'pack', 'roll', 'bottle', 'kg', 'liter', 'meter', 'pair', 'set'),
      defaultValue: 'piece'
    },
    // --- Stock Control ---
    currentStock: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_stock' },
    minimumStock: { type: DataTypes.INTEGER, defaultValue: 5, field: 'minimum_stock' },
    maximumStock: { type: DataTypes.INTEGER, field: 'maximum_stock' },
    reorderQuantity: { type: DataTypes.INTEGER, field: 'reorder_quantity' },
    unitPurchasePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'unit_purchase_price' },
    unitSellingPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'unit_selling_price' },
    specifications: { type: DataTypes.JSON, defaultValue: {} },
    // --- Clinical Properties ---
    isExpirable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_expirable' },
    expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date' },
    isConsumable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_consumable' },
    isReusable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_reusable' },
    requiresSterilization: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_sterilization' },
    sterilizationCycleCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sterilization_cycle_count' },
    maxSterilizationCycles: { type: DataTypes.INTEGER, field: 'max_sterilization_cycles' },
    lastSterilizedAt: { type: DataTypes.DATE, field: 'last_sterilized_at' },
    // --- Biomedical Engineering ---
    maintenanceRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'maintenance_required' },
    maintenanceFrequencyDays: { type: DataTypes.INTEGER, field: 'maintenance_frequency_days' },
    lastMaintenanceAt: { type: DataTypes.DATE, field: 'last_maintenance_at' },
    nextMaintenanceAt: { type: DataTypes.DATE, field: 'next_maintenance_at' },
    warrantyExpiry: { type: DataTypes.DATEONLY, field: 'warranty_expiry' },
    purchaseDate: { type: DataTypes.DATEONLY, field: 'purchase_date' },
    purchaseOrderId: { type: DataTypes.UUID, field: 'purchase_order_id' },
    supplierId: { type: DataTypes.UUID, field: 'supplier_id' },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'under_maintenance', 'condemned', 'lost', 'damaged'),
      defaultValue: 'active'
    },
    condemnationReason: { type: DataTypes.STRING, field: 'condemnation_reason' },
    condemnedBy: { type: DataTypes.UUID, field: 'condemned_by' },
    condemnedAt: { type: DataTypes.DATE, field: 'condemned_at' },
    barcodeQR: { type: DataTypes.STRING, field: 'barcode_qr' },
    image: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },

    // --- Virtuals ---
    totalValue: {
      type: DataTypes.VIRTUAL,
      get() { return (this.currentStock || 0) * (this.unitPurchasePrice || 0); }
    }
  }, {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventories',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['item_code'] },
      { fields: ['department_id'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['current_stock'] },
      { fields: ['expiry_date'] }
    ],
    scopes: {
      active: { where: { isActive: true, status: 'active' } },
      lowStock: { where: { currentStock: { [Op.lte]: sequelize.col('minimum_stock') } } },
      expired: { where: { expiryDate: { [Op.lt]: new Date() } } },
      requiresMaintenance: { where: { maintenanceRequired: true, nextMaintenanceAt: { [Op.lte]: new Date() } } },
      byDepartment(id) { return { where: { departmentId: id } }; },
      byCategory(cat) { return { where: { category: cat } }; }
    },
    hooks: {
      beforeCreate: async (inv) => {
        const count = await Inventory.count();
        inv.itemCode = `INV-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: (inv) => {
        // Schedule Biomedical Maintenance Reminders
        if (inv.maintenanceRequired && inv.maintenanceFrequencyDays) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + inv.maintenanceFrequencyDays);
          
          schedule.scheduleJob(reminderDate, function() {
            logger.warn(`BIOMED_ALERT: Preventive maintenance due for ${inv.itemName} [${inv.itemCode}]`);
            // Emit to maintenance dashboard
          });
        }
      },
      afterUpdate: async (inv) => {
        // 1. Replenishment Alert
        if (inv.changed('currentStock') && inv.currentStock <= inv.minimumStock) {
          logger.warn(`REORDER_ALERT: Inventory Item ${inv.itemName} has reached minimum threshold.`);
          // Trigger automated Procurement Request
        }

        // 2. Condemnation Logic
        if (inv.changed('status') && inv.status === 'condemned') {
          logger.info(`ASSET_WRITE_OFF: Item ${inv.itemCode} has been condemned. Clearing associated stock value.`);
          await inv.update({ currentStock: 0 }, { hooks: false });
        }
      }
    }
  });

  /**
   * Hospital Management - Inventory Associations
   * @param {Object} models - Loaded models
   */
  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Inventory.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
  };

  return Inventory;
};
