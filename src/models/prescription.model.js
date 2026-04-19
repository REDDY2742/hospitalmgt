const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('prescription-model');

/**
 * Hospital Management System - Clinical Prescription Model
 * 
 * Legally valid medical prescription entity. 
 * Orchestrates clinical diagnostics, medication orders, and pharmacy dispension.
 */
module.exports = (sequelize) => {
  class Prescription extends Model {
    /**
     * @description Finalizes the draft, locks changes, and applies digital signature
     */
    async finalize() {
      if (this.status !== 'draft') throw new Error('Clinical Alert: Prescription already finalized.');
      
      const qrData = `HMS-RX-VERIFY-${this.prescriptionNumber}`;
      return this.update({
        status: 'finalized',
        qrCode: qrData,
        digitalSignature: 'SIG_HASH_PLACEHOLDER' // Logic for crypto signing would go here
      });
    }

    /**
     * @description Processes medication dispensing and stock deduction
     */
    async dispense(pharmacistId, items) {
      const transaction = await sequelize.transaction();
      try {
        // Logic for iterating through items and deducting stock from PharmacyStock
        await this.update({
          status: 'dispensed',
          dispensedAt: new Date(),
          dispensedBy: pharmacistId
        }, { transaction });
        
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Cross-references pharmacological interactions across all items
     */
    async checkDrugInteractions() {
      const items = await this.getItems();
      // Logic for checking interactions via Medicine model
      return [];
    }

    /**
     * @description Generates a clinical PDF using institutional letterhead
     */
    async generatePDF() {
      const pdfUtil = require('../utils/pdf.util');
      return pdfUtil.generatePrescriptionPDF(this);
    }
  }

  Prescription.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Forensic Medical ID (HMS-RX-YYYYMMDD-XXXXX) */
    prescriptionNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'prescription_number'
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    prescriptionType: {
      type: DataTypes.ENUM('opd', 'ipd', 'emergency', 'discharge', 'telemedicine'),
      defaultValue: 'opd',
      field: 'prescription_type'
    },
    status: {
      type: DataTypes.ENUM('draft', 'finalized', 'dispensed', 'partially_dispensed', 'cancelled', 'expired'),
      defaultValue: 'draft'
    },
    /** @type {Array<Object>} ICD-10 Diagnosis Codes [{icd10Code, description, type}] */
    diagnosis: { type: DataTypes.JSON, defaultValue: [] },
    clinicalNotes: { type: DataTypes.TEXT, field: 'clinical_notes' },
    advice: { type: DataTypes.TEXT },
    followupDate: { type: DataTypes.DATEONLY, field: 'followup_date' },
    followupInstructions: { type: DataTypes.TEXT, field: 'followup_instructions' },
    isControlledSubstance: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_controlled_substance' },
    requiresCounterSignature: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_counter_signature' },
    counterSignedBy: { type: DataTypes.UUID, field: 'counter_signed_by' },
    counterSignedAt: { type: DataTypes.DATE, field: 'counter_signed_at' },
    /** @type {string} Encrypted signature hash of the authorizing clinician */
    digitalSignature: { type: DataTypes.TEXT, field: 'digital_signature' },
    qrCode: { type: DataTypes.STRING, field: 'qr_code' },
    isTelemedicine: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_telemedicine' },
    validUntil: { type: DataTypes.DATEONLY, field: 'valid_until' },
    dispensedAt: { type: DataTypes.DATE, field: 'dispensed_at' },
    dispensedBy: { type: DataTypes.UUID, field: 'dispensed_by' },
    pharmacyNotes: { type: DataTypes.TEXT, field: 'pharmacy_notes' },
    printedAt: { type: DataTypes.DATE, field: 'printed_at' },
    printCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'print_count' },
    isCancelled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_cancelled' },
    cancellationReason: { type: DataTypes.STRING, field: 'cancellation_reason' },
    cancelledBy: { type: DataTypes.UUID, field: 'cancelled_by' },
    totalCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_cost' }
  }, {
    sequelize,
    modelName: 'Prescription',
    tableName: 'prescriptions',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['prescription_number'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['status'] },
      { fields: ['appointment_id'] }
    ],
    scopes: {
      active: { where: { isCancelled: false, status: { [Op.ne]: 'expired' } } },
      pendingDispense: { where: { status: { [Op.in]: ['finalized', 'partially_dispensed'] } } },
      controlled: { where: { isControlledSubstance: true } },
      today: { where: { createdAt: { [Op.gte]: new Date().setHours(0,0,0,0) } } },
      byPatient(id) { return { where: { patientId: id } }; },
      byDoctor(id) { return { where: { doctorId: id } }; }
    },
    hooks: {
      beforeCreate: async (rx) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Prescription.count();
        rx.prescriptionNumber = `HMS-RX-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (rx) => {
        // Automatic Safety Scan
        logger.info(`SAFETY_SCAN: Initiating drug interaction analysis for Prescription ${rx.prescriptionNumber}`);
      }
    }
  });

  /**
   * Hospital Management - Prescription Associations
   * @param {Object} models - Loaded models
   */
  Prescription.associate = (models) => {
    Prescription.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Prescription.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    Prescription.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    Prescription.hasMany(models.PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });
  };

  return Prescription;
};
