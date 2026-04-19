const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('billing-model');

/**
 * Hospital Management System - Revenue Cycle Management (RCM) Model
 * 
 * Manages institutional billing, tax compliance (GST), 
 * insurance claim lifecycles, and diverse charge categories.
 */
module.exports = (sequelize) => {
  class Billing extends Model {
    /**
     * @description Core arithmetic engine for tax and total computations
     */
    calculateTotals() {
      const breakdown = this.chargesBreakdown || {};
      const subtotal = Object.values(breakdown).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      const discountAmount = (subtotal * (this.discountPercentage || 0)) / 100;
      const taxableAmount = subtotal - discountAmount;
      
      const cgst = (taxableAmount * 6) / 100; // Assuming dynamic GST config in real app
      const sgst = (taxableAmount * 6) / 100;
      const totalTax = cgst + sgst;
      
      const totalAmount = taxableAmount + totalTax;
      const pendingAmount = totalAmount - (this.paidAmount || 0) - (this.insuranceCovered || 0);

      return this.update({
        subtotal,
        discountAmount,
        taxableAmount,
        cgst,
        sgst,
        totalTax,
        totalAmount: Math.round(totalAmount),
        pendingAmount
      });
    }

    /**
     * @description Appends a specific charge line to the breakdown
     */
    async addCharge(chargeType, amount) {
      const breakdown = { ...this.chargesBreakdown };
      breakdown[chargeType] = (breakdown[chargeType] || 0) + parseFloat(amount);
      this.chargesBreakdown = breakdown;
      return this.calculateTotals();
    }

    /**
     * @description Transitions bill to paid status and triggers receipt orchestration
     */
    async finalizePayment(amount, method) {
      const newPaid = (this.paidAmount || 0) + parseFloat(amount);
      const status = newPaid >= this.totalAmount ? 'paid' : 'partially_paid';
      
      return this.update({
        paidAmount: newPaid,
        status,
        finalizedAt: status === 'paid' ? new Date() : null
      });
    }

    /**
     * @description Generates a GST-compliant tax invoice PDF
     */
    async generateInvoicePDF() {
      const pdfUtil = require('../utils/pdf.util');
      return pdfUtil.generateTaxInvoice(this);
    }
  }

  Billing.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Fiscal Invoice ID (HMS-BILL-YYYYMMDD-XXXXX) */
    billNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'bill_number'
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    billType: {
      type: DataTypes.ENUM('opd', 'ipd', 'emergency', 'pharmacy', 'laboratory', 'procedure', 'package', 'advance', 'refund', 'misc'),
      defaultValue: 'opd',
      field: 'bill_type'
    },
    billDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'bill_date' },
    dueDate: { type: DataTypes.DATE, field: 'due_date' },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded', 'written_off'),
      defaultValue: 'draft'
    },
    billingCycleType: {
      type: DataTypes.ENUM('daily', 'discharge', 'procedure', 'emergency'),
      field: 'billing_cycle_type'
    },
    // --- Charge Matrix ---
    /** @type {Object} Structured JSON for various institutional charges */
    chargesBreakdown: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'charges_breakdown',
      comment: 'Breakdown of Room, Nursing, Lab, Medicine, etc.'
    },
    // --- Financial Ledger ---
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    discountPercentage: { type: DataTypes.FLOAT, defaultValue: 0, field: 'discount_percentage' },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'discount_amount' },
    discountReason: { type: DataTypes.STRING, field: 'discount_reason' },
    discountApprovedBy: { type: DataTypes.UUID, field: 'discount_approved_by' },
    taxableAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'taxable_amount' },
    cgst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    sgst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    igst: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_tax' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_amount' },
    advanceReceived: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'advance_received' },
    paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'paid_amount' },
    // --- Insurance Ecology ---
    hasInsurance: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_insurance' },
    insuranceId: { type: DataTypes.UUID, field: 'insurance_id' },
    claimNumber: { type: DataTypes.STRING(50), field: 'claim_number' },
    claimStatus: {
      type: DataTypes.ENUM('not_applied', 'pending', 'approved', 'partially_approved', 'rejected', 'settled'),
      defaultValue: 'not_applied',
      field: 'claim_status'
    },
    preAuthAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'pre_auth_amount' },
    approvedAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'approved_amount' },
    insuranceCovered: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'insurance_covered' },
    insuranceDocs: { type: DataTypes.JSON, defaultValue: [], field: 'insurance_docs' },
    // --- Compliance & Audit ---
    isCreditNote: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_credit_note' },
    originalBillId: { type: DataTypes.UUID, field: 'original_bill_id' },
    generatedBy: { type: DataTypes.UUID, field: 'generated_by' },
    finalizedBy: { type: DataTypes.UUID, field: 'finalized_by' },
    finalizedAt: { type: DataTypes.DATE, field: 'finalized_at' },
    notes: { type: DataTypes.TEXT },

    // --- Virtuals ---
    pendingAmount: {
      type: DataTypes.VIRTUAL,
      get() {
        return Math.max(0, this.totalAmount - this.paidAmount - this.insuranceCovered);
      }
    }
  }, {
    sequelize,
    modelName: 'Billing',
    tableName: 'billings',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['bill_number'] },
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['bill_date'] },
      { fields: ['bill_type'] },
      { fields: ['admission_id'] }
    ],
    scopes: {
      pending: { where: { status: { [Op.in]: ['draft', 'generated', 'sent', 'partially_paid'] } } },
      paid: { where: { status: 'paid' } },
      overdue: { where: { status: 'overdue' } },
      insurance: { where: { hasInsurance: true } },
      byPatient(id) { return { where: { patientId: id } }; },
      byType(type) { return { where: { billType: type } }; }
    },
    hooks: {
      beforeCreate: async (bill) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Billing.count();
        bill.billNumber = `HMS-BILL-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (bill) => {
        // Implementation for auto-populating charges from linked appointment/admission
        logger.info(`RCM_INIT: Generated bill ${bill.billNumber} for Patient ${bill.patientId}`);
      },
      afterUpdate: (bill) => {
        if (bill.changed('status') && bill.status === 'paid') {
          logger.info(`REVENUE_LOG: Bill ${bill.billNumber} settled. Triggering financial reporting.`);
        }
      }
    }
  });

  /**
   * Hospital Management - Billing Associations
   * @param {Object} models - Loaded models
   */
  Billing.associate = (models) => {
    Billing.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Billing.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    Billing.hasMany(models.Payment, { foreignKey: 'billingId', as: 'payments' });
  };

  return Billing;
};
