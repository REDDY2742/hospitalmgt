const { Model, DataTypes, Op } = require('sequelize');
const schedule = require('node-schedule');
const logger = require('../utils/logger.util').createChildLogger('insurance-model');

/**
 * Hospital Management System - Healthcare Insurance & TPA Model
 * 
 * Orchestrates patient policy management, coverage logic, 
 * pre-authorization workflows, and claim tracking.
 */
module.exports = (sequelize) => {
  class Insurance extends Model {
    /**
     * @description Temporal activity check
     */
    isValidForDate(date = new Date()) {
      const target = new Date(date);
      return target >= new Date(this.policyStartDate) && target <= new Date(this.policyEndDate);
    }

    /**
     * @description Clinical coverage calculator applying sub-limits and co-pays
     */
    checkCoverage(treatmentType, amount) {
      if (!this.isActive) return { coverage: 0, reason: 'POLICY_INACTIVE' };
      
      const limits = this.subLimits || {};
      const cap = limits[treatmentType] || Infinity;
      const effectiveAmount = Math.min(amount, cap);
      
      const copay = (effectiveAmount * (this.copayPercentage || 0)) / 100;
      const payable = Math.max(0, effectiveAmount - copay - (this.deductibleAmount || 0));
      
      return {
        originalAmount: amount,
        cappedAmount: effectiveAmount,
        copayAmount: copay,
        deductibleApplied: this.deductibleAmount,
        netPayable: Math.min(payable, this.balanceSumInsured)
      };
    }

    /**
     * @description Generates a pre-authorization data structure for the TPA portal
     */
    async initiatePreAuth(admissionId, estimatedCost) {
      const coverage = this.checkCoverage('ipd', estimatedCost);
      return {
        policyNumber: this.policyNumber,
        tpaMemberId: this.tpaMemberId,
        admissionId,
        estimatedCost,
        estimatedCoverage: coverage.netPayable,
        status: 'draft'
      };
    }

    /**
     * @description Calculates current renewal proximity
     */
    checkRenewalDue() {
      const today = new Date();
      const end = new Date(this.policyEndDate);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
  }

  Insurance.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    insuranceProvider: { type: DataTypes.STRING(255), allowNull: false, field: 'insurance_provider' },
    insuranceType: {
      type: DataTypes.ENUM('individual', 'family_floater', 'group', 'government_ayushman', 'echs', 'cghs', 'esic', 'other'),
      defaultValue: 'individual',
      field: 'insurance_type'
    },
    policyNumber: { type: DataTypes.STRING(100), allowNull: false, field: 'policy_number' },
    policyHolderName: { type: DataTypes.STRING(100), field: 'policy_holder_name' },
    policyHolderRelation: {
      type: DataTypes.ENUM('self', 'spouse', 'father', 'mother', 'son', 'daughter', 'other'),
      defaultValue: 'self',
      field: 'policy_holder_relation'
    },
    sumInsured: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'sum_insured' },
    familyFloaterAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'family_floater_amount' },
    copayPercentage: { type: DataTypes.FLOAT, defaultValue: 0, field: 'copay_percentage' },
    deductibleAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'deductible_amount' },
    policyStartDate: { type: DataTypes.DATEONLY, field: 'policy_start_date' },
    policyEndDate: { type: DataTypes.DATEONLY, field: 'policy_end_date' },
    gracePeriodDays: { type: DataTypes.INTEGER, defaultValue: 30, field: 'grace_period_days' },
    // --- TPA Infrastructure ---
    tpaName: { type: DataTypes.STRING(100), field: 'tpa_name' },
    tpaId: { type: DataTypes.STRING(50), field: 'tpa_id' },
    tpaMemberId: { type: DataTypes.STRING(50), field: 'tpa_member_id' },
    networkHospital: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'network_hospital' },
    cashlessEligible: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'cashless_eligible' },
    reimbursementEligible: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'reimbursement_eligible' },
    // --- Waiting Periods & Exclusions ---
    preExistingWaitingPeriod: { type: DataTypes.INTEGER, field: 'pre_existing_waiting_period' },
    matWaitingPeriod: { type: DataTypes.INTEGER, field: 'mat_waiting_period' },
    /** @type {Array<Object>} [{disease, waitingMonths}] */
    specificDiseaseWaiting: { type: DataTypes.JSON, defaultValue: [], field: 'specific_disease_waiting' },
    exclusions: { type: DataTypes.JSON, defaultValue: [] },
    inclusions: { type: DataTypes.JSON, defaultValue: [] },
    /** @type {Object} {roomRent, icu, daycare, ambulance...} */
    subLimits: { type: DataTypes.JSON, defaultValue: {}, field: 'sub_limits' },
    // --- Documents & Renewal ---
    policyDocument: { type: DataTypes.STRING, field: 'policy_document' },
    idCard: { type: DataTypes.STRING, field: 'id_card' },
    lastRenewalDate: { type: DataTypes.DATEONLY, field: 'last_renewal_date' },
    nextRenewalDate: { type: DataTypes.DATEONLY, field: 'next_renewal_date' },
    premiumAmount: { type: DataTypes.DECIMAL(12, 2), field: 'premium_amount' },
    premiumPaymentMode: { type: DataTypes.STRING(50), field: 'premium_payment_mode' },
    // --- Utilization ---
    /** @type {Array<Object>} [{year, claimAmount, settled}] */
    claimsHistory: { type: DataTypes.JSON, defaultValue: [], field: 'claims_history' },
    totalClaimedThisYear: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'total_claimed_this_year' },
    notes: { type: DataTypes.TEXT }
  }, {
    sequelize,
    modelName: 'Insurance',
    tableName: 'insurances',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['policy_number', 'patient_id'] },
      { fields: ['patient_id'] },
      { fields: ['tpa_member_id'] },
      { fields: ['policy_end_date'] },
      { fields: ['insurance_provider'] }
    ],
    scopes: {
      active: { 
        where: { 
          policyEndDate: { [Op.gte]: new Date() },
          policyStartDate: { [Op.lte]: new Date() }
        } 
      },
      cashless: { where: { cashlessEligible: true, networkHospital: true } },
      government: { where: { insuranceType: { [Op.like]: '%government%' } } },
      expiringSoon: {
        where: {
          policyEndDate: { [Op.between]: [new Date(), new Date(new Date().setDate(new Date().getDate() + 30))] }
        }
      }
    },
    hooks: {
      afterCreate: (ins) => {
        // Schedule Institutional Renewal Reminders
        const expiryDate = new Date(ins.policyEndDate);
        
        // 30 Days Reminder
        const alert30 = new Date(expiryDate);
        alert30.setDate(alert30.getDate() - 30);
        if (alert30 > new Date()) {
          schedule.scheduleJob(alert30, () => {
             logger.info(`RENEWAL_ALERT: Policy ${ins.policyNumber} expires in 30 days.`);
          });
        }
      }
    }
  });

  // --- Virtuals ---
  /** @type {boolean} Reactive activity state */
  Object.defineProperty(Insurance.prototype, 'isActive', {
    get() {
      const today = new Date();
      return today >= new Date(this.policyStartDate) && today <= new Date(this.policyEndDate);
    }
  });

  /** @type {number} Current usable balance */
  Object.defineProperty(Insurance.prototype, 'balanceSumInsured', {
    get() {
      return (this.sumInsured || 0) - (this.totalClaimedThisYear || 0);
    }
  });

  /**
   * Hospital Management - Insurance Associations
   * @param {Object} models - Loaded models
   */
  Insurance.associate = (models) => {
    Insurance.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Insurance.hasMany(models.Billing, { foreignKey: 'insuranceId', as: 'policyBills' });
  };

  return Insurance;
};
