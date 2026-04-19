const { Model, DataTypes, Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger.util').createChildLogger('payment-model');

/**
 * Hospital Management System - Payment & Transaction Model
 * 
 * Orchestrates financial settlement across multiple gateways (Razorpay, Stripe)
 * and physical collection points (Cashier/POS).
 */
module.exports = (sequelize) => {
  class Payment extends Model {
    /**
     * @description Cryptographically verifies the digital signature from Razorpay/Gateways
     * @param {string} body - Webhook/Response raw body
     * @param {string} signature - Signature from header/meta
     * @returns {boolean}
     */
    verifyGatewaySignature(body, signature) {
      if (this.gatewayName !== 'razorpay') return true; // Other gateways logic placeholder
      
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret')
        .update(body)
        .digest('hex');
      
      return expected === signature;
    }

    /**
     * @description Generates a clinical-financial receipt PDF
     */
    async generateReceipt() {
      const pdfUtil = require('../utils/pdf.util');
      return pdfUtil.generatePaymentReceipt(this);
    }

    /**
     * @description Atomically transition to verified state by administrative personnel
     */
    async markVerified(verifiedBy) {
      return this.update({
        verifiedAt: new Date(),
        verifiedBy,
        paymentStatus: 'success'
      });
    }

    // --- Class Methods ---

    /**
     * @description Aggregates cash intake for end-of-day cashier settlement
     */
    static async getDailyCashCollection(date, cashierId) {
      return this.sum('amount', {
        where: {
          cashierId,
          paymentMode: 'cash',
          paymentStatus: 'success',
          paidAt: {
            [Op.gte]: new Date(date).setHours(0,0,0,0),
            [Op.lte]: new Date(date).setHours(23,59,59,999)
          }
        }
      });
    }

    /**
     * @description Returns fiscal distribution across all payment methods
     */
    static async getPaymentSummaryByMode(startDate, endDate) {
      return this.findAll({
        attributes: [
          'paymentMode',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
        ],
        where: {
          paymentStatus: 'success',
          paidAt: { [Op.between]: [startDate, endDate] }
        },
        group: ['paymentMode']
      });
    }
  }

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Forensic Transaction ID (HMS-PAY-YYYYMMDD-XXXXX) */
    paymentNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'payment_number'
    },
    billId: { type: DataTypes.UUID, allowNull: false, field: 'bill_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paymentMode: {
       type: DataTypes.ENUM('cash', 'card_credit', 'card_debit', 'upi', 'netbanking', 'cheque', 'dd', 'neft', 'rtgs', 'insurance', 'wallet', 'advance_adjustment', 'package', 'waiver'),
       allowNull: false,
       field: 'payment_mode'
    },
    paymentStatus: {
      type: DataTypes.ENUM('initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
      defaultValue: 'initiated',
      field: 'payment_status'
    },
    // --- Gateway Parameters ---
    transactionId: { type: DataTypes.STRING, field: 'transaction_id', comment: 'Provider Ref' },
    gatewayName: {
      type: DataTypes.ENUM('razorpay', 'paytm', 'phonepe', 'stripe', 'manual'),
      defaultValue: 'manual',
      field: 'gateway_name'
    },
    gatewayOrderId: { type: DataTypes.STRING, field: 'gateway_order_id' },
    gatewayPaymentId: { type: DataTypes.STRING, field: 'gateway_payment_id' },
    gatewaySignature: { type: DataTypes.TEXT, field: 'gateway_signature' },
    // --- Personnel & Post Logic ---
    paidBy: { type: DataTypes.STRING(100), field: 'paid_by' },
    paidByRelation: { type: DataTypes.STRING(50), field: 'paid_by_relation' },
    cashierId: { type: DataTypes.UUID, field: 'cashier_id' },
    terminalId: { type: DataTypes.STRING(50), field: 'terminal_id' },
    // --- Instrument Specifics ---
    chequeNumber: { type: DataTypes.STRING(20), field: 'cheque_number' },
    chequeDate: { type: DataTypes.DATEONLY, field: 'cheque_date' },
    chequeBank: { type: DataTypes.STRING(100), field: 'cheque_bank' },
    neftUTR: { type: DataTypes.STRING(50), field: 'neft_utr' },
    receiptNumber: { type: DataTypes.STRING(50), field: 'receipt_number' },
    paidAt: { type: DataTypes.DATE, field: 'paid_at' },
    verifiedAt: { type: DataTypes.DATE, field: 'verified_at' },
    verifiedBy: { type: DataTypes.UUID, field: 'verified_by' },
    // --- Refund & Reversal ---
    isRefund: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_refund' },
    originalPaymentId: { type: DataTypes.UUID, field: 'original_payment_id' },
    refundReason: { type: DataTypes.STRING, field: 'refund_reason' },
    refundTransactionId: { type: DataTypes.STRING, field: 'refund_transaction_id' },
    metadata: { type: DataTypes.JSON, defaultValue: {} }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['payment_number'] },
      { fields: ['bill_id'] },
      { fields: ['transaction_id'] },
      { fields: ['payment_status'] },
      { fields: ['paid_at'] },
      { fields: ['cashier_id'] }
    ],
    scopes: {
      successful: { where: { paymentStatus: 'success' } },
      pending: { where: { paymentStatus: 'pending' } },
      refunded: { where: { isRefund: true } },
      today: { where: { paidAt: { [Op.gte]: new Date().setHours(0,0,0,0) } } },
      byCashier(id) { return { where: { cashierId: id } }; },
      byMode(mode) { return { where: { paymentMode: mode } }; }
    },
    hooks: {
      beforeCreate: async (pay) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Payment.count();
        pay.paymentNumber = `HMS-PAY-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (pay) => {
        // Rollup Amount to Billing Model
        if (pay.paymentStatus === 'success' && sequelize.models.Billing) {
          const bill = await sequelize.models.Billing.findByPk(pay.billId);
          if (bill) await bill.finalizePayment(pay.amount, pay.paymentMode);
        }
        
        // Audit Logging
        logger.info(`FINANCIAL_TRANS: Initiated payment ${pay.paymentNumber} for Bill ${pay.billId}`);
      },
      afterUpdate: async (pay) => {
        if (pay.changed('paymentStatus') && pay.paymentStatus === 'success') {
          // Trigger Receipt Generation & Master Bill Update
          if (sequelize.models.Billing) {
             const bill = await sequelize.models.Billing.findByPk(pay.billId);
             if (bill) await bill.finalizePayment(pay.amount, pay.paymentMode);
          }
          logger.info(`PAYMENT_SUCCESS: Trans ${pay.paymentNumber} settled.`);
        }
      }
    }
  });

  /**
   * Hospital Management - Payment Associations
   * @param {Object} models - Loaded models
   */
  Payment.associate = (models) => {
    Payment.belongsTo(models.Billing, { foreignKey: 'billId', as: 'bill' });
    Payment.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Payment.belongsTo(models.User, { foreignKey: 'cashierId', as: 'cashier' });
    Payment.belongsTo(models.Payment, { foreignKey: 'originalPaymentId', as: 'originalPayment' });
  };

  return Payment;
};
