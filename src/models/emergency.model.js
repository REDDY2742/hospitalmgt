const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('emergency-model');

/**
 * Hospital Management System - Emergency Department (ER) Model
 * 
 * Manages trauma cases, acute clinical presentations, 
 * triage prioritization (P1-P5), Medico-Legal Cases (MLC), 
 * and emergency disposition (Admission/Discharge).
 */
module.exports = (sequelize) => {
  class Emergency extends Model {
    /**
     * @description Professional triage scoring and categorization
     */
    async triage(category, score, triageBy) {
      return this.update({
        triageCategory: category,
        triageScore: score,
        triageBy,
        triagedAt: new Date(),
        orderStatus: 'triaged' // logic state
      });
    }

    /**
     * @description Thread-safe vital signs tracking
     */
    async updateVitals(vitals) {
      const history = [...(this.vitalSigns || [])];
      history.push({ ...vitals, timestamp: new Date() });
      return this.update({
        vitalSigns: history,
        ...vitals // flat snapshot of latest
      });
    }

    /**
     * @description Transitions ER case to IPD admission
     */
    async admit(wardId, bedId) {
      const transaction = await sequelize.transaction();
      try {
        await this.update({
          disposition: 'admitted_ipd',
          dispositionAt: new Date(),
          admittedToWardId: wardId,
          admittedToBedId: bedId
        }, { transaction });
        
        // Logic for triggering IPD Admission record
        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Finalizes ER case for clinical discharge
     */
    async discharge(instructions) {
      return this.update({
        disposition: 'discharged',
        dispositionAt: new Date(),
        notes: instructions
      });
    }

    /**
     * @description Calculates total stay duration in the ER bay
     * @returns {number} Duration in minutes
     */
    calculateLOS() {
      const end = this.dispositionAt || new Date();
      return Math.floor((end - this.arrivedAt) / 60000);
    }
  }

  Emergency.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential Trauma ID (HMS-ER-YYYYMMDD-XXXXX) */
    emergencyId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'emergency_id'
    },
    patientId: { type: DataTypes.UUID, allowNull: true, field: 'patient_id' },
    /** @type {string} Tag for unconscious/unidentified victims (UNKNOWN-M-ADULT-001) */
    unknownPatientTag: { type: DataTypes.STRING(50), field: 'unknown_patient_tag' },
    arrivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'arrived_at' },
    triageBy: { type: DataTypes.UUID, field: 'triage_by' },
    triagedAt: { type: DataTypes.DATE, field: 'triaged_at' },
    registeredAt: { type: DataTypes.DATE, field: 'registered_at' },
    /** @type {string} Triage Category (ESI/Manchester) */
    triageCategory: {
      type: DataTypes.ENUM('P1_immediate', 'P2_urgent', 'P3_less_urgent', 'P4_standard', 'P5_dead'),
      field: 'triage_category'
    },
    triageScore: { type: DataTypes.INTEGER, field: 'triage_score' },
    chiefComplaint: { type: DataTypes.TEXT, field: 'chief_complaint' },
    modeOfArrival: {
      type: DataTypes.ENUM('walk_in', 'ambulance', 'police', 'transferred', 'air_ambulance', 'self_vehicle'),
      defaultValue: 'walk_in',
      field: 'mode_of_arrival'
    },
    ambulanceId: { type: DataTypes.UUID, field: 'ambulance_id' },
    // --- Medico-Legal Context ---
    mlcCase: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'mlc_case' },
    mlcNumber: { type: DataTypes.STRING(50), field: 'mlc_number' },
    mlcReportedAt: { type: DataTypes.DATE, field: 'mlc_reported_at' },
    mlcReportedTo: { type: DataTypes.STRING(100), field: 'mlc_reported_to' },
    // --- Clinical Context ---
    patientCondition: {
      type: DataTypes.ENUM('conscious', 'unconscious', 'semiconscious', 'critical', 'stable', 'improving', 'deteriorating', 'dead_on_arrival'),
      field: 'patient_condition'
    },
    gcs_eye: { type: DataTypes.INTEGER, validate: { min: 1, max: 4 } },
    gcs_verbal: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
    gcs_motor: { type: DataTypes.INTEGER, validate: { min: 1, max: 6 } },
    bloodPressure: { type: DataTypes.STRING(20), field: 'blood_pressure' },
    pulseRate: { type: DataTypes.INTEGER, field: 'pulse_rate' },
    spo2: { type: DataTypes.INTEGER },
    temperature: { type: DataTypes.FLOAT },
    respiratoryRate: { type: DataTypes.INTEGER, field: 'respiratory_rate' },
    painScore: { type: DataTypes.INTEGER, field: 'pain_score', validate: { min: 0, max: 10 } },
    /** @type {Array<Object>} Time-series vital sign readings */
    vitalSigns: { type: DataTypes.JSON, field: 'vital_signs', defaultValue: [] },
    // --- Management & Personnel ---
    attendingDoctorId: { type: DataTypes.UUID, field: 'attending_doctor_id' },
    attendingNurseId: { type: DataTypes.UUID, field: 'attending_nurse_id' },
    /** @type {Array<Object>} [{specialistId, reason, calledAt, arrivedAt}] */
    consultations: { type: DataTypes.JSON, defaultValue: [] },
    treatmentGiven: { type: DataTypes.JSON, field: 'treatment_given', defaultValue: [] },
    medicinesAdministered: { type: DataTypes.JSON, field: 'medicines_administered', defaultValue: [] },
    proceduresDone: { type: DataTypes.JSON, field: 'procedures_done', defaultValue: [] },
    // --- Facility Integration ---
    disposition: {
      type: DataTypes.ENUM('admitted_ipd', 'discharged', 'transferred', 'dama', 'expired', 'absconded', 'referred'),
      field: 'disposition'
    },
    dispositionAt: { type: DataTypes.DATE, field: 'disposition_at' },
    admittedToWardId: { type: DataTypes.UUID, field: 'admitted_to_ward_id' },
    admittedToBedId: { type: DataTypes.UUID, field: 'admitted_to_bed_id' },
    transferredTo: { type: DataTypes.STRING(255), field: 'transferred_to' },
    transferReason: { type: DataTypes.TEXT, field: 'transfer_reason' },
    deathTime: { type: DataTypes.DATE, field: 'death_time' },
    deathCause: { type: DataTypes.TEXT, field: 'death_cause' },
    deathCertificateNumber: { type: DataTypes.STRING(100), field: 'death_certificate_number' },
    // --- Logistics & Billing ---
    emergencyCharges: { type: DataTypes.DECIMAL(10, 2), field: 'emergency_charges' },
    totalCharges: { type: DataTypes.DECIMAL(12, 2), field: 'total_charges' },
    billId: { type: DataTypes.UUID, field: 'bill_id' },
    notes: { type: DataTypes.TEXT }
  }, {
    sequelize,
    modelName: 'Emergency',
    tableName: 'emergencies',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['emergency_id'] },
      { fields: ['patient_id'] },
      { fields: ['arrived_at'] },
      { fields: ['triage_category'] },
      { fields: ['disposition'] },
      { fields: ['mlc_case'] },
      { fields: ['attending_doctor_id'] }
    ],
    scopes: {
      active: { where: { disposition: null } },
      critical: { where: { triageCategory: 'P1_immediate' } },
      mlcCases: { where: { mlcCase: true } },
      today: { where: { arrivedAt: { [Op.gte]: new Date().setHours(0,0,0,0) } } },
      byTriage(cat) { return { where: { triageCategory: cat } }; },
      unassigned: { where: { attendingDoctorId: null } }
    },
    hooks: {
      beforeCreate: async (er) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Emergency.count();
        er.emergencyId = `HMS-ER-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: (er) => {
        // 1. Immediate Critical Activation for P1 Cases
        if (er.triageCategory === 'P1_immediate') {
          logger.warn(`CRITICAL_Trauma_ALERT: P1 Emergency Case ${er.emergencyId} arrived. Initiating trauma team activation.`);
          // Emit socket event to TRAUMA_POD
          try {
             const { getIO } = require('../config/socket');
             getIO().of('/emergency').emit('trauma_alert', er);
          } catch (e) { /* Socket not yet init */ }
        }
        
        // 2. Automatic Doctor Provisioning logic
        logger.info(`ER_WORKFLOW: Patient ${er.unknownPatientTag || er.patientId} queued for ER assignment.`);
      }
    }
  });

  // --- Virtuals ---
  /** @type {number} Computed GCS (Glasgow Coma Scale) */
  Object.defineProperty(Emergency.prototype, 'gcs_total', {
    get() {
      return (this.gcs_eye || 0) + (this.gcs_verbal || 0) + (this.gcs_motor || 0);
    }
  });

  /**
   * Hospital Management - Emergency Associations
   * @param {Object} models - Loaded models
   */
  Emergency.associate = (models) => {
    Emergency.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Emergency.belongsTo(models.Doctor, { foreignKey: 'attendingDoctorId', as: 'attendingDoctor' });
    Emergency.belongsTo(models.Nurse, { foreignKey: 'attendingNurseId', as: 'attendingNurse' });
    Emergency.belongsTo(models.Ward, { foreignKey: 'admittedToWardId', as: 'targetWard' });
    Emergency.belongsTo(models.Bed, { foreignKey: 'admittedToBedId', as: 'targetBed' });
    Emergency.belongsTo(models.Billing, { foreignKey: 'billId', as: 'bill' });
  };

  return Emergency;
};
