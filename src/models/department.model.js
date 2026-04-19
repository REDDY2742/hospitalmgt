const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('department-model');

/**
 * Hospital Management System - Department Model
 * 
 * Orchestrates organizational divisions, clinical specializations, 
 * budgetary parameters, and administrative hierarchy (HOD).
 */
module.exports = (sequelize) => {
  class Department extends Model {
    /**
     * @description Calculates bed occupancy percentage
     * @returns {number} 0-100
     */
    getOccupancyRate() {
      if (!this.totalBeds) return 0;
      return (this.occupiedBeds / this.totalBeds) * 100;
    }

    /**
     * @description Calculates budget usage percentage
     * @returns {number}
     */
    getBudgetUtilization() {
      if (!this.annualBudget) return 0;
      return (this.currentExpenditure / this.annualBudget) * 100;
    }

    /**
     * @description Counts currently active personnel assigned to this department
     * @returns {Promise<number>}
     */
    async getActiveStaffCount() {
      if (!sequelize.models.Staff) return 0;
      return sequelize.models.Staff.count({
        where: { departmentId: this.id, isActive: true }
      });
    }

    /**
     * @description Compiles comprehensive operational statistics
     * @returns {Promise<Object>} Statistics snapshot
     */
    async getDepartmentStats() {
      const staffCount = await this.getActiveStaffCount();
      const doctorCount = sequelize.models.Doctor ? await sequelize.models.Doctor.count({ where: { departmentId: this.id } }) : 0;
      
      return {
        department: this.name,
        code: this.departmentCode,
        occupancy: this.getOccupancyRate(),
        budgetUtilization: this.getBudgetUtilization(),
        manpower: {
          totalStaff: staffCount,
          totalDoctors: doctorCount
        },
        financial: {
          budget: this.annualBudget,
          expenditure: this.currentExpenditure
        }
      };
    }
  }

  Department.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential Admin ID (DEPT-XXX) */
    departmentCode: {
      type: DataTypes.STRING,
      unique: true,
      field: 'department_code',
      comment: 'Operational Reference Code'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.ENUM('clinical', 'surgical', 'diagnostic', 'administrative', 'support', 'emergency', 'critical_care'),
      allowNull: false,
      defaultValue: 'clinical'
    },
    /** @type {string} Head of Department (Must be a Doctor) */
    hodId: {
      type: DataTypes.UUID,
      field: 'hod_id',
      references: { model: 'doctors', key: 'id' }
    },
    floorNumber: { type: DataTypes.INTEGER, field: 'floor_number' },
    wingNumber: { type: DataTypes.STRING(20), field: 'wing_number' },
    location: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    extension: { type: DataTypes.STRING(10) },
    email: { type: DataTypes.STRING(100), validate: { isEmail: true } },
    iconUrl: { type: DataTypes.STRING, field: 'icon_url', validate: { isUrl: true } },
    colorCode: { type: DataTypes.STRING(10), field: 'color_code', comment: 'HEX code for UI categorization' },
    /** @type {Object} Monday-Sunday opening/closing protocol */
    operatingHours: { type: DataTypes.JSON, field: 'operating_hours', defaultValue: {} },
    isOpen24x7: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_open_24x7' },
    totalBeds: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_beds' },
    annualBudget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'annual_budget' },
    currentExpenditure: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'current_expenditure' },
    facilities: { type: DataTypes.JSON, defaultValue: [] },
    equipmentList: { type: DataTypes.JSON, field: 'equipment_list', defaultValue: [] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    establishedYear: { type: DataTypes.INTEGER, field: 'established_year' },
    /** @type {string} Hierarchical parent for sub-departments */
    parentDepartmentId: {
      type: DataTypes.UUID,
      field: 'parent_department_id',
      references: { model: 'departments', key: 'id' }
    },
    // --- Virtuals ---
    occupiedBeds: {
      type: DataTypes.VIRTUAL,
      get() { return 0; } // Note: Real implementation would query Ward/Bed models
    },
    totalStaff: {
      type: DataTypes.VIRTUAL,
      get() { return 0; } // Populated via aggregate queries in service layer
    },
    totalDoctors: {
      type: DataTypes.VIRTUAL,
      get() { return 0; }
    }
  }, {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['department_code'] },
      { fields: ['type'] },
      { fields: ['hod_id'] },
      { fields: ['is_active'] },
      { fields: ['parent_department_id'] }
    ],
    scopes: {
      active: { where: { isActive: true } },
      clinical: { where: { type: 'clinical' } },
      surgical: { where: { type: 'surgical' } },
      with24x7: { where: { isOpen24x7: true } },
      withHOD: { where: { hodId: { [Op.ne]: null } } }
    },
    hooks: {
      beforeCreate: async (dept) => {
        // 1. Validate HOD eligibility if assigned
        if (dept.hodId && sequelize.models.Doctor) {
          const isDoc = await sequelize.models.Doctor.findByPk(dept.hodId);
          if (!isDoc) throw new Error('Administrative Policy Error: HOD must be a registered doctor.');
        }

        // 2. Sequential Code Generation
        const count = await Department.count();
        dept.departmentCode = `DEPT-${(count + 1).toString().padStart(3, '0')}`;
      },
      afterUpdate: async (dept) => {
        // 3. HOD Rotation Notification Logic
        if (dept.changed('hodId')) {
          try {
            const oldHodId = dept.previous('hodId');
            const newHodId = dept.hodId;
            // logic for triggering system notifications to both doctors
            logger.info(`HOD_ROTATION: Department ${dept.name} transitioned from ${oldHodId} to ${newHodId}`);
          } catch (err) {
            logger.error(`NOTIFY_FAILURE: Failed to trigger HOD rotation alerts: ${err.message}`);
          }
        }
      }
    }
  });

  /**
   * Hospital Management - Department Associations
   * @param {Object} models - Loaded models
   */
  Department.associate = (models) => {
    Department.belongsTo(models.Doctor, { foreignKey: 'hodId', as: 'headOfDepartment' });
    Department.belongsTo(models.Department, { foreignKey: 'parentDepartmentId', as: 'parentDepartment' });
    Department.hasMany(models.Department, { foreignKey: 'parentDepartmentId', as: 'subDepartments' });
    Department.hasMany(models.Doctor, { foreignKey: 'departmentId', as: 'doctors' });
    Department.hasMany(models.Staff, { foreignKey: 'departmentId', as: 'staff' });
    Department.hasMany(models.Ward, { foreignKey: 'departmentId', as: 'wards' });
  };

  return Department;
};
