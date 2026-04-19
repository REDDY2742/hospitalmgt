const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('medicine-model');

/**
 * Hospital Management System - Pharmaceutical Registry Model
 * 
 * Manages drug catalogs, clinical compositions, hazardous material classifications
 * (Controlled Substances), and pharmacy stock thresholds.
 */
module.exports = (sequelize) => {
  class Medicine extends Model {
    /**
     * @description Calculates tax split based on institutional GST configuration
     */
    calculateGST(quantity) {
      const taxableValue = this.sellingPrice * quantity;
      const gstRate = parseFloat(this.gstPercentage);
      const totalTax = (taxableValue * gstRate) / 100;
      
      return {
        pricePerUnit: this.sellingPrice,
        taxableValue,
        cgst: totalTax / 2, // Assuming Intrastate
        sgst: totalTax / 2,
        totalTax,
        totalPayable: taxableValue + totalTax
      };
    }

    /**
     * @description Cross-references pharmacological interactions
     */
    async checkInteractions(medicineIds) {
      if (!Array.isArray(medicineIds) || !this.drugInteractions) return [];
      return this.drugInteractions.filter(id => medicineIds.includes(id));
    }

    /**
     * @description Calculates total asset value in the pharmacy
     */
    getStockValue() {
      return this.currentStock * this.purchasePrice;
    }

    /**
     * @description Checks if a specific batch is approaching expiration
     */
    async isNearExpiry(batchId, daysThreshold = 30) {
      if (!sequelize.models.PharmacyStock) return false;
      const batch = await sequelize.models.PharmacyStock.findOne({
        where: { medicineId: this.id, batchNumber: batchId }
      });
      if (!batch || !batch.expiryDate) return false;
      
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      return new Date(batch.expiryDate) <= thresholdDate;
    }
  }

  Medicine.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential SKU (MED-XXXXX) */
    medicineCode: {
      type: DataTypes.STRING,
      unique: true,
      field: 'medicine_code'
    },
    genericName: { type: DataTypes.STRING(255), allowNull: false, field: 'generic_name' },
    brandName: { type: DataTypes.STRING(255), allowNull: false, field: 'brand_name' },
    manufacturer: { type: DataTypes.STRING(255) },
    category: {
      type: DataTypes.ENUM(
        'tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 
        'inhaler', 'patch', 'suppository', 'powder', 'solution', 
        'suspension', 'cream', 'gel', 'lotion', 'spray'
      ),
      allowNull: false
    },
    therapeuticClass: { type: DataTypes.STRING(100), field: 'therapeutic_class' },
    subCategory: { type: DataTypes.STRING(100), field: 'sub_category' },
    /** @type {Array<Object>} Chemical ingredients and potency [{ingredient, strength, unit}] */
    composition: { type: DataTypes.JSON, defaultValue: [] },
    strength: { type: DataTypes.STRING(50) },
    form: { type: DataTypes.STRING(50) },
    /** @type {Array<string>} Method of administration (Oral, IV, IM, etc.) */
    routeOfAdministration: { type: DataTypes.JSON, field: 'route_of_administration', defaultValue: [] },
    pharmacologicalAction: { type: DataTypes.TEXT, field: 'pharmacological_action' },
    sideEffects: { type: DataTypes.TEXT, field: 'side_effects' },
    contraindications: { type: DataTypes.TEXT },
    /** @type {Array<string>} Medicine IDs known to cause interactions */
    drugInteractions: { type: DataTypes.JSON, field: 'drug_interactions', defaultValue: [] },
    // --- Logistics & Storage ---
    storageConditions: {
      type: DataTypes.ENUM('room_temp', 'refrigerated', 'frozen', 'controlled_substance'),
      defaultValue: 'room_temp',
      field: 'storage_conditions'
    },
    storageTemperatureMin: { type: DataTypes.FLOAT, field: 'storage_temperature_min' },
    storageTemperatureMax: { type: DataTypes.FLOAT, field: 'storage_temperature_max' },
    requiresPrescription: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'requires_prescription' },
    isControlledSubstance: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_controlled_substance' },
    scheduledDrug: {
      type: DataTypes.ENUM('h1', 'h', 'g', 'x', 'not_applicable'),
      defaultValue: 'not_applicable',
      field: 'scheduled_drug'
    },
    // --- Financial & Inventory ---
    hsn_sac_code: { type: DataTypes.STRING(20) },
    gstPercentage: {
       type: DataTypes.ENUM('0', '5', '12', '18'),
       defaultValue: '12',
       field: 'gst_percentage'
    },
    mrp: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'purchase_price' },
    sellingPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'selling_price' },
    reorderLevel: { type: DataTypes.INTEGER, defaultValue: 10, field: 'reorder_level' },
    currentStock: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_stock' },
    barcode: { type: DataTypes.STRING(50), unique: true },
    image: { type: DataTypes.STRING, validate: { isUrl: true } },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    // --- Regulatory ---
    fdaApproved: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'fda_approved' },
    approvalNumber: { type: DataTypes.STRING(50), field: 'approval_number' },
    manufacturingLicense: { type: DataTypes.STRING(100), field: 'manufacturing_license' },

    // --- Virtual Alerts ---
    isLowStock: {
      type: DataTypes.VIRTUAL,
      get() { return this.currentStock <= this.reorderLevel; }
    },
    isOutOfStock: {
      type: DataTypes.VIRTUAL,
      get() { return this.currentStock === 0; }
    }
  }, {
    sequelize,
    modelName: 'Medicine',
    tableName: 'medicines',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['medicine_code'] },
      { fields: ['generic_name'] },
      { fields: ['brand_name'] },
      { fields: ['barcode'] },
      { fields: ['category'] },
      { fields: ['is_active'] },
      { fields: ['is_controlled_substance'] }
    ],
    scopes: {
      active: { where: { isActive: true } },
      lowStock: { where: { currentStock: { [Op.lte]: sequelize.col('reorder_level') } } },
      outOfStock: { where: { currentStock: 0 } },
      controlled: { where: { isControlledSubstance: true } },
      requiresPrescription: { where: { requiresPrescription: true } },
      byCategory(cat) { return { where: { category: cat } }; },
      byTherapeuticClass(cls) { return { where: { therapeuticClass: { [Op.like]: `%${cls}%` } } }; }
    },
    hooks: {
      beforeCreate: async (med) => {
        const count = await Medicine.count();
        med.medicineCode = `MED-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterUpdate: (med) => {
        // Stock Threshold Alerts
        if (med.changed('currentStock')) {
          if (med.currentStock <= med.reorderLevel) {
            logger.warn(`PHARMACY_ALERT: Item ${med.brandName} [${med.medicineCode}] has reached low stock: ${med.currentStock} remaining.`);
            // Logic to trigger replenishment workflow/emails
          }
        }
      }
    }
  });

  /**
   * Hospital Management - Medicine Associations
   * @param {Object} models - Loaded models
   */
  Medicine.associate = (models) => {
    Medicine.hasMany(models.PharmacyStock, { foreignKey: 'medicineId', as: 'batches' });
    Medicine.hasMany(models.PrescriptionItem, { foreignKey: 'medicineId', as: 'prescribedIn' });
    Medicine.hasMany(models.PharmacyTransaction, { foreignKey: 'medicineId', as: 'transactions' });
  };

  return Medicine;
};
