const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('medical-record-model');

/**
 * Hospital Management System - Electronic Health Record (EHR) Model
 * 
 * Central clinical entity for recording patient visits, diagnostics, 
 * examinations, and clinical assessment plans.
 */
module.exports = (sequelize) => {
  class MedicalRecord extends Model {
    /**
     * @description Professional BMI calculation logic
     */
    calculateBMI() {
      if (!this.heightCm || !this.weightKg) return 0;
      const heightM = this.heightCm / 100;
      return +(this.weightKg / (heightM * heightM)).toFixed(2);
    }

    /**
     * @description Finalizes the clinical record and blocks further edits
     */
    async finalise(doctorId, signatureHash) {
      if (this.isFinalised) throw new Error('Clinical Alert: Record is already finalized.');
      return this.update({
        isFinalised: true,
        doctorSignature: signatureHash,
        signedAt: new Date()
      });
    }

    /**
     * @description Privacy gate for HIPAA-sensitive records
     */
    async checkAccess(userId) {
      if (!this.isConfidential) return true;
      if (this.doctorId === userId) return true;
      if (this.accessibleBy && this.accessibleBy.some(access => access.userId === userId)) return true;
      return false;
    }

    /**
     * @description Generates a clinical summary text
     */
    generateSummary() {
      return `
        Medical Record: ${this.recordNumber}
        Date: ${this.visitDate}
        Chief Complaint: ${this.chiefComplaint}
        Assessment: ${JSON.stringify(this.diagnosis)}
        Plan: ${this.treatmentPlan}
      `.trim();
    }
  }

  MedicalRecord.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Institutional Record Number (HMS-MR-XXXXXX) */
    recordNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'record_number'
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    recordType: {
      type: DataTypes.ENUM(
        'consultation', 'admission', 'discharge', 'emergency', 'procedure', 
        'vaccination', 'growth_chart', 'dental', 'ophthalmology', 'radiology', 
        'surgical', 'psychological', 'nutrition', 'rehabilitation', 'telemedicine'
      ),
      defaultValue: 'consultation',
      field: 'record_type'
    },
    visitDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'visit_date' },
    // --- Subjective Context ---
    chiefComplaint: { type: DataTypes.TEXT, field: 'chief_complaint' },
    historyOfPresentIllness: { type: DataTypes.TEXT, field: 'history_of_present_illness' },
    /** @type {Object} Systematic clinical review JSON */
    reviewOfSystems: { type: DataTypes.JSON, field: 'review_of_systems', defaultValue: {} },
    pastMedicalHistory: { type: DataTypes.JSON, field: 'past_medical_history', defaultValue: [] },
    surgicalHistory: { type: DataTypes.JSON, field: 'surgical_history', defaultValue: [] },
    familyHistory: { type: DataTypes.JSON, field: 'family_history', defaultValue: {} },
    socialHistory: { type: DataTypes.JSON, field: 'social_history', defaultValue: {} },
    /** @type {Array<Object>} [{allergen, reaction, severity}] */
    allergies: { type: DataTypes.JSON, defaultValue: [] },
    // --- Objective Examination ---
    generalExamination: { type: DataTypes.TEXT, field: 'general_examination' },
    /** @type {Object} Vital signs snapshot {temp, pulse, bp_systolic, bp_diastolic, spo2, rr, weight, height, bmi, pain_score} */
    vitalSigns: { type: DataTypes.JSON, field: 'vital_signs', defaultValue: {} },
    systemicExamination: { type: DataTypes.JSON, field: 'systemic_examination', defaultValue: {} },
    heightCm: { type: DataTypes.FLOAT, field: 'height_cm' },
    weightKg: { type: DataTypes.FLOAT, field: 'weight_kg' },
    bloodPressure: { type: DataTypes.STRING(20), field: 'blood_pressure' },
    pulseRate: { type: DataTypes.INTEGER, field: 'pulse_rate' },
    temperature: { type: DataTypes.FLOAT },
    spo2: { type: DataTypes.INTEGER },
    respiratoryRate: { type: DataTypes.INTEGER, field: 'respiratory_rate' },
    painScale: { type: DataTypes.INTEGER, field: 'pain_scale', validate: { min: 0, max: 10 } },
    // --- Assessment & Diagnosis ---
    /** @type {Array<Object>} ICD-10 Diagnosis [{icd10Code, description, type, certainty}] */
    diagnosis: { type: DataTypes.JSON, defaultValue: [] },
    differentialDiagnosis: { type: DataTypes.JSON, field: 'differential_diagnosis', defaultValue: [] },
    severity: {
      type: DataTypes.ENUM('mild', 'moderate', 'severe', 'critical'),
      defaultValue: 'mild'
    },
    prognosis: { type: DataTypes.TEXT },
    // --- Clinical Plan ---
    investigations: { type: DataTypes.JSON, defaultValue: [] },
    treatmentPlan: { type: DataTypes.TEXT, field: 'treatment_plan' },
    medications: { type: DataTypes.JSON, defaultValue: [] },
    proceduresPerformed: { type: DataTypes.JSON, field: 'procedures_performed', defaultValue: [] },
    followupDate: { type: DataTypes.DATEONLY, field: 'followup_date' },
    followupInstructions: { type: DataTypes.TEXT, field: 'followup_instructions' },
    referralTo: { type: DataTypes.STRING, field: 'referral_to' },
    dietaryAdvice: { type: DataTypes.TEXT, field: 'dietary_advice' },
    // --- Media & Privacy ---
    attachments: { type: DataTypes.JSON, defaultValue: [] },
    isConfidential: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_confidential' },
    /** @type {Array<Object>} List of clinicians with special access for sensitive records */
    accessibleBy: { type: DataTypes.JSON, field: 'accessible_by', defaultValue: [] },
    doctorSignature: { type: DataTypes.TEXT, field: 'doctor_signature' },
    signedAt: { type: DataTypes.DATE, field: 'signed_at' },
    isFinalised: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_finalised' }
  }, {
    sequelize,
    modelName: 'MedicalRecord',
    tableName: 'medical_records',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['record_number'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['record_type'] },
      { fields: ['visit_date'] }
    ],
    scopes: {
      finalised: { where: { isFinalised: true } },
      confidential: { where: { isConfidential: true } },
      byPatient(id) { return { where: { patientId: id } }; },
      byType(type) { return { where: { recordType: type } }; },
      byDateRange(start, end) { return { where: { visitDate: { [Op.between]: [start, end] } } }; }
    },
    hooks: {
      beforeCreate: async (rec) => {
        const count = await MedicalRecord.count();
        rec.recordNumber = `HMS-MR-${(count + 1).toString().padStart(6, '0')}`;
      },
      afterCreate: async (rec) => {
        // HIPAA Access Logging
        logger.info(`EHR_ACCESS: Initial creation of Medical Record ${rec.recordNumber} by Doctor ${rec.doctorId}`);
        
        // Propagate clinical information to Patient master profile
        if (sequelize.models.Patient) {
           await sequelize.models.Patient.update({
             bloodGroup: rec.bloodGroup, // if changed
             isVIP: rec.isConfidential // if relevant
           }, { where: { id: rec.patientId } });
        }
      }
    }
  });

  /**
   * Hospital Management - Medical Record Associations
   * @param {Object} models - Loaded models
   */
  MedicalRecord.associate = (models) => {
    MedicalRecord.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    MedicalRecord.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'clinician' });
    MedicalRecord.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
    MedicalRecord.belongsTo(models.Admission, { foreignKey: 'admissionId', as: 'admissionContext' });
  };

  return MedicalRecord;
};
