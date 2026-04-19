const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('ot-management-model');

/**
 * Hospital Management System - Operation Theatre (OT) Orchestration
 * 
 * Manages complex surgical environment assets (Rooms) 
 * and intensive clinical scheduling (Surgeries/Anaesthesia).
 */
module.exports = (sequelize) => {
  // --- OT Room Model ---
  class OTRoom extends Model {}
  OTRoom.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Sequential Infrastructure ID (OT-XXX) */
    roomCode: { type: DataTypes.STRING, unique: true, field: 'room_code' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: {
      type: DataTypes.ENUM('major_ot', 'minor_ot', 'emergency_ot', 'obstetric_ot', 'cardiac_ot', 'neurosurgery_ot', 'laparoscopic_ot', 'endoscopy_suite'),
      defaultValue: 'major_ot'
    },
    floorNumber: { type: DataTypes.INTEGER, field: 'floor_number' },
    capacity: { type: DataTypes.INTEGER, comment: 'Surgical Team Size' },
    status: {
      type: DataTypes.ENUM('available', 'in_use', 'post_op_cleaning', 'under_maintenance', 'reserved'),
      defaultValue: 'available'
    },
    lastUsedAt: { type: DataTypes.DATE, field: 'last_used_at' },
    nextAvailableAt: { type: DataTypes.DATE, field: 'next_available_at' },
    avgCleaningTime: { type: DataTypes.INTEGER, defaultValue: 45, field: 'avg_cleaning_time' },
    /** @type {Array<Object>} Asset inventory [{name, model, serialNo, lastServiced}] */
    equipment: { type: DataTypes.JSON, defaultValue: [] },
    specialities: { type: DataTypes.JSON, defaultValue: [] },
    isAvailableFor24x7: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_available_24v7' },
    currentCaseId: { type: DataTypes.UUID, field: 'current_case_id' },
    totalSurgeriesPerformed: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_surgeries_performed' },
    cleaningHistory: { type: DataTypes.JSON, defaultValue: [], field: 'cleaning_history' }
  }, {
    sequelize,
    modelName: 'OTRoom',
    tableName: 'ot_rooms',
    underscored: true,
    hooks: {
      beforeCreate: async (room) => {
        const count = await OTRoom.count();
        room.roomCode = `OT-${(count + 1).toString().padStart(3, '0')}`;
      }
    }
  });

  // --- OT Schedule Model ---
  class OTSchedule extends Model {
    /**
     * @description Transitions case to intra-operative phase
     */
    async startSurgery(startTime) {
      const transaction = await sequelize.transaction();
      try {
        await this.update({
          status: 'in_progress',
          actualStartTime: startTime || new Date()
        }, { transaction });
        
        // Lock the OT Room
        if (sequelize.models.OTRoom) {
          await sequelize.models.OTRoom.update({
             status: 'in_use',
             currentCaseId: this.id
          }, { where: { id: this.otRoomId }, transaction });
        }
        
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Finalizes surgical record with post-operative handover
     */
    async completeSurgery(data) {
      const transaction = await sequelize.transaction();
      try {
        await this.update({
          ...data,
          status: 'completed',
          actualEndTime: new Date()
        }, { transaction });

        // Release OT Room for cleaning
        if (sequelize.models.OTRoom) {
          await sequelize.models.OTRoom.update({
             status: 'post_op_cleaning',
             lastUsedAt: new Date(),
             currentCaseId: null
          }, { where: { id: this.otRoomId }, transaction });
        }
        
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
  }

  OTSchedule.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Forensic Schedule ID (HMS-OT-YYYYMMDD-XXXXX) */
    scheduleNumber: { type: DataTypes.STRING, unique: true, field: 'schedule_number' },
    otRoomId: { type: DataTypes.UUID, field: 'ot_room_id', references: { model: 'ot_rooms', key: 'id' } },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    surgeonId: { type: DataTypes.UUID, allowNull: false, field: 'surgeon_id' },
    coSurgeonIds: { type: DataTypes.JSON, defaultValue: [], field: 'co_surgeon_ids' },
    anaesthesiologistId: { type: DataTypes.UUID, field: 'anaesthesiologist_id' },
    scrubNurseIds: { type: DataTypes.JSON, defaultValue: [], field: 'scrub_nurse_ids' },
    surgeryName: { type: DataTypes.STRING(255), allowNull: false, field: 'surgery_name' },
    icd10ProcCode: { type: DataTypes.STRING(20), field: 'icd10_proc_code' },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'scheduled_date' },
    scheduledStartTime: { type: DataTypes.TIME, allowNull: false, field: 'scheduled_start_time' },
    scheduledEndTime: { type: DataTypes.TIME, field: 'scheduled_end_time' },
    priority: {
      type: DataTypes.ENUM('elective', 'urgent', 'emergency', 'trauma'),
      defaultValue: 'elective'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'pre_op_prep', 'in_progress', 'completed', 'cancelled', 'postponed', 'aborted'),
      defaultValue: 'scheduled'
    },
    anaesthesiaType: {
      type: DataTypes.ENUM('general', 'regional', 'spinal', 'epidural', 'local', 'sedation', 'combined'),
      field: 'anaesthesia_type'
    },
    // --- Intra-Op Granularity ---
    actualStartTime: { type: DataTypes.DATE, field: 'actual_start_time' },
    actualEndTime: { type: DataTypes.DATE, field: 'actual_end_time' },
    intraopFindings: { type: DataTypes.TEXT, field: 'intraop_findings' },
    estimatedBloodLoss: { type: DataTypes.INTEGER, field: 'estimated_blood_loss' },
    /** @type {Object} {before, after, matched} Forensic counts */
    swabCount: { type: DataTypes.JSON, field: 'swab_count', defaultValue: {} },
    instrumentCount: { type: DataTypes.JSON, field: 'instrument_count', defaultValue: {} },
    // --- Post-Op Handover ---
    postOpDiagnosis: { type: DataTypes.TEXT, field: 'post_op_diagnosis' },
    postOpStatus: {
      type: DataTypes.ENUM('recovering', 'shifted_to_icu', 'shifted_to_ward', 'critical', 'stable'),
      field: 'post_op_status'
    },
    surgicalNotes: { type: DataTypes.TEXT, field: 'surgical_notes' },
    surgeryBillId: { type: DataTypes.UUID, field: 'surgery_bill_id' }
  }, {
    sequelize,
    modelName: 'OTSchedule',
    tableName: 'ot_schedules',
    underscored: true,
    indexes: [
      { unique: true, fields: ['schedule_number'] },
      { fields: ['ot_room_id'] },
      { fields: ['patient_id'] },
      { fields: ['surgeon_id'] },
      { fields: ['scheduled_date'] },
      { fields: ['status'] }
    ],
    scopes: {
      today: { where: { scheduledDate: new Date().toISOString().slice(0, 10) } },
      emergency: { where: { priority: 'emergency' } },
      active: { where: { status: { [Op.in]: ['pre_op_prep', 'in_progress'] } } }
    },
    hooks: {
      beforeCreate: async (sch, options) => {
        // Sequential ID Generation
        const dateStr = sch.scheduledDate.replace(/-/g, '');
        const count = await OTSchedule.count({ where: { scheduledDate: sch.scheduledDate }, transaction: options.transaction });
        sch.scheduleNumber = `HMS-OT-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
        
        // Availability Logic Check
        if (sequelize.models.OTRoom) {
           const room = await sequelize.models.OTRoom.findByPk(sch.otRoomId, { transaction: options.transaction });
           if (room && room.status === 'under_maintenance') throw new Error('Clinical Conflict: OT Room is offline for maintenance.');
        }
      },
      afterUpdate: async (sch) => {
        if (sch.changed('status') && sch.status === 'completed') {
           logger.info(`OT_COMPLETION: Surgery ${sch.scheduleNumber} completed. Preparing recovery bed and post-op billing.`);
        }
      }
    }
  });

  // --- Virtuals ---
  Object.defineProperty(OTSchedule.prototype, 'actualDuration', {
    get() {
      if (!this.actualStartTime || !this.actualEndTime) return 0;
      return Math.floor((this.actualEndTime - this.actualStartTime) / 60000);
    }
  });

  /**
   * Operation Theatre - Associations
   */
  OTRoom.associate = (models) => {
    OTRoom.hasMany(models.OTSchedule, { foreignKey: 'otRoomId', as: 'scheduledSurgeries' });
    OTRoom.belongsTo(models.OTSchedule, { foreignKey: 'currentCaseId', as: 'activeCase' });
  };

  OTSchedule.associate = (models) => {
    OTSchedule.belongsTo(models.OTRoom, { foreignKey: 'otRoomId', as: 'room' });
    OTSchedule.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    OTSchedule.belongsTo(models.Doctor, { foreignKey: 'surgeonId', as: 'leadSurgeon' });
    OTSchedule.belongsTo(models.Doctor, { foreignKey: 'anaesthesiologistId', as: 'anaesthesiologist' });
    OTSchedule.belongsTo(models.Billing, { foreignKey: 'surgeryBillId', as: 'bill' });
  };

  return { OTRoom, OTSchedule };
};
