const { Model, DataTypes } = require('sequelize');

/**
 * Hospital Management System - Prescription Item Model
 * 
 * Individual medication line items within a clinical prescription.
 * Manages dosage, frequency, route, and dispensing status.
 */
module.exports = (sequelize) => {
  class PrescriptionItem extends Model {}

  PrescriptionItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'prescription_id',
      references: { model: 'prescriptions', key: 'id' }
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'medicine_id',
      references: { model: 'medicines', key: 'id' }
    },
    /** @type {string} Snapshot of brand name at time of prescription */
    medicineName: { type: DataTypes.STRING, field: 'medicine_name' },
    /** @type {string} Snapshot of generic name for substitution logic */
    genericName: { type: DataTypes.STRING, field: 'generic_name' },
    dosage: { type: DataTypes.STRING(50) },
    dosageUnit: { type: DataTypes.STRING(20), field: 'dosage_unit' },
    frequency: {
      type: DataTypes.ENUM(
        'once_daily', 'twice_daily', 'thrice_daily', 'four_times', 
        'every_6_hours', 'every_8_hours', 'every_12_hours', 
        'sos', 'stat', 'before_meals', 'after_meals', 'bedtime'
      ),
      allowNull: false
    },
    duration: { type: DataTypes.INTEGER },
    durationUnit: {
      type: DataTypes.ENUM('days', 'weeks', 'months'),
      defaultValue: 'days',
      field: 'duration_unit'
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    route: { type: DataTypes.STRING(50) },
    instructions: { type: DataTypes.TEXT },
    substitutionAllowed: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'substitution_allowed' },
    // --- Pharmacy Dispensing Logic ---
    dispensed: { type: DataTypes.BOOLEAN, defaultValue: false },
    dispensedQuantity: { type: DataTypes.INTEGER, defaultValue: 0, field: 'dispensed_quantity' },
    dispensedAt: { type: DataTypes.DATE, field: 'dispensed_at' }
  }, {
    sequelize,
    modelName: 'PrescriptionItem',
    tableName: 'prescription_items',
    underscored: true,
    timestamps: true
  });

  /**
   * Hospital Management - Prescription Item Associations
   * @param {Object} models - Loaded models
   */
  PrescriptionItem.associate = (models) => {
    PrescriptionItem.belongsTo(models.Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
    PrescriptionItem.belongsTo(models.Medicine, { foreignKey: 'medicineId', as: 'medicine' });
  };

  return PrescriptionItem;
};
