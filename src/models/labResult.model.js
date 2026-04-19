const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('lab-result-model');

/**
 * Hospital Management System - Laboratory Order & Result Model
 * 
 * Manages the entire diagnostic lifecycle: Ordering -> Collection -> 
 * Processing -> Result Entry -> Verification -> Reporting.
 */
module.exports = (sequelize) => {
  class LabResult extends Model {
    /**
     * @description Transitions order to sample collected state
     */
    async collectSample(collectedBy, sampleCondition = 'adequate') {
      return this.update({
        orderStatus: 'sample_collected',
        sampleCollectedAt: new Date(),
        sampleCollectedBy: collectedBy,
        sampleCondition
      });
    }

    /**
     * @description Professional result entry with clinical flagging
     */
    async enterResults(resultsArray, technicianId) {
      // Logic for comparing results vs reference ranges from LabTest model
      return this.update({
        results: resultsArray,
        resultEnteredAt: new Date(),
        resultEnteredBy: technicianId,
        orderStatus: 'resulted'
      });
    }

    /**
     * @description Seniors verification step for clinical accuracy
     */
    async verifResults(seniorTechId) {
      return this.update({
        orderStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: seniorTechId
      });
    }

    /**
     * @description Immediate check for life-threatening values
     * @returns {boolean} True if critical values found
     */
    checkCriticalValues() {
      if (!this.results) return false;
      return this.results.some(res => res.isCritical === true);
    }

    /**
     * @description Orchestrates the delivery of finalized reports
     */
    async deliverReport(method) {
      return this.update({
        orderStatus: 'reported',
        reportedAt: new Date(),
        deliveredAt: new Date(),
        deliveryMethod: method
      });
    }
  }

  LabResult.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Forensic Lab ID (LAB-ORD-YYYYMMDD-XXXXX) */
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'order_number'
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id', comment: 'Ordering Clinician' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    labTestId: { type: DataTypes.UUID, allowNull: false, field: 'lab_test_id' },
    orderStatus: {
      type: DataTypes.ENUM('ordered', 'sample_collected', 'sample_received', 'processing', 'resulted', 'verified', 'reported', 'cancelled'),
      defaultValue: 'ordered',
      field: 'order_status'
    },
    priority: {
      type: DataTypes.ENUM('routine', 'urgent', 'stat', 'critical'),
      defaultValue: 'routine'
    },
    // --- Lifecycle Timestamps ---
    orderedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'ordered_at' },
    sampleCollectedAt: { type: DataTypes.DATE, field: 'sample_collected_at' },
    sampleCollectedBy: { type: DataTypes.UUID, field: 'sample_collected_by' },
    sampleReceivedAt: { type: DataTypes.DATE, field: 'sample_received_at' },
    sampleReceivedBy: { type: DataTypes.UUID, field: 'sample_received_by' },
    processingStartedAt: { type: DataTypes.DATE, field: 'processing_started_at' },
    processedAt: { type: DataTypes.DATE, field: 'processed_at' },
    resultEnteredAt: { type: DataTypes.DATE, field: 'result_entered_at' },
    resultEnteredBy: { type: DataTypes.UUID, field: 'result_entered_by' },
    verifiedAt: { type: DataTypes.DATE, field: 'verified_at' },
    verifiedBy: { type: DataTypes.UUID, field: 'verified_by' },
    reportedAt: { type: DataTypes.DATE, field: 'reported_at' },
    deliveredAt: { type: DataTypes.DATE, field: 'delivered_at' },
    deliveryMethod: {
      type: DataTypes.ENUM('portal', 'email', 'whatsapp', 'counter', 'hl7'),
      field: 'delivery_method'
    },
    // --- Clinical Context ---
    clinicalInfo: { type: DataTypes.TEXT, field: 'clinical_info' },
    sampleCondition: {
      type: DataTypes.ENUM('adequate', 'hemolyzed', 'lipemic', 'icteric', 'clotted', 'insufficient', 'rejected'),
      field: 'sample_condition'
    },
    sampleRejectionReason: { type: DataTypes.STRING, field: 'sample_rejection_reason' },
    // --- Technical Results Ledger ---
    /** @type {Array<Object>} JSON Results Matrix [{parameterName, value, unit, flag, isCritical}] */
    results: { type: DataTypes.JSON, defaultValue: [] },
    interpretation: { type: DataTypes.TEXT },
    recommendations: { type: DataTypes.TEXT },
    remarks: { type: DataTypes.TEXT },
    criticalValueNotifiedAt: { type: DataTypes.DATE, field: 'critical_value_notified_at' },
    criticalValueNotifiedTo: { type: DataTypes.STRING, field: 'critical_value_notified_to' },
    labTechnicianNotes: { type: DataTypes.TEXT, field: 'lab_technician_notes' },
    // --- File Integrity ---
    reportFileUrl: { type: DataTypes.STRING, field: 'report_file_url' },
    rawDataFileUrl: { type: DataTypes.STRING, field: 'raw_data_file_url' },
    imageUrls: { type: DataTypes.JSON, field: 'image_urls', defaultValue: [] },
    // --- Financials ---
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    isCharged: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_charged' },
    paymentId: { type: DataTypes.UUID, field: 'payment_id' }
  }, {
    sequelize,
    modelName: 'LabResult',
    tableName: 'lab_results',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['order_number'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['order_status'] },
      { fields: ['priority'] },
      { fields: ['ordered_at'] },
      { fields: ['lab_test_id'] }
    ],
    scopes: {
      pending: { where: { orderStatus: { [Op.notIn]: ['reported', 'cancelled'] } } },
      critical: { where: { priority: 'critical' } },
      unverified: { where: { orderStatus: 'resulted' } },
      today: { where: { orderedAt: { [Op.gte]: new Date().setHours(0,0,0,0) } } },
      byPatient(id) { return { where: { patientId: id } }; },
      byDoctor(id) { return { where: { doctorId: id } }; }
    },
    hooks: {
      beforeCreate: async (order) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await LabResult.count();
        order.orderNumber = `LAB-ORD-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterUpdate: async (order) => {
        // 1. Critical Value Safety Protocol
        if (order.changed('results') && order.checkCriticalValues()) {
          logger.warn(`CRITICAL_LAB_RESULT: Immediate physician notification required for Order ${order.orderNumber}`);
          // Broadcase socket event to nursing station and ordering doctor
        }
        
        // 2. Automated Completion Notification
        if (order.changed('orderStatus') && order.orderStatus === 'reported') {
          logger.info(`LAB_REPORT_READY: Notifying Patient ${order.patientId} and Doctor ${order.doctorId}`);
        }
      }
    }
  });

  /**
   * Hospital Management - Lab Result Associations
   * @param {Object} models - Loaded models
   */
  LabResult.associate = (models) => {
    LabResult.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    LabResult.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'orderingDoctor' });
    LabResult.belongsTo(models.LabTest, { foreignKey: 'labTestId', as: 'test' });
    LabResult.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    LabResult.belongsTo(models.User, { foreignKey: 'verifiedBy', as: 'verifier' });
  };

  return LabResult;
};
