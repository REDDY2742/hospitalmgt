const { Model, DataTypes, Op } = require('sequelize');
const encryption = require('../utils/encryption.util');
const logger = require('../utils/logger.util').createChildLogger('staff-model');

/**
 * Hospital Management System - Staff & HR Model
 * 
 * Manages institutional personnel, payroll parameters, and regulatory compliance.
 * Implements AES-256-GCM encryption for banking and identity fields (Aadhaar/PAN).
 */
module.exports = (sequelize) => {
  class Staff extends Model {
    /**
     * @description Fetches current montly attendance metrics
     * @returns {Object} { present, absent, leaves, overtime }
     */
    getCurrentMonthAttendance() {
      return {
        present: this.totalPresent,
        absent: this.totalAbsent,
        leaves: this.totalLeaves,
        overtime: this.totalOvertimeHours
      };
    }

    /**
     * @description Checks remaining balance for a specific leave category
     * @param {string} leaveType - e.g., 'sick', 'casual', 'earned'
     * @returns {Promise<number>} Remaining days
     */
    async getLeaveBalance(leaveType) {
      if (!sequelize.models.LeaveBalance) return 0;
      const balance = await sequelize.models.LeaveBalance.findOne({
        where: { staffId: this.id, leaveType }
      });
      return balance ? balance.remainingDays : 0;
    }

    /**
     * @description Generates a monthly payroll voucher
     * @param {number} month - 1-12
     * @param {number} year - YYYY
     * @returns {Object} Payslip computation
     */
    generatePayslip(month, year) {
      const gross = parseFloat(this.basicSalary) + parseFloat(this.hra) + 
                    parseFloat(this.da) + parseFloat(this.specialAllowance);
      return {
        staffId: this.staffId,
        period: `${month}/${year}`,
        earnings: {
          basic: this.basicSalary,
          hra: this.hra,
          da: this.da,
          special: this.specialAllowance
        },
        grossSalary: gross,
        netPayable: gross // Placeholder for deduction logic
      };
    }
  }

  Staff.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Institutional Employee ID (HMS-STF-XXXXX) */
    staffId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'staff_id',
      comment: 'HR Sequential ID (HMS-STF-XXXXX)'
    },
    /** @type {string} Link to User identity */
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'department_id',
      references: { model: 'departments', key: 'id' }
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    employeeType: {
      type: DataTypes.ENUM('permanent', 'contract', 'part_time', 'intern', 'consultant'),
      defaultValue: 'permanent',
      field: 'employee_type'
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'joining_date'
    },
    probationEndDate: {
      type: DataTypes.DATEONLY,
      field: 'probation_end_date'
    },
    confirmationDate: {
      type: DataTypes.DATEONLY,
      field: 'confirmation_date'
    },
    /** @type {string} Hierarchical self-reference to manager */
    reportingManagerId: {
      type: DataTypes.UUID,
      field: 'reporting_manager_id',
      references: { model: 'staff', key: 'id' }
    },
    // --- Payroll Variables ---
    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'basic_salary'
    },
    hra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'House Rent Allowance'
    },
    da: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Dearness Allowance'
    },
    specialAllowance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'special_allowance'
    },
    pfApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'pf_applicable'
    },
    esiApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'esi_applicable'
    },
    // --- Sensitive Banking & Identity (Encrypted) ---
    bankAccountNumber: {
      type: DataTypes.TEXT,
      field: 'bank_account_number',
      comment: 'Stored as AES-256-GCM encrypted payload'
    },
    bankName: { type: DataTypes.STRING(100), field: 'bank_name' },
    ifscCode: { type: DataTypes.STRING(20), field: 'ifsc_code' },
    panNumber: {
      type: DataTypes.TEXT,
      field: 'pan_number',
      comment: 'Encrypted PAN Card identifier'
    },
    aadhaarNumber: {
      type: DataTypes.TEXT,
      field: 'aadhaar_number',
      comment: 'Encrypted Aadhaar identifier'
    },
    // --- Profile & Talents ---
    qualifications: { type: DataTypes.JSON, defaultValue: [] },
    skills: { type: DataTypes.JSON, defaultValue: [] },
    certifications: { type: DataTypes.JSON, defaultValue: [] },
    emergencyContact: { type: DataTypes.JSON, field: 'emergency_contact' },
    bloodGroup: { type: DataTypes.STRING(5), field: 'blood_group' },
    address: { type: DataTypes.JSON },
    workLocation: { type: DataTypes.STRING(100), field: 'work_location' },
    shiftPreference: {
      type: DataTypes.ENUM('morning', 'evening', 'night', 'rotational'),
      defaultValue: 'morning',
      field: 'shift_preference'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    // --- Exit Management ---
    exitDate: { type: DataTypes.DATEONLY, field: 'exit_date' },
    exitReason: { type: DataTypes.TEXT, field: 'exit_reason' },
    exitType: {
      type: DataTypes.ENUM('resigned', 'terminated', 'retired', 'absconded'),
      field: 'exit_type'
    },
    // --- Attendance Aggregates (Updated via Cron) ---
    totalPresent: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_present' },
    totalAbsent: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_absent' },
    totalLeaves: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_leaves' },
    totalOvertimeHours: { type: DataTypes.FLOAT, defaultValue: 0, field: 'total_overtime_hours' },

    // --- Virtuals ---
    grossSalary: {
      type: DataTypes.VIRTUAL,
      get() {
        return parseFloat(this.basicSalary || 0) + 
               parseFloat(this.hra || 0) + 
               parseFloat(this.da || 0) + 
               parseFloat(this.specialAllowance || 0);
      }
    }
  }, {
    sequelize,
    modelName: 'Staff',
    tableName: 'staff',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['staff_id'] },
      { unique: true, fields: ['user_id'] },
      { fields: ['department_id'] },
      { fields: ['designation'] },
      { fields: ['employee_type'] },
      { fields: ['joining_date'] }
    ],
    scopes: {
      active: { where: { isActive: true } },
      permanent: { where: { employeeType: 'permanent' } },
      onProbation: { 
        where: { 
          probationEndDate: { [Op.gt]: new Date() },
          confirmationDate: null
        } 
      },
      byDepartment(id) { return { where: { departmentId: id } }; },
      byDesignation(title) { return { where: { designation: title } }; }
    },
    hooks: {
      beforeCreate: async (staff) => {
        // 1. AES encryption for sensitive fields
        if (staff.bankAccountNumber) staff.bankAccountNumber = encryption.encrypt(staff.bankAccountNumber);
        if (staff.panNumber) staff.panNumber = encryption.encrypt(staff.panNumber);
        if (staff.aadhaarNumber) staff.aadhaarNumber = encryption.encrypt(staff.aadhaarNumber);

        // 2. Staff ID Generation
        const count = await Staff.count();
        staff.staffId = `HMS-STF-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (staff, options) => {
        try {
          // Trigger leave balance initialization for all types
          if (sequelize.models.LeaveBalance) {
            const leaveTypes = ['sick', 'casual', 'earned', 'maternity', 'paternity'];
            const creations = leaveTypes.map(type => ({
              staffId: staff.id,
              leaveType: type,
              totalDays: type === 'sick' ? 12 : 15, // Institutional defaults
              remainingDays: type === 'sick' ? 12 : 15,
              applicableYear: new Date().getFullYear()
            }));
            await sequelize.models.LeaveBalance.bulkCreate(creations, { transaction: options.transaction });
            logger.info(`HR_PROVISIONING: Leave balances initialized for Staff ${staff.staffId}`);
          }
        } catch (err) {
          logger.error(`HR_HOOK_FAILURE: Failed to initialize leaves for ${staff.staffId} - ${err.message}`);
        }
      }
    }
  });

  /**
   * Hospital Management - Staff Associations
   * @param {Object} models - Loaded models
   */
  Staff.associate = (models) => {
    Staff.belongsTo(models.User, { foreignKey: 'userId', as: 'userAccount' });
    Staff.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Staff.belongsTo(models.Staff, { foreignKey: 'reportingManagerId', as: 'manager' });
    Staff.hasMany(models.Staff, { foreignKey: 'reportingManagerId', as: 'subordinates' });
    Staff.hasMany(models.Attendance, { foreignKey: 'staffId', as: 'attendanceLogs' });
    Staff.hasMany(models.LeaveRequest, { foreignKey: 'staffId', as: 'leaveRequests' });
  };

  return Staff;
};
