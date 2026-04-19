const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('patient-model');

/**
 * Hospital Management System - Comprehensive Patient Model
 * 
 * Central registry for clinical and demographic patient data.
 * Implements UHID generation (Universal Health ID), medical history tracking,
 * and insurance lifecycle management.
 */
module.exports = (sequelize) => {
  class Patient extends Model {
    /**
     * @description Orchestrates the UHID generation following standard: HMS-PAT-YYYYMMDD-XXXXX
     * @returns {Promise<string>} Generated UHID
     */
    static async generateUHID() {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await this.count({
        where: {
          patientId: { [Op.like]: `HMS-PAT-${date}-%` }
        }
      });
      const sequence = (count + 1).toString().padStart(5, '0');
      return `HMS-PAT-${date}-${sequence}`;
    }

    /**
     * @description Computes age based on DOB
     * @param {Date} dob - Date of Birth
     * @returns {number} Age in years
     */
    static calculateAge(dob) {
      const diff = Date.now() - new Date(dob).getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
  }

  Patient.init({
    /** @type {string} Internal UUID Primary Key */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Universal Health Identifier (HMS-PAT-YYYYMMDD-XXXXX) */
    patientId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'patient_id',
      comment: 'UHID - Medical Record Number'
    },
    /** @type {string} Optional link to authentication portal user */
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: true,
      references: { model: 'users', key: 'id' }
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_of_birth'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: false
    },
    bloodGroup: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      field: 'blood_group'
    },
    maritalStatus: {
      type: DataTypes.STRING(20),
      field: 'marital_status'
    },
    nationality: {
      type: DataTypes.STRING(50),
      defaultValue: 'Indian'
    },
    religion: {
      type: DataTypes.STRING(50)
    },
    email: {
      type: DataTypes.STRING(100),
      validate: { isEmail: true },
      set(val) { this.setDataValue('email', val?.toLowerCase().trim()); }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    alternatePhone: {
      type: DataTypes.STRING(20),
      field: 'alternate_phone'
    },
    /** @type {Object} Physical residence coordinates */
    address: {
      type: DataTypes.JSON,
      comment: 'JSON structure for street, city, state, pincode, country'
    },
    /** @type {string} S3 Object Storage key for patient visual id */
    photo: {
      type: DataTypes.STRING,
      validate: { isUrl: true }
    },
    idProofType: {
      type: DataTypes.ENUM('aadhaar', 'passport', 'pan', 'voter_id', 'driving_license'),
      field: 'id_proof_type'
    },
    idProofNumber: {
      type: DataTypes.STRING(50),
      field: 'id_proof_number'
    },
    /** @type {string} S3 Object Storage key for document proof */
    idProofDoc: {
      type: DataTypes.STRING,
      field: 'id_proof_doc',
      validate: { isUrl: true }
    },
    /** @type {Object} KIN/Emergency Contact Data */
    emergencyContact: {
      type: DataTypes.JSON,
      field: 'emergency_contact',
      comment: 'JSON structure for name, relation, phone, address'
    },
    referredBy: {
      type: DataTypes.STRING(100),
      field: 'referred_by'
    },
    referralSource: {
      type: DataTypes.ENUM('self', 'doctor', 'hospital', 'online', 'insurance', 'other'),
      field: 'referral_source',
      defaultValue: 'self'
    },
    occupation: {
      type: DataTypes.STRING(100)
    },
    annualIncome: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'annual_income'
    },
    patientType: {
      type: DataTypes.ENUM('opd', 'ipd', 'emergency', 'daycare'),
      field: 'patient_type',
      defaultValue: 'opd'
    },
    registrationType: {
      type: DataTypes.ENUM('new', 'revisit'),
      field: 'registration_type',
      defaultValue: 'new'
    },
    isVIP: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_vip'
    },
    notes: {
      type: DataTypes.TEXT
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    },
    // --- Virtual Fields ---
    fullName: {
      type: DataTypes.VIRTUAL,
      get() { return `${this.firstName} ${this.lastName}`; }
    },
    age: {
      type: DataTypes.VIRTUAL,
      get() {
        const diff = Date.now() - new Date(this.dateOfBirth).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
      }
    },
    isMinor: {
      type: DataTypes.VIRTUAL,
      get() {
        const diff = Date.now() - new Date(this.dateOfBirth).getTime();
        const age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
        return age < 18;
      }
    },

    // --- Medical Data ---
    allergies: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    chronicConditions: {
      type: DataTypes.JSON,
      field: 'chronic_conditions',
      defaultValue: []
    },
    currentMedications: {
      type: DataTypes.JSON,
      field: 'current_medications',
      defaultValue: []
    },
    familyHistory: {
      type: DataTypes.TEXT,
      field: 'family_history'
    },
    /** @type {Object} Behavioral Lifestyle Matrix */
    lifestyle: {
      type: DataTypes.JSON,
      comment: 'JSON for smoking, alcohol, exercise patterns'
    },
    dietaryRestrictions: {
      type: DataTypes.JSON,
      field: 'dietary_restrictions',
      defaultValue: []
    },

    // --- Insurance Ecology ---
    hasInsurance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_insurance'
    },
    insuranceProvider: {
      type: DataTypes.STRING(100),
      field: 'insurance_provider'
    },
    policyNumber: {
      type: DataTypes.STRING(100),
      field: 'policy_number'
    },
    policyExpiry: {
      type: DataTypes.DATEONLY,
      field: 'policy_expiry'
    },
    tpaName: {
      type: DataTypes.STRING(100),
      field: 'tpa_name'
    }
  }, {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['patient_id'] },
      { unique: true, fields: ['phone'] },
      { fields: ['email'] },
      { fields: ['blood_group'] },
      { fields: ['patient_type'] },
      { fields: ['created_at'] }
    ],
    scopes: {
      active: { where: { deleted_at: null } },
      opd: { where: { patientType: 'opd' } },
      ipd: { where: { patientType: 'ipd' } },
      emergency: { where: { patientType: 'emergency' } },
      vip: { where: { isVIP: true } },
      withInsurance: { where: { hasInsurance: true } },
      byBloodGroup(bg) { return { where: { bloodGroup: bg } }; }
    },
    hooks: {
      beforeCreate: async (patient) => {
        // 1. Universal Health Identifier Generation
        patient.patientId = await Patient.generateUHID();

        // 2. Logic to detect Revisit vs New Registration
        const existing = await Patient.findOne({
          where: {
            [Op.or]: [{ phone: patient.phone }, { email: patient.email }]
          }
        });
        if (existing) {
          patient.registrationType = 'revisit';
          logger.info(`Identity Match: Patient ${patient.phone} marked as revisit.`);
        }
      },
      afterCreate: async (patient, options) => {
        try {
          // Trigger initial medical record instantiation
          if (sequelize.models.MedicalRecord) {
            await sequelize.models.MedicalRecord.create({
              patientId: patient.id,
              recordType: 'registration_baseline',
              notes: 'Initial registration baseline created.'
            }, { transaction: options.transaction });
            logger.info(`Clinical Baseline: Medical record initialized for ${patient.patientId}`);
          }
        } catch (err) {
          logger.error(`Clinical Hook Failure: Failed to create baseline for ${patient.patientId} - ${err.message}`);
        }
      }
    }
  });

  /**
   * Hospital Management - Patient Associations
   * @param {Object} models - All loaded models
   */
  Patient.associate = (models) => {
    Patient.belongsTo(models.User, { foreignKey: 'userId', as: 'userAccount' });
    Patient.hasMany(models.Appointment, { foreignKey: 'patientId', as: 'appointments' });
    Patient.hasMany(models.MedicalRecord, { foreignKey: 'patientId', as: 'medicalRecords' });
    Patient.hasMany(models.Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
    Patient.hasMany(models.LabTest, { foreignKey: 'patientId', as: 'labTests' });
    Patient.hasMany(models.Billing, { foreignKey: 'patientId', as: 'bills' });
    Patient.hasMany(models.Emergency, { foreignKey: 'patientId', as: 'emergencyReports' });
    Patient.hasMany(models.Discharge, { foreignKey: 'patientId', as: 'discharges' });
  };

  return Patient;
};
