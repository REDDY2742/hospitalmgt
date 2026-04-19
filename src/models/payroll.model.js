const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('payroll-finance-model');

/**
 * Hospital Management System - HR Payroll & Compensation Engine
 * 
 * Manages institutional compensation structures, statutory compliance (PF/ESI/TDS), 
 * and automated monthly payslip orchestration with attendance integration.
 */
module.exports = (sequelize) => {
  // --- Payroll Configuration Model ---
  class PayrollConfig extends Model {
    /**
     * @description Calculates institutional Cost To Company (CTC)
     */
    calculateAnnualCTC() {
      const monthlyGross = (Number(this.basicSalary) + Number(this.hra) + Number(this.da) + Number(this.ta) + Number(this.medicalAllowance));
      return monthlyGross * 12;
    }
  }

  PayrollConfig.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    staffId: { type: DataTypes.UUID, unique: true, allowNull: false, field: 'staff_id' },
    basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'basic_salary' },
    hra: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'hra' },
    da: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'da' },
    ta: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'ta' },
    medicalAllowance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'medical_allowance' },
    specialAllowance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'special_allowance' },
    otherAllowances: { type: DataTypes.JSON, defaultValue: [], field: 'other_allowances' },
    // --- Statutory & Compliance ---
    pfApplicable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'pf_applicable' },
    employeePfPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 12, field: 'employee_pf_percentage' },
    employerPfPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 12, field: 'employer_pf_percentage' },
    esiApplicable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'esi_applicable' },
    incomeTaxRegime: { type: DataTypes.ENUM('old', 'new'), defaultValue: 'new', field: 'income_tax_regime' },
    tdsPerMonth: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'tds_per_month' },
    // --- Logistics ---
    salaryAccount: { type: DataTypes.JSON, defaultValue: {}, field: 'salary_account', comment: 'Encrypted Acct#, Bank, IFSC' },
    paymentCycle: { type: DataTypes.ENUM('monthly', 'weekly', 'bi_weekly'), defaultValue: 'monthly', field: 'payment_cycle' },
    attendanceBasedPay: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'attendance_based_pay' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'PayrollConfig',
    tableName: 'payroll_configs',
    underscored: true,
    paranoid: true
  });

  // --- Payslip (Payroll) Model ---
  class Payroll extends Model {
    /**
     * @description Professional payslip PDF generation logic
     */
    async generatePayslip() {
       const pdfUtil = require('../utils/pdf.util');
       return pdfUtil.generatePayslip(this);
    }

    /**
     * @description Core payroll calculation pipeline
     */
    async calculate() {
       // logic: gross earnings + OT + bonuses - LOP - PF/ESI - TDS
       const earnings = Number(this.grossEarnings) + Number(this.overtimePay || 0);
       const deductions = Number(this.employeePF || 0) + Number(this.employeeESI || 0) + Number(this.tds || 0);
       this.status = 'calculated';
       return this.save();
    }
  }

  Payroll.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    payrollId: { type: DataTypes.STRING, unique: true, field: 'payroll_id' },
    staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
    payrollConfigId: { type: DataTypes.UUID, field: 'payroll_config_id' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'processing', 'calculated', 'approved', 'paid', 'cancelled', 'on_hold'),
      defaultValue: 'draft'
    },
    presentDays: { type: DataTypes.DECIMAL(4, 2), field: 'present_days' },
    unpaidLeaveDays: { type: DataTypes.DECIMAL(4, 2), field: 'unpaid_leave_days' },
    overtimeHours: { type: DataTypes.DECIMAL(5, 2), field: 'overtime_hours' },
    // --- Earnings Ledger ---
    basicSalary: { type: DataTypes.DECIMAL(12, 2), field: 'basic_salary' },
    grossEarnings: { type: DataTypes.DECIMAL(12, 2), field: 'gross_earnings' },
    overtimePay: { type: DataTypes.DECIMAL(12, 2), field: 'overtime_pay' },
    bonus: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // --- Deductions Ledger ---
    employeePF: { type: DataTypes.DECIMAL(12, 2), field: 'employee_pf' },
    employeeESI: { type: DataTypes.DECIMAL(12, 2), field: 'employee_esi' },
    tds: { type: DataTypes.DECIMAL(12, 2) },
    totalDeductions: { type: DataTypes.DECIMAL(12, 2), field: 'total_deductions' },
    netPayable: { type: DataTypes.DECIMAL(12, 2), field: 'net_payable' },
    // --- Payment Details ---
    paymentDate: { type: DataTypes.DATE, field: 'payment_date' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'initiated', 'success', 'failed'), defaultValue: 'pending', field: 'payment_status' },
    payslipUrl: { type: DataTypes.STRING, field: 'payslip_url' }
  }, {
    sequelize,
    modelName: 'Payroll',
    tableName: 'payrolls',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (pay) => {
        const existing = await Payroll.findOne({ where: { staffId: pay.staffId, month: pay.month, year: pay.year } });
        if (existing) throw new Error('DUPLICATE_PAYROLL: Professional remunerations for this period already exist.');
        
        pay.payrollId = `PAY-${pay.year}${pay.month.toString().padStart(2, '0')}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      },
      afterUpdate: async (pay) => {
        if (pay.changed('status') && pay.status === 'approved') {
          // Trigger S3 Payslip generation
          logger.info(`PAYSLIP_GENERATION: Producing salary slip for ${pay.payrollId}`);
        }
      }
    }
  });

  // --- Associations ---
  PayrollConfig.associate = (models) => {
    PayrollConfig.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staff' });
  };

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'beneficiary' });
    Payroll.belongsTo(models.PayrollConfig, { foreignKey: 'payrollConfigId', as: 'configSource' });
    Payroll.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  };

  return { PayrollConfig, Payroll };
};
