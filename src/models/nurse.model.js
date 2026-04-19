const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('nurse-model');

/**
 * Hospital Management System - Nursing Management Model
 * 
 * Manages nursing staff assignments, clinical competencies, 
 * nursing council certifications, and patient-to-nurse ratios.
 */
module.exports = (sequelize) => {
  class Nurse extends Model {
    /**
     * @description Fetches all patients currently assigned to this nurse
     * @returns {Promise<Array<Object>>} List of active assignments
     */
    async getCurrentPatients() {
      if (!sequelize.models.WardAssignment) return [];
      return sequelize.models.WardAssignment.findAll({
        where: { nurseId: this.id, status: 'active' },
        include: [{ model: sequelize.models.Patient, as: 'patient' }]
      });
    }

    /**
     * @description Safety check for patient-to-nurse ratio
     * @returns {Promise<boolean>} True if capacity available
     */
    async canAcceptMorePatients() {
      const currentCount = await this.getCurrentPatientsAssigned();
      return currentCount < this.maxPatientsAssigned;
    }

    /**
     * @description Placeholder for shift schedule retrieval
     */
    async getShiftSchedule(startDate, endDate) {
      // Logic for fetching Rota/Schedule
      return [];
    }

    /**
     * @description Logs a clinical observation or care note for a patient
     */
    async logPatientCareNote(patientId, note, vitalSigns) {
      if (!sequelize.models.PatientCareNote) return null;
      return sequelize.models.PatientCareNote.create({
        nurseId: this.id,
        patientId,
        note,
        vitalSigns,
        timestamp: new Date()
      });
    }

    /**
     * @description Dynamic calculation of current patient load
     * @returns {Promise<number>}
     */
    async getCurrentPatientsAssigned() {
      if (!sequelize.models.WardAssignment) return 0;
      return sequelize.models.WardAssignment.count({
        where: { nurseId: this.id, status: 'active' }
      });
    }
  }

  Nurse.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Institutional ID (HMS-NRS-XXXXX) */
    nurseId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'nurse_id',
      comment: 'Nursing Registry ID (HMS-NRS-XXXXX)'
    },
    /** @type {string} Link to User identity */
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    /** @type {string} Technical link to Staff payroll entity */
    staffId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'staff_id',
      references: { model: 'staff', key: 'id' }
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'department_id',
      references: { model: 'departments', key: 'id' }
    },
    /** @type {string} Current assigned physical ward location */
    wardId: {
      type: DataTypes.UUID,
      field: 'ward_id',
      comment: 'Primary functional station'
    },
    nursingCategory: {
      type: DataTypes.ENUM('general_nurse', 'head_nurse', 'charge_nurse', 'staff_nurse', 'student_nurse', 'nursing_assistant'),
      defaultValue: 'staff_nurse',
      field: 'nursing_category'
    },
    /** @type {string} Medical Nursing Council registration ID */
    nursingCouncilNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'nursing_council_number'
    },
    nursingCouncilExpiry: {
      type: DataTypes.DATEONLY,
      field: 'nursing_council_expiry'
    },
    nursingCouncilDoc: {
      type: DataTypes.STRING,
      field: 'nursing_council_doc',
      validate: { isUrl: true }
    },
    /** @type {Object} Educational background */
    qualification: { type: DataTypes.JSON, defaultValue: [] },
    /** @type {Array<Object>} Specialized certifications (ICU, Dialysis, etc.) */
    specialTraining: { type: DataTypes.JSON, field: 'special_training', defaultValue: [] },
    yearsOfExperience: { type: DataTypes.INTEGER, defaultValue: 0, field: 'years_of_experience' },
    // --- Clinical Competencies ---
    canAdministerMedication: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'can_administer_medication' },
    canPerformProcedures: { type: DataTypes.JSON, field: 'can_perform_procedures', defaultValue: [] },
    canDrawBlood: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'can_draw_blood' },
    // --- Capacity Tracking ---
    maxPatientsAssigned: { type: DataTypes.INTEGER, defaultValue: 5, field: 'max_patients_assigned' },
    // --- Shift Operations ---
    shiftType: {
      type: DataTypes.ENUM('morning', 'evening', 'night'),
      defaultValue: 'morning',
      field: 'shift_type'
    },
    shiftStartTime: { type: DataTypes.TIME, field: 'shift_start_time' },
    shiftEndTime: { type: DataTypes.TIME, field: 'shift_end_time' },
    /** @type {string} Hierarchical supervisor within nursing department */
    supervisorId: {
      type: DataTypes.UUID,
      field: 'supervisor_id',
      references: { model: 'nurses', key: 'id' }
    },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 5.00 },
    totalShiftsCompleted: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_shifts_completed' },
    overtimeHours: { type: DataTypes.FLOAT, defaultValue: 0, field: 'overtime_hours' },
    isOnDuty: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_on_duty' },
    lastDutyDate: { type: DataTypes.DATE, field: 'last_duty_date' },

    // --- Virtuals ---
    currentPatientsAssigned: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getCurrentPatientsAssigned(); // Note: This will need to be awaited in practice or handled via a real field
      }
    }
  }, {
    sequelize,
    modelName: 'Nurse',
    tableName: 'nurses',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['nurse_id'] },
      { unique: true, fields: ['nursing_council_number'] },
      { fields: ['ward_id'] },
      { fields: ['department_id'] },
      { fields: ['shift_type'] },
      { fields: ['is_on_duty'] }
    ],
    scopes: {
      onDuty: { where: { isOnDuty: true } },
      headNurses: { where: { nursingCategory: 'head_nurse' } },
      available: { where: { isOnDuty: true, availabilityStatus: 'available' } }, // Assuming availabilityStatus field might exist later
      byWard(id) { return { where: { wardId: id } }; },
      byShift(type) { return { where: { shiftType: type } }; }
    },
    hooks: {
      beforeCreate: async (nurse) => {
        // 1. Council Number Uniqueness Check
        const existing = await Nurse.findOne({ 
          where: { nursingCouncilNumber: nurse.nursingCouncilNumber } 
        });
        if (existing) throw new Error('Nursing Council Number already registered.');

        // 2. Sequential ID generation
        const count = await Nurse.count();
        nurse.nurseId = `HMS-NRS-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterUpdate: async (nurse) => {
        // Trigger ward synchronization on transfer
        if (nurse.changed('wardId') && sequelize.models.Ward) {
          try {
            const oldWardId = nurse.previous('wardId');
            const newWardId = nurse.wardId;

            if (oldWardId) {
              await sequelize.models.Ward.decrement('active_nurse_count', { where: { id: oldWardId } });
            }
            if (newWardId) {
              await sequelize.models.Ward.increment('active_nurse_count', { where: { id: newWardId } });
            }
            logger.info(`WARD_SYNC: Synchronized nurse counts for Wards ${oldWardId} -> ${newWardId}`);
          } catch (err) {
            logger.error(`WARD_SYNC_FAILURE: Failed to synchronize nurse counts: ${err.message}`);
          }
        }
      }
    }
  });

  /**
   * Hospital Management - Nurse Associations
   * @param {Object} models - Loaded models
   */
  Nurse.associate = (models) => {
    Nurse.belongsTo(models.User, { foreignKey: 'userId', as: 'userAccount' });
    Nurse.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staffProfile' });
    Nurse.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Nurse.belongsTo(models.Ward, { foreignKey: 'wardId', as: 'assignedWard' });
    Nurse.belongsTo(models.Nurse, { foreignKey: 'supervisorId', as: 'supervisor' });
    Nurse.hasMany(models.Nurse, { foreignKey: 'supervisorId', as: 'juniors' });
    Nurse.hasMany(models.WardAssignment, { foreignKey: 'nurseId', as: 'assignments' });
    Nurse.hasMany(models.PatientCareNote, { foreignKey: 'nurseId', as: 'careNotes' });
  };

  return Nurse;
};
