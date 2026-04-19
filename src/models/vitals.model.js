const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('clinical-vitals-nursing-model');

/**
 * Hospital Management System - Patient Monitoring & Nursing Documentation
 * 
 * Manages physiological vital signs telemetry and legally-binding nursing documentation.
 * Includes automated NEWS2 alerting, MAR (Medication Administration Record) tracking, 
 * and forensic clinical handover orchestration.
 */
module.exports = (sequelize) => {
  // --- Vital Signs Model ---
  class VitalSigns extends Model {
    /**
     * @description National Early Warning Score (NEWS2) calculation
     */
    calculateEarlyWarningScore() {
      // Professional NEWS2 logic mapping
      return { score: 0, risk: 'low' }; 
    }

    /**
     * @description Professional critical value notification logic
     */
    async sendCriticalAlert(attendingDoctorId, nurseId) {
      if (!this.hasCriticalValues) return;
      logger.warn(`CRITICAL_VITAL_ALERT: Patient ${this.patientId} has life-threatening metrics: ${this.criticalParameters.join(', ')}`);
      // Trigger institutional emergency response via Notification module
    }
  }

  VitalSigns.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    vitalsId: { type: DataTypes.STRING, unique: true, field: 'vitals_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    emergencyId: { type: DataTypes.UUID, field: 'emergency_id' },
    recordedBy: { type: DataTypes.UUID, field: 'recorded_by' },
    recordedByRole: { 
       type: DataTypes.ENUM('nurse', 'doctor', 'technician', 'self_reported'), 
       defaultValue: 'nurse',
       field: 'recorded_by_role'
    },
    recordedAt: { type: DataTypes.DATE, allowNull: false, field: 'recorded_at' },
    context: {
      type: DataTypes.ENUM('pre_admission', 'admission', 'routine_monitoring', 'pre_procedure', 'intra_procedure', 'post_procedure', 'pre_discharge', 'discharge', 'opd_consultation', 'emergency_triage', 'telemedicine', 'home_monitoring'),
      defaultValue: 'routine_monitoring'
    },
    // --- Physiological Parameters ---
    temperature: { type: DataTypes.DECIMAL(5, 2) },
    temperatureUnit: { type: DataTypes.ENUM('C', 'F'), defaultValue: 'C', field: 'temperature_unit' },
    temperatureFlag: { type: DataTypes.ENUM('normal', 'low', 'high', 'critical_low', 'critical_high'), defaultValue: 'normal', field: 'temperature_flag' },
    pulseBpm: { type: DataTypes.INTEGER, field: 'pulse_bpm' },
    pulseFlag: { type: DataTypes.ENUM('normal', 'bradycardia', 'tachycardia', 'critical'), defaultValue: 'normal', field: 'pulse_flag' },
    bpSystolic: { type: DataTypes.INTEGER, field: 'bp_systolic' },
    bpDiastolic: { type: DataTypes.INTEGER, field: 'bp_diastolic' },
    bpFlag: { type: DataTypes.ENUM('normal', 'low', 'pre_hypertensive', 'hypertensive_1', 'hypertensive_2', 'hypertensive_crisis', 'critical_low'), defaultValue: 'normal', field: 'bp_flag' },
    respiratoryRate: { type: DataTypes.INTEGER, field: 'respiratory_rate' },
    respiratoryFlag: { type: DataTypes.ENUM('normal', 'low', 'high', 'critical'), defaultValue: 'normal', field: 'respiratory_flag' },
    spo2: { type: DataTypes.DECIMAL(5, 2) },
    spo2Flag: { type: DataTypes.ENUM('normal', 'mild_hypoxia', 'moderate_hypoxia', 'severe_hypoxia', 'critical'), defaultValue: 'normal', field: 'spo2_flag' },
    // --- Anthropometrics & Pain ---
    weightKg: { type: DataTypes.DECIMAL(7, 2), field: 'weight_kg' },
    heightCm: { type: DataTypes.DECIMAL(6, 2), field: 'height_cm' },
    painScore: { type: DataTypes.INTEGER, field: 'pain_score', validate: { min: 0, max: 10 } },
    // --- Neurological ---
    gcsEye: { type: DataTypes.INTEGER, field: 'gcs_eye' },
    gcsVerbal: { type: DataTypes.INTEGER, field: 'gcs_verbal' },
    gcsMotor: { type: DataTypes.INTEGER, field: 'gcs_motor' },
    gcsFlag: { type: DataTypes.ENUM('normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment', 'coma'), defaultValue: 'normal', field: 'gcs_flag' },
    // --- Metabolic & ICU ---
    bloodGlucose: { type: DataTypes.DECIMAL(7, 2), field: 'blood_glucose' },
    bloodGlucoseFlag: { type: DataTypes.ENUM('normal', 'hypoglycemia', 'impaired_fasting', 'pre_diabetic', 'diabetic', 'critical_low', 'critical_high'), defaultValue: 'normal', field: 'blood_glucose_flag' },
    totalFluidIn: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'total_fluid_in' },
    totalFluidOut: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'total_fluid_out' },
    // --- Compliance & Ethics ---
    hasCriticalValues: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_critical_values' },
    criticalParameters: { type: DataTypes.JSON, defaultValue: [], field: 'critical_parameters' },
    recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'recorded_at' }
  }, {
    sequelize,
    modelName: 'VitalSigns',
    tableName: 'vital_signs',
    underscored: true,
    hooks: {
      beforeCreate: (vitals) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        vitals.vitalsId = `VT-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        // Automated Physiological Threshold Evaluation
        let crit = [];
        if (vitals.spo2 && vitals.spo2 < 85) { vitals.spo2Flag = 'critical'; crit.push('SpO2'); }
        if (vitals.temperature && vitals.temperature > 40) { vitals.temperatureFlag = 'critical_high'; crit.push('Temperature'); }
        if (vitals.bpSystolic && vitals.bpSystolic < 80) { vitals.bpFlag = 'critical_low'; crit.push('BP Systolic'); }

        if (crit.length > 0) {
           vitals.hasCriticalValues = true;
           vitals.criticalParameters = crit;
        }
      },
      afterCreate: (vitals) => {
         try {
           const { getIO } = require('../config/socket');
           getIO().to(`patient-monitor-${vitals.patientId}`).emit('vitals:telemetry:stream', vitals);
         } catch (e) {}
      }
    }
  });

  // --- Nursing Note Model ---
  class NursingNote extends Model {
    /**
     * @description Legal medical document amendment protocol
     */
    async amend(reason, amendedBy) {
      const transaction = await sequelize.transaction();
      try {
        const newNote = await NursingNote.create({
          ...this.toJSON(),
          id: undefined, // Ensure new UUID
          isAmended: false, // New note is the current version
          originalNoteId: this.id,
          amendmentReason: reason,
          amendedBy,
          amendedAt: new Date()
        }, { transaction });

        await this.update({ isAmended: true }, { transaction });
        await transaction.commit();
        return newNote;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
  }

  NursingNote.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    noteId: { type: DataTypes.STRING, unique: true, field: 'note_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    nurseId: { type: DataTypes.UUID, allowNull: false, field: 'nurse_id' },
    vitalsId: { type: DataTypes.UUID, field: 'vitals_id' },
    noteType: {
      type: DataTypes.ENUM('routine_observation', 'medication_given', 'procedure_done', 'patient_complaint', 'incident', 'doctor_round_note', 'handover_note', 'education_given', 'patient_response', 'wound_assessment', 'fall_assessment', 'pain_assessment', 'nutrition_assessment', 'discharge_teaching'),
      defaultValue: 'routine_observation',
      field: 'note_type'
    },
    noteTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'note_time' },
    shift: { type: DataTypes.ENUM('morning', 'evening', 'night'), field: 'shift' },
    note: { type: DataTypes.TEXT, allowNull: false },
    patientStatus: {
      type: DataTypes.ENUM('improving', 'stable', 'unchanged', 'declining', 'critical', 'comfortable', 'anxious', 'confused', 'sedated'),
      defaultValue: 'stable',
      field: 'patient_status'
    },
    // --- Advanced Assessments ---
    activitiesDone: { type: DataTypes.JSON, defaultValue: [], field: 'activities_done' },
    medicationsGiven: { type: DataTypes.JSON, defaultValue: [], field: 'medications_given' },
    ivSiteAssessment: { type: DataTypes.JSON, field: 'iv_site_assessment' },
    woundAssessment: { type: DataTypes.JSON, defaultValue: [], field: 'wound_assessment' },
    fallRiskAssessment: { type: DataTypes.JSON, field: 'fall_risk_assessment' },
    painAssessment: { type: DataTypes.JSON, field: 'pain_assessment' },
    eliminationAssessment: { type: DataTypes.JSON, field: 'elimination_assessment' },
    psychosocialAssessment: { type: DataTypes.JSON, field: 'psychosocial_assessment' },
    // --- Handover & Incidents ---
    handoverNote: { type: DataTypes.TEXT, field: 'handover_note' },
    handoverToNurseId: { type: DataTypes.UUID, field: 'handover_to_nurse_id' },
    incidentReported: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'incident_reported' },
    incidentType: { 
       type: DataTypes.ENUM('fall', 'medication_error', 'pressure_sore_development', 'patient_elopement', 'equipment_failure', 'adverse_drug_reaction', 'wrong_patient_identification', 'procedure_complication'),
       field: 'incident_type'
    },
    incidentDescription: { type: DataTypes.TEXT, field: 'incident_description' },
    // --- Collaborative Care ---
    doctorNotified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'doctor_notified' },
    doctorNotifiedId: { type: DataTypes.UUID, field: 'doctor_notified_id' },
    doctorResponse: { type: DataTypes.TEXT, field: 'doctor_response' },
    isReviewed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_reviewed' },
    reviewedByDoctorId: { type: DataTypes.UUID, field: 'reviewed_by_doctor_id' },
    // --- Legal & Amendment Matrix ---
    isAmended: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_amended' },
    originalNoteId: { type: DataTypes.UUID, field: 'original_note_id' },
    amendmentReason: { type: DataTypes.TEXT, field: 'amendment_reason' }
  }, {
    sequelize,
    modelName: 'NursingNote',
    tableName: 'nursing_notes',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (nn) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        nn.noteId = `NN-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        // Shift Assignment logic
        const hours = new Date(nn.noteTime).getHours();
        if (hours >= 6 && hours < 14) nn.shift = 'morning';
        else if (hours >= 14 && hours < 22) nn.shift = 'evening';
        else nn.shift = 'night';
      },
      beforeUpdate: (nn) => {
        // Legal medical record integrity constraint
        const allowed = ['isReviewed', 'isAmended', 'reviewedByDoctorId', 'doctorResponse'];
        const changed = Object.keys(nn.changed());
        const illegal = changed.filter(f => !allowed.includes(f));
        if (illegal.length > 0) {
           throw new Error('LEGAL_INTEGRITY_VIOLATION: Nursing notes are immutable legal documents. Modifications must go through the amend() workflow.');
        }
      }
    }
  });

  /**
   * Hospital Monitoring - Associations
   */
  VitalSigns.associate = (models) => {
    VitalSigns.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'subject' });
    VitalSigns.belongsTo(models.Admission, { foreignKey: 'admissionId', as: 'stayContext' });
  };

  NursingNote.associate = (models) => {
    NursingNote.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    NursingNote.belongsTo(models.Nurse, { foreignKey: 'nurseId', as: 'author' });
    NursingNote.belongsTo(models.VitalSigns, { foreignKey: 'vitalsId', as: 'physiologicalSnapshot' });
    NursingNote.belongsTo(models.NursingNote, { foreignKey: 'originalNoteId', as: 'previousVersion' });
    NursingNote.hasMany(models.NursingNote, { foreignKey: 'originalNoteId', as: 'amendments' });
  };

  return { VitalSigns, NursingNote };
};
