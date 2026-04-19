const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('doctor-model');

/**
 * Hospital Management System - Advanced Doctor Model
 * 
 * Clinical data structure for medical practitioners. 
 * Handles medical registration, pricing, scheduling, and performance metrics.
 */
module.exports = (sequelize) => {
  class Doctor extends Model {
    /**
     * @description Calculates free slots for a given date
     * @param {Date} date - Date to check availability
     * @returns {Promise<Array<string>>} List of time slots
     */
    async getAvailableSlots(date) {
      // Logic would typically query Appointment model for existing slots
      // and subtract from schedule working hours. 
      // Placeholder for implementation logic.
      return [];
    }

    /**
     * @description Recalculates average rating on new review
     * @param {number} newRating - Rating to add
     * @returns {Promise<Doctor>} Updated instance
     */
    async updateRating(newRating) {
      const newTotal = (this.rating * this.totalRatings) + newRating;
      this.totalRatings += 1;
      this.rating = (newTotal / this.totalRatings).toFixed(2);
      return this.save();
    }

    /**
     * @description Returns total appointments scheduled for current server date
     * @returns {Promise<number>} Count
     */
    async getTodaysAppointmentCount() {
      if (!sequelize.models.Appointment) return 0;
      const today = new Date().toISOString().slice(0, 10);
      return sequelize.models.Appointment.count({
        where: { doctorId: this.id, date: today }
      });
    }
  }

  Doctor.init({
    /** @type {string} Unique UUID Primary Key */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Institutional ID (HMS-DOC-XXXXX) */
    doctorId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'doctor_id',
      comment: 'Sequential Medical ID (HMS-DOC-XXXXX)'
    },
    /** @type {string} Authentication link */
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    /** @type {string} Organizational binding */
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'department_id',
      references: { model: 'departments', key: 'id' }
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subSpecialization: {
      type: DataTypes.STRING,
      field: 'sub_specialization'
    },
    /** @type {Array<Object>} Educational credentials */
    qualification: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of [{degree, institution, year, certificate_url}]'
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total years of medical experience'
    },
    /** @type {string} Legal Medical Council registration numeric identifier */
    registrationNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'registration_number'
    },
    registrationExpiry: {
      type: DataTypes.DATEONLY,
      field: 'registration_expiry'
    },
    registrationDoc: {
      type: DataTypes.STRING,
      field: 'registration_doc',
      validate: { isUrl: true }
    },
    // --- Pricing Engine ---
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'consultation_fee'
    },
    followupFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'followup_fee'
    },
    emergencyFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'emergency_fee'
    },
    bio: {
      type: DataTypes.TEXT
    },
    /** @type {Array<string>} List of proficient languages */
    languages: {
      type: DataTypes.JSON,
      defaultValue: ['English']
    },
    awards: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    publications: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    signatureImage: {
      type: DataTypes.STRING,
      field: 'signature_image',
      validate: { isUrl: true }
    },
    // --- Operational Status ---
    isOnDuty: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_on_duty'
    },
    isAvailableForEmergency: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_available_for_emergency'
    },
    availabilityStatus: {
      type: DataTypes.ENUM('available', 'busy', 'on_leave', 'off_duty'),
      defaultValue: 'available',
      field: 'availability_status'
    },
    averageConsultationTime: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      field: 'average_consultation_time',
      comment: 'Minutes per patient'
    },
    maxPatientsPerDay: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_patients_per_day'
    },
    // --- Performance Matrix ---
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_ratings'
    },
    totalConsultations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_consultations'
    },
    isTelemedicineEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_telemedicine_enabled'
    },
    telemedicineRate: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'telemedicine_rate'
    },
    // --- Scheduling Protocol ---
    workingDays: {
      type: DataTypes.JSON,
      defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      field: 'working_days'
    },
    morningStart: { type: DataTypes.TIME, field: 'morning_start' },
    morningEnd: { type: DataTypes.TIME, field: 'morning_end' },
    eveningStart: { type: DataTypes.TIME, field: 'evening_start' },
    eveningEnd: { type: DataTypes.TIME, field: 'evening_end' },
    lunchBreakStart: { type: DataTypes.TIME, field: 'lunch_break_start' },
    lunchBreakEnd: { type: DataTypes.TIME, field: 'lunch_break_end' },
    leaveBuffer: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'leave_buffer',
      comment: 'Minutes gap between appointments'
    },
    // --- Virtuals ---
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.User ? `${this.User.firstName} ${this.User.lastName}` : 'Doc';
      }
    },
    currentStatus: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.availabilityStatus} ${this.isOnDuty ? '(On-Duty)' : '(Off-Duty)'}`;
      }
    }
  }, {
    sequelize,
    modelName: 'Doctor',
    tableName: 'doctors',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['doctor_id'] },
      { unique: true, fields: ['registration_number'] },
      { fields: ['department_id'] },
      { fields: ['specialization'] },
      { fields: ['is_on_duty'] },
      { fields: ['rating'] }
    ],
    scopes: {
      active: { where: { deleted_at: null } },
      available: { 
        where: { 
          availabilityStatus: 'available',
          isOnDuty: true 
        } 
      },
      onDuty: { where: { isOnDuty: true } },
      telemedicineEnabled: { where: { isTelemedicineEnabled: true } },
      byDepartment(id) { return { where: { departmentId: id } }; },
      bySpecialization(spec) { return { where: { specialization: { [Op.like]: `%${spec}%` } } }; }
    },
    hooks: {
      beforeCreate: async (doctor) => {
        // 1. Uniqueness Validation for Medical Registration
        const existing = await Doctor.findOne({ 
          where: { registrationNumber: doctor.registrationNumber } 
        });
        if (existing) throw new Error('Registration number already exists in registry.');

        // 2. Sequential ID Generation
        const count = await Doctor.count();
        doctor.doctorId = `HMS-DOC-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterUpdate: (doctor) => {
        // Real-time broadcast of availability status change
        if (doctor.changed('availabilityStatus')) {
          try {
            const { getIO } = require('../config/socket');
            const io = getIO();
            io.of('/notifications').to('admin').emit('doctor_status_change', {
              doctorId: doctor.id,
              status: doctor.availabilityStatus
            });
            logger.info(`REAL_TIME_UPDATE: Broadcasted status change for Dr. ${doctor.id}`);
          } catch (err) {
            logger.warn('Socket Broadcast Skipped: System initializing or socket not bound.');
          }
        }
      }
    }
  });

  /**
   * Hospital Management - Doctor Associations
   * @param {Object} models - Loaded models
   */
  Doctor.associate = (models) => {
    Doctor.belongsTo(models.User, { foreignKey: 'userId', as: 'userAccount' });
    Doctor.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Doctor.hasMany(models.Appointment, { foreignKey: 'doctorId', as: 'appointments' });
    Doctor.hasMany(models.Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
    Doctor.hasMany(models.TelemedicineSession, { foreignKey: 'doctorId', as: 'teleSessions' });
  };

  return Doctor;
};
