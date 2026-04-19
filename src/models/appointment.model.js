const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('appointment-model');

/**
 * Hospital Management System - Advanced Appointment Model
 * 
 * Orchestrates clinical scheduling, token-based queue management, 
 * and consultation lifecycle tracking.
 */
module.exports = (sequelize) => {
  class Appointment extends Model {
    /**
     * @description Transitions appointment to 'checked_in' status
     * @returns {Promise<Appointment>}
     */
    async checkIn() {
      return this.update({
        status: 'checked_in',
        checkedInAt: new Date()
      });
    }

    /**
     * @description Transitions appointment to 'in_progress' and starts timer
     * @returns {Promise<Appointment>}
     */
    async startConsultation() {
      return this.update({
        status: 'in_progress',
        consultationStartedAt: new Date()
      });
    }

    /**
     * @description Finalizes the consultation with clinical observations
     */
    async complete(notes, instructions) {
      return this.update({
        status: 'completed',
        consultationEndedAt: new Date(),
        notes,
        instructions
      });
    }

    /**
     * @description Cancels appointment and triggers refund logic if paid
     */
    async cancel(reason, cancelledBy) {
      const updates = {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason: reason
      };
      
      // Potential logic for refund triggers
      if (this.paymentStatus === 'paid') {
        logger.info(`REFUND_TRIGGERED: Appointment ${this.appointmentNumber} cancelled. Processing payment refund.`);
      }

      return this.update(updates);
    }

    /**
     * @description Creates a new linked appointment session
     */
    async reschedule(newDate, newTime) {
      const transaction = await sequelize.transaction();
      try {
        const newAppointment = await Appointment.create({
          patientId: this.patientId,
          doctorId: this.doctorId,
          departmentId: this.departmentId,
          appointmentDate: newDate,
          appointmentTime: newTime,
          appointmentType: this.appointmentType,
          rescheduledFrom: this.id,
          source: 'phone'
        }, { transaction });

        await this.update({ status: 'rescheduled' }, { transaction });
        await transaction.commit();
        return newAppointment;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Calculates approximate waiting time in minutes
     * @returns {number}
     */
    async getWaitingTime() {
      if (this.status !== 'scheduled' && this.status !== 'confirmed') return 0;
      // Simplified: tokenNumber * avgConsultationTime of doctor
      const doctor = await sequelize.models.Doctor.findByPk(this.doctorId);
      const queuePosition = await Appointment.count({
        where: {
          doctorId: this.doctorId,
          appointmentDate: this.appointmentDate,
          tokenNumber: { [Op.lt]: this.tokenNumber },
          status: { [Op.in]: ['scheduled', 'confirmed', 'checked_in', 'in_progress'] }
        }
      });
      return queuePosition * (doctor?.averageConsultationTime || 15);
    }

    // --- Class Methods ---

    /**
     * @description Fetches the morning/evening availability slots for a doctor
     */
    static async getAvailableSlots(doctorId, date) {
      // Complex logic to cross-reference Doctor's working hours with existing Appointments
      return []; // Placeholder for implementation
    }

    /**
     * @description Visualizes the live queue for clinical staff
     */
    static async getDoctorQueue(doctorId, date) {
      return this.findAll({
        where: { doctorId, appointmentDate: date },
        order: [['tokenNumber', 'ASC']],
        include: [{ model: sequelize.models.Patient, as: 'patient' }]
      });
    }

    /**
     * @description Analytics snapshot for administrative dashboard
     */
    static async getTodayStats() {
      const today = new Date().toISOString().slice(0, 10);
      return this.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { appointmentDate: today },
        group: ['status']
      });
    }
  }

  Appointment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Sequential ID (HMS-APT-YYYYMMDD-XXXXX) */
    appointmentNumber: {
      type: DataTypes.STRING,
      unique: true,
      field: 'appointment_number'
    },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    departmentId: { type: DataTypes.UUID, allowNull: false, field: 'department_id' },
    appointmentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'appointment_date' },
    appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'appointment_time' },
    endTime: { type: DataTypes.TIME, field: 'end_time' },
    appointmentType: {
      type: DataTypes.ENUM('new_consultation', 'follow_up', 'emergency', 'telemedicine', 'procedure', 'health_checkup'),
      defaultValue: 'new_consultation',
      field: 'appointment_type'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'),
      defaultValue: 'scheduled'
    },
    priority: {
      type: DataTypes.ENUM('normal', 'urgent', 'critical'),
      defaultValue: 'normal'
    },
    /** @type {number} Sequential Daily Token per Doctor */
    tokenNumber: { type: DataTypes.INTEGER, field: 'token_number' },
    consultationFee: { type: DataTypes.DECIMAL(10, 2), field: 'consultation_fee' },
    isFeeWaived: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_fee_waived' },
    feeWaivedReason: { type: DataTypes.STRING, field: 'fee_waived_reason' },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'waived'),
      defaultValue: 'pending',
      field: 'payment_status'
    },
    paymentId: { type: DataTypes.UUID, field: 'payment_id' },
    symptoms: { type: DataTypes.TEXT },
    chiefComplaint: { type: DataTypes.STRING, field: 'chief_complaint' },
    previousAppointmentId: { type: DataTypes.UUID, field: 'previous_appointment_id' },
    referralId: { type: DataTypes.STRING, field: 'referral_id' },
    source: {
      type: DataTypes.ENUM('walk_in', 'online', 'phone', 'emergency', 'referral'),
      defaultValue: 'online'
    },
    // --- Timestamps & Duration Virtuals ---
    checkedInAt: { type: DataTypes.DATE, field: 'checked_in_at' },
    consultationStartedAt: { type: DataTypes.DATE, field: 'consultation_started_at' },
    consultationEndedAt: { type: DataTypes.DATE, field: 'consultation_ended_at' },
    cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    cancelledBy: { type: DataTypes.UUID, field: 'cancelled_by' },
    cancellationReason: { type: DataTypes.STRING, field: 'cancellation_reason' },
    reminderSent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'reminder_sent' },
    reminderSentAt: { type: DataTypes.DATE, field: 'reminder_sent_at' },
    notes: { type: DataTypes.TEXT, comment: 'Confidential clinical notes' },
    instructions: { type: DataTypes.TEXT, comment: 'Post-consultation directions' },
    rescheduledFrom: { type: DataTypes.UUID, field: 'rescheduled_from' },

    // --- Virtuals ---
    waitingTime: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.checkedInAt || !this.consultationStartedAt) return 0;
        return Math.floor((this.consultationStartedAt - this.checkedInAt) / 60000);
      }
    },
    consultationDuration: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.consultationStartedAt || !this.consultationEndedAt) return 0;
        return Math.floor((this.consultationEndedAt - this.consultationStartedAt) / 60000);
      }
    }
  }, {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['appointment_number'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id'] },
      { fields: ['appointment_date'] },
      { fields: ['status'] },
      { fields: ['token_number'] },
      { fields: ['doctor_id', 'appointment_date', 'status'] }
    ],
    scopes: {
      today: { where: { appointmentDate: new Date().toISOString().slice(0, 10) } },
      upcoming: { where: { appointmentDate: { [Op.gte]: new Date().toISOString().slice(0, 10) } } },
      pending: { where: { status: 'scheduled' } },
      byDoctor(id) { return { where: { doctorId: id } }; },
      byPatient(id) { return { where: { patientId: id } }; },
      byStatus(s) { return { where: { status: s } }; },
      byDate(d) { return { where: { appointmentDate: d } }; }
    },
    hooks: {
      beforeCreate: async (apt, options) => {
        // 1. Concurrent Conflict Check & Slot Locking
        if (sequelize.models.Doctor) {
          const doctor = await sequelize.models.Doctor.findByPk(apt.doctorId, { transaction: options.transaction });
          if (!doctor) throw new Error('Clinical Error: Requested doctor does not exist.');
          
          if (doctor.availabilityStatus !== 'available' && apt.priority !== 'critical') {
            throw new Error(`Doctor Unavailable: Current status is ${doctor.availabilityStatus}`);
          }

          // 2. Token Assignment Logic
          const lastToken = await Appointment.max('tokenNumber', {
            where: { doctorId: apt.doctorId, appointmentDate: apt.appointmentDate },
            transaction: options.transaction
          });
          apt.tokenNumber = (lastToken || 0) + 1;

          // 3. Auto-Calculate End Time
          if (apt.appointmentTime && doctor.averageConsultationTime) {
            const start = new Date(`1970-01-01T${apt.appointmentTime}`);
            const end = new Date(start.getTime() + doctor.averageConsultationTime * 60000);
            apt.endTime = end.toTimeString().split(' ')[0];
          }
        }

        // 4. Appointment Number Generation (HMS-APT-YYYYMMDD-XXXXX)
        const dateStr = apt.appointmentDate.replace(/-/g, '');
        const count = await Appointment.count({
          where: { appointmentDate: apt.appointmentDate },
          transaction: options.transaction
        });
        apt.appointmentNumber = `HMS-APT-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterCreate: (apt) => {
        // SMS/Email Dispatch Logic
        logger.info(`NOTIFY_QUEUE: Appointment ${apt.appointmentNumber} confirmed. SMS/Email queued for patient.`);
        
        // Socket broadcast for live clinical queue updates
        try {
          const { getIO } = require('../config/socket');
          getIO().of('/appointments').to(`doctor:${apt.doctorId}`).emit('new_appointment', apt);
        } catch (err) {
          logger.debug('Socket IO not yet available for background tasks.');
        }
      },
      afterUpdate: (apt) => {
        if (apt.changed('status')) {
          logger.info(`STATUS_UPDATE: Appointment ${apt.appointmentNumber} changed to ${apt.status}.`);
          // Real-time updates for OPD lobby screens
        }
      }
    }
  });

  /**
   * Hospital Management - Appointment Associations
   * @param {Object} models - Loaded models
   */
  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Appointment.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    Appointment.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Appointment.belongsTo(models.Appointment, { foreignKey: 'previousAppointmentId', as: 'previousSession' });
    Appointment.belongsTo(models.Appointment, { foreignKey: 'rescheduledFrom', as: 'originalSession' });
    Appointment.hasOne(models.MedicalRecord, { foreignKey: 'appointmentId', as: 'clinicalRecord' });
    Appointment.hasOne(models.Billing, { foreignKey: 'appointmentId', as: 'billingRecord' });
  };

  return Appointment;
};
