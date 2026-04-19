const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('admission-discharge-model');

/**
 * Hospital Management System - Inpatient Department (IPD) Orchestration
 * 
 * Manages the high-intensity clinical lifecycle from admission (check-in) 
 * and ward transfers to final discharge (check-out) and forensic summaries.
 */
module.exports = (sequelize) => {
  // --- Admission Model ---
  class Admission extends Model {
    /**
     * @description Professional ward transfer orchestration
     */
    async transferWard(newWardId, newRoomId, newBedId, reason, transferredBy) {
      const transaction = await sequelize.transaction();
      try {
        const oldBedId = this.bedId;
        const oldWardId = this.wardId;

        // 1. Update Admission record
        const history = [...(this.transferHistory || [])];
        history.push({ 
           fromWard: oldWardId, toWard: newWardId, 
           fromBed: oldBedId, toBed: newBedId, 
           transferredAt: new Date(), reason, transferredBy 
        });

        await this.update({
          wardId: newWardId, roomId: newRoomId, bedId: newBedId,
          transferHistory: history,
          status: 'transferred_ward'
        }, { transaction });

        // 2. Release old bed
        if (sequelize.models.Bed) {
          await sequelize.models.Bed.update({ status: 'available', currentPatientId: null }, { where: { id: oldBedId }, transaction });
          await sequelize.models.Bed.update({ status: 'occupied', currentPatientId: this.patientId }, { where: { id: newBedId }, transaction });
        }

        // 3. Update Ward counts
        if (sequelize.models.Ward) {
          await sequelize.models.Ward.increment('occupiedBeds', { by: -1, where: { id: oldWardId }, transaction });
          await sequelize.models.Ward.increment('occupiedBeds', { by: 1, where: { id: newWardId }, transaction });
        }

        await transaction.commit();
        logger.info(`WARD_TRANSFER: Patient ${this.patientId} moved to Ward ${newWardId} Bed ${newBedId}`);
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Professional expiration protocol
     */
    async expired(time, cause, certifiedBy) {
      return this.update({
        status: 'expired',
        actualDischargeDate: time || new Date(),
        notes: `Clinical Alert: Patient expired. Cause: ${cause}. Certified by: ${certifiedBy}`
      });
    }
  }

  Admission.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Sequential Inpatient ID (HMS-ADM-YYYYMMDD-XXXXX) */
    admissionNumber: { type: DataTypes.STRING, unique: true, field: 'admission_number' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admittingDoctorId: { type: DataTypes.UUID, allowNull: false, field: 'admitting_doctor_id' },
    primaryDoctorId: { type: DataTypes.UUID, field: 'primary_doctor_id' },
    attendingDoctorIds: { type: DataTypes.JSON, defaultValue: [], field: 'attending_doctor_ids' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    wardId: { type: DataTypes.UUID, field: 'ward_id' },
    roomId: { type: DataTypes.UUID, field: 'room_id' },
    bedId: { type: DataTypes.UUID, field: 'bed_id' },
    admissionType: {
      type: DataTypes.ENUM('emergency', 'planned', 'transfer_in', 'day_surgery', 'observation', 'maternity', 'psychiatric'),
      defaultValue: 'planned',
      field: 'admission_type'
    },
    admittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'admitted_at' },
    expectedDischargeDate: { type: DataTypes.DATEONLY, field: 'expected_discharge_date' },
    actualDischargeDate: { type: DataTypes.DATE, field: 'actual_discharge_date' },
    /** @type {Array<Object>} Initial clinical entry [{icd10Code, description, type}] */
    admissionDiagnosis: { type: DataTypes.JSON, defaultValue: [], field: 'admission_diagnosis' },
    patientConditionOnAdmission: {
      type: DataTypes.ENUM('stable', 'unstable', 'critical', 'serious', 'fair', 'good', 'poor', 'dead_on_arrival'),
      field: 'patient_condition_on_admission'
    },
    mlcCase: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'mlc_case' },
    isIsolationRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_isolation_required' },
    // --- Commercial ---
    insuranceId: { type: DataTypes.UUID, field: 'insurance_id' },
    preAuthNumber: { type: DataTypes.STRING(50), field: 'pre_auth_number' },
    estimatedCost: { type: DataTypes.DECIMAL(12, 2), field: 'estimated_cost' },
    // --- Nursing & Status ---
    nursingCareLevel: {
      type: DataTypes.ENUM('self_care', 'assisted', 'total_care', 'icu_care'),
      field: 'nursing_care_level'
    },
    status: {
      type: DataTypes.ENUM('active', 'transferred_ward', 'transferred_hospital', 'discharged', 'absconded', 'dama', 'expired', 'under_procedure'),
      defaultValue: 'active'
    },
    transferHistory: { type: DataTypes.JSON, defaultValue: [], field: 'transfer_history' },
    admittedBy: { type: DataTypes.UUID, field: 'admitted_by', comment: 'Staff who processed check-in' }
  }, {
    sequelize,
    modelName: 'Admission',
    tableName: 'admissions',
    underscored: true,
    hooks: {
      beforeCreate: async (adm) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Admission.count();
        adm.admissionNumber = `HMS-ADM-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (adm) => {
        // Atomic Infrastructure Update
        if (sequelize.models.Bed) {
          await sequelize.models.Bed.update({ status: 'occupied', currentPatientId: adm.patientId }, { where: { id: adm.bedId } });
        }
        if (sequelize.models.Ward) {
          await sequelize.models.Ward.increment('occupiedBeds', { by: 1, where: { id: adm.wardId } });
        }
        logger.info(`IPD_ACTIVATION: Admission ${adm.admissionNumber} created for Patient ${adm.patientId}`);
      }
    }
  });

  // --- Discharge Model ---
  class Discharge extends Model {
    /**
     * @description Generates the clinical-forensic discharge summary
     */
    async generateDischargeSummary() {
       const pdfUtil = require('../utils/pdf.util');
       return pdfUtil.generateDischargeSummary(this);
    }
  }

  Discharge.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    dischargeNumber: { type: DataTypes.STRING, unique: true, field: 'discharge_number' },
    admissionId: { type: DataTypes.UUID, unique: true, field: 'admission_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    dischargingDoctorId: { type: DataTypes.UUID, allowNull: false, field: 'discharging_doctor_id' },
    dischargeType: {
      type: DataTypes.ENUM('regular', 'against_medical_advice', 'death', 'transfer_to_other_hospital', 'absconded', 'day_care', 'planned_discharge', 'administrative'),
      defaultValue: 'regular',
      field: 'discharge_type'
    },
    dischargedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'discharged_at' },
    actualLengthOfStay: { type: DataTypes.DECIMAL(10, 2), field: 'actual_length_of_stay' },
    // --- Clinical Summary Data ---
    finalDiagnosis: { type: DataTypes.JSON, defaultValue: [], field: 'final_diagnosis' },
    dischargeSummary: { type: DataTypes.TEXT, field: 'discharge_summary' },
    hospitalCourse: { type: DataTypes.TEXT, field: 'hospital_course' },
    conditionAtDischarge: {
      type: DataTypes.ENUM('recovered', 'improved', 'stable', 'deteriorated', 'unchanged', 'expired', 'transferred'),
      field: 'condition_at_discharge'
    },
    medicationsOnDischarge: { type: DataTypes.JSON, defaultValue: [], field: 'medications_on_discharge' },
    followupRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'followup_required' },
    followupAppointments: { type: DataTypes.JSON, defaultValue: [], field: 'followup_appointments' },
    // --- Financials & Media ---
    billId: { type: DataTypes.UUID, field: 'bill_id' },
    dischargeSummaryUrl: { type: DataTypes.STRING, field: 'discharge_summary_url' },
    status: {
      type: DataTypes.ENUM('draft', 'doctor_summary_pending', 'summary_ready', 'bill_clearance_pending', 'bill_cleared', 'valuables_pending', 'fully_processed', 'completed'),
      defaultValue: 'draft'
    }
  }, {
    sequelize,
    modelName: 'Discharge',
    tableName: 'discharges',
    underscored: true,
    hooks: {
      beforeCreate: async (dis) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Discharge.count();
        dis.dischargeNumber = `HMS-DIS-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: async (dis) => {
        // Atomic Infrastructure Release
        const admission = await sequelize.models.Admission.findByPk(dis.admissionId);
        if (admission) {
          if (sequelize.models.Bed) {
            await sequelize.models.Bed.update({ status: 'available', currentPatientId: null }, { where: { id: admission.bedId } });
          }
          if (sequelize.models.Ward) {
            await sequelize.models.Ward.increment('occupiedBeds', { by: -1, where: { id: admission.wardId } });
          }
          await admission.update({ status: 'discharged', actualDischargeDate: dis.dischargedAt });
        }
        logger.info(`IPD_CLOSURE: Discharge ${dis.dischargeNumber} finalized for Admission ${dis.admissionId}`);
      }
    }
  });

  // --- Associations ---
  Admission.associate = (models) => {
    Admission.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Admission.belongsTo(models.Doctor, { foreignKey: 'admittingDoctorId', as: 'primaryPhysician' });
    Admission.belongsTo(models.Ward, { foreignKey: 'wardId', as: 'currentWard' });
    Admission.belongsTo(models.Bed, { foreignKey: 'bedId', as: 'currentBed' });
    Admission.hasOne(models.Discharge, { foreignKey: 'admissionId', as: 'dischargeRecord' });
  };

  Discharge.associate = (models) => {
    Discharge.belongsTo(models.Admission, { foreignKey: 'admissionId', as: 'admissionContext' });
    Discharge.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Discharge.belongsTo(models.Doctor, { foreignKey: 'dischargingDoctorId', as: 'attendingPhysician' });
    Discharge.belongsTo(models.Billing, { foreignKey: 'billId', as: 'bill' });
  };

  return { Admission, Discharge };
};
