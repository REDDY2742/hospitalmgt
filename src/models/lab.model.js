const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('lab-test-model');

/**
 * Hospital Management System - Laboratory Information System (LIS) Model
 * 
 * Manages the catalog of diagnostic tests, reference ranges, 
 * sample collection protocols, and report templates.
 */
module.exports = (sequelize) => {
  class LabTest extends Model {
    /**
     * @description Calculates dynamic pricing based on clinical urgency
     */
    calculatePrice(isEmergency = false) {
      return isEmergency ? this.emergencyPrice : this.price;
    }

    /**
     * @description Validates if collected sample volume meets test thresholds
     */
    validateSampleSufficiency(volume) {
      return volume >= (this.sampleVolume || 0);
    }

    /**
     * @description Flags clinical results as critical based on parameter ranges
     */
    isResultCritical(parameterName, value) {
      if (!this.referenceRanges) return false;
      const range = this.referenceRanges.find(r => r.parameter === parameterName);
      if (!range) return false;

      const val = parseFloat(value);
      return val < (range.min || -Infinity) || val > (range.max || Infinity);
    }
  }

  LabTest.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential Diagnostic ID (LAB-TST-XXXXX) */
    testCode: {
      type: DataTypes.STRING,
      unique: true,
      field: 'test_code'
    },
    testName: { type: DataTypes.STRING(255), allowNull: false, field: 'test_name' },
    shortName: { type: DataTypes.STRING(50), field: 'short_name' },
    category: {
      type: DataTypes.ENUM(
        'hematology', 'biochemistry', 'microbiology', 'histopathology', 
        'cytology', 'immunology', 'serology', 'radiology', 'urine_analysis', 
        'stool_analysis', 'semen_analysis', 'csf_analysis', 'drug_testing', 
        'genetic', 'other'
      ),
      allowNull: false
    },
    subCategory: { type: DataTypes.STRING(100), field: 'sub_category' },
    /** @type {Array<string>} Multi-sample support (Blood, Urine, etc.) */
    sampleType: { type: DataTypes.JSON, field: 'sample_type', defaultValue: [] },
    sampleVolume: { type: DataTypes.FLOAT, field: 'sample_volume' },
    sampleUnit: { type: DataTypes.STRING(10), field: 'sample_unit', defaultValue: 'ml' },
    containerType: {
      type: DataTypes.ENUM('red_top', 'blue_top', 'green_top', 'purple_top', 'yellow_top', 'grey_top', 'urine_cup', 'culture_bottle', 'other'),
      defaultValue: 'other',
      field: 'container_type'
    },
    turnaroundTime: { type: DataTypes.INTEGER, field: 'turnaround_time', comment: 'Standard hours' },
    criticalTurnaroundTime: { type: DataTypes.INTEGER, field: 'critical_turnaround_time', comment: 'STAT hours' },
    // --- Commercial ---
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    emergencyPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'emergency_price' },
    /** @type {Array<Object>} Clinical reference matrix [{parameter, min, max, unit, gender, ageMin, ageMax}] */
    referenceRanges: { type: DataTypes.JSON, field: 'reference_ranges', defaultValue: [] },
    methodology: { type: DataTypes.STRING(100) },
    equipment: { type: DataTypes.STRING(100) },
    // --- Preparation ---
    requiresFasting: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_fasting' },
    fastingHours: { type: DataTypes.INTEGER, field: 'fasting_hours' },
    specialPreparation: { type: DataTypes.TEXT, field: 'special_preparation' },
    reportTemplate: {
      type: DataTypes.ENUM('numeric', 'descriptive', 'culture', 'image_based'),
      defaultValue: 'numeric',
      field: 'report_template'
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    isPackageTest: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_package_test' },
    packageTestIds: { type: DataTypes.JSON, field: 'package_test_ids', defaultValue: [] },
    loinc_code: { type: DataTypes.STRING(20), comment: 'Logit-Standardized Lab terminology' },
    isOutsourceable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_outsourceable' },
    outsourceLab: { type: DataTypes.STRING(100), field: 'outsource_lab' },
    outsourcePrice: { type: DataTypes.DECIMAL(10, 2), field: 'outsource_price' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' }
  }, {
    sequelize,
    modelName: 'LabTest',
    tableName: 'lab_tests',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['test_code'] },
      { fields: ['test_name'] },
      { fields: ['category'] },
      { fields: ['is_active'] }
    ],
    scopes: {
      active: { where: { isActive: true } },
      fasting: { where: { requiresFasting: true } },
      emergency: { where: { emergencyPrice: { [Op.gt]: 0 } } },
      outsourceable: { where: { isOutsourceable: true } },
      byCategory(cat) { return { where: { category: cat } }; }
    },
    hooks: {
      beforeCreate: async (test) => {
        const count = await LabTest.count();
        test.testCode = `LAB-TST-${(count + 1).toString().padStart(5, '0')}`;
      }
    }
  });

  /**
   * Hospital Management - Lab Associations
   * @param {Object} models - Loaded models
   */
  LabTest.associate = (models) => {
    LabTest.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'labDepartment' });
    LabTest.hasMany(models.LabResult, { foreignKey: 'testId', as: 'testResults' });
  };

  return LabTest;
};
