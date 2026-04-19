const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('blood-bank-model');

/**
 * Hospital Management System - Blood Bank Orchestration
 * 
 * Manages the high-stakes lifecycle of blood products from donation 
 * and testing to patient-specific requests and life-saving transfusions.
 */
module.exports = (sequelize) => {
  // --- Blood Donor Model ---
  class BloodDonor extends Model {}
  BloodDonor.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    donorId: { type: DataTypes.STRING, unique: true, field: 'donor_id' },
    patientId: { type: DataTypes.UUID, field: 'patient_id', allowNull: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
    dob: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('male', 'female', 'other') },
    bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), field: 'blood_group' },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    address: { type: DataTypes.JSON, defaultValue: {} },
    idProof: { type: DataTypes.STRING(100), field: 'id_proof' },
    idProofDoc: { type: DataTypes.STRING, field: 'id_proof_doc' },
    weight: { type: DataTypes.FLOAT },
    lastDonationDate: { type: DataTypes.DATEONLY, field: 'last_donation_date' },
    totalDonations: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_donations' },
    nextEligibleDate: { type: DataTypes.DATEONLY, field: 'next_eligible_date' },
    // --- Deferral Logic ---
    isDeferredTemporarily: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_deferred_temporarily' },
    isDeferredPermanently: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_deferred_permanently' },
    deferralReason: { type: DataTypes.STRING, field: 'deferral_reason' },
    deferralExpiryDate: { type: DataTypes.DATEONLY, field: 'deferral_expiry_date' },
    medicalHistory: { type: DataTypes.JSON, defaultValue: {}, field: 'medical_history' },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'registered_at' }
  }, {
    sequelize,
    modelName: 'BloodDonor',
    tableName: 'blood_donors',
    underscored: true,
    hooks: {
      beforeCreate: async (donor) => {
        const count = await BloodDonor.count();
        donor.donorId = `DONOR-${(count + 1).toString().padStart(5, '0')}`;
        // Set eligibility: 90 days after last donation
        if (donor.lastDonationDate) {
          const date = new Date(donor.lastDonationDate);
          date.setDate(date.getDate() + 90);
          donor.nextEligibleDate = date.toISOString().slice(0, 10);
        }
      }
    }
  });

  // --- Blood Inventory Model ---
  class BloodInventory extends Model {
    /**
     * @description ABO/Rh Compatibility Logic
     */
    checkCompatibility(patientBloodGroup) {
       // logic for matching O- as universal donor, etc.
       return this.bloodGroup === patientBloodGroup || this.bloodGroup === 'O-';
    }

    /**
     * @description Reserves unit for a specific patient/procedure
     */
    async reserve(patientId, requestId, reservedUntil) {
       return this.update({
         status: 'reserved',
         reservedForPatientId: patientId,
         reservedAt: new Date(),
         reservedUntil
       });
    }

    /**
     * @description Finalizes the issuance for transfusion
     */
    async issue(patientId, issuedBy, reason) {
      if (this.status === 'expired') throw new Error('Clinical Alert: Unit expired.');
      return this.update({
        status: 'issued',
        issuedToPatientId: patientId,
        issuedAt: new Date(),
        issuedBy,
        issuedFor: reason
      });
    }

    // --- Class Methods ---
    static async getExpiringUnits(hours = 24) {
      const threshold = new Date();
      threshold.setHours(threshold.getHours() + hours);
      return this.findAll({
        where: { expiryDate: { [Op.lte]: threshold, [Op.gt]: new Date() }, status: { [Op.ne]: 'issued' } }
      });
    }
  }

  BloodInventory.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: false, field: 'blood_group' },
    componentType: {
      type: DataTypes.ENUM('whole_blood', 'prbc', 'ffp', 'platelets', 'cryoprecipitate', 'albumin', 'single_donor_platelets'),
      allowNull: false,
      field: 'component_type'
    },
    unitNumber: { type: DataTypes.STRING, unique: true, field: 'unit_number' },
    donorId: { type: DataTypes.UUID, field: 'donor_id', references: { model: 'blood_donors', key: 'id' } },
    collectionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'collection_date' },
    expiryDate: { type: DataTypes.DATE, allowNull: false, field: 'expiry_date' },
    volume: { type: DataTypes.FLOAT, comment: 'Unit volume in ml' },
    status: {
      type: DataTypes.ENUM('quarantine', 'tested', 'available', 'reserved', 'issued', 'expired', 'discarded', 'returned'),
      defaultValue: 'quarantine'
    },
    testingStatus: { type: DataTypes.ENUM('pending', 'in_progress', 'completed'), defaultValue: 'pending', field: 'testing_status' },
    /** @type {Object} {hiv, hbsag, hcv, vdrl, malaria...} */
    testResults: { type: DataTypes.JSON, defaultValue: {}, field: 'test_results' },
    cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    location: { type: DataTypes.STRING(100) },
    // --- Reservation Logic ---
    reservedForPatientId: { type: DataTypes.UUID, field: 'reserved_for_patient_id' },
    reservedAt: { type: DataTypes.DATE, field: 'reserved_at' },
    reservedUntil: { type: DataTypes.DATE, field: 'reserved_until' },
    issuedToPatientId: { type: DataTypes.UUID, field: 'issued_to_patient_id' },
    issuedAt: { type: DataTypes.DATE, field: 'issued_at' },
    issuedBy: { type: DataTypes.UUID, field: 'issued_by' },
    issuedFor: { type: DataTypes.STRING, field: 'issued_for' },
    transfusedAt: { type: DataTypes.DATE, field: 'transfused_at' },
    transfusionReaction: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'transfusion_reaction' },
    reactionDetails: { type: DataTypes.TEXT, field: 'reaction_details' },
    discardReason: { type: DataTypes.STRING, field: 'discard_reason' }
  }, {
    sequelize,
    modelName: 'BloodInventory',
    tableName: 'blood_inventory',
    underscored: true,
    hooks: {
      beforeCreate: async (unit) => {
        const count = await BloodInventory.count();
        unit.unitNumber = `BB-UNIT-${(count + 1).toString().padStart(7, '0')}`;
        
        // Auto-sets Expiry based on Component policy
        const collected = new Date(unit.collectionDate || new Date());
        if (unit.componentType === 'prbc') collected.setDate(collected.getDate() + 42);
        else if (unit.componentType === 'platelets') collected.setDate(collected.getDate() + 5);
        else if (unit.componentType === 'ffp') collected.setFullYear(collected.getFullYear() + 1);
        unit.expiryDate = unit.expiryDate || collected;
      }
    }
  });

  // --- Blood Request Model ---
  class BloodRequest extends Model {}
  BloodRequest.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    requestNumber: { type: DataTypes.STRING, unique: true, field: 'request_number' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    requestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'requested_at' },
    requiredBy: { type: DataTypes.DATE, field: 'required_by' },
    bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), field: 'blood_group' },
    componentType: { type: DataTypes.STRING(50), field: 'component_type' },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    priority: { type: DataTypes.ENUM('routine', 'urgent', 'emergency', 'massive_transfusion'), defaultValue: 'routine' },
    clinicalIndication: { type: DataTypes.TEXT, field: 'clinical_indication' },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'cross_matching', 'allotted', 'issued', 'partially_fulfilled', 'cancelled', 'returned'),
      defaultValue: 'pending'
    },
    issuedUnits: { type: DataTypes.JSON, defaultValue: [], field: 'issued_units' },
    transfusionCompletedAt: { type: DataTypes.DATE, field: 'transfusion_completed_at' },
    transfusionReaction: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'transfusion_reaction' }
  }, {
    sequelize,
    modelName: 'BloodRequest',
    tableName: 'blood_requests',
    underscored: true,
    hooks: {
      beforeCreate: async (req) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await BloodRequest.count();
        req.requestNumber = `BBR-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      }
    }
  });

  /**
   * Hospital Management - Blood Bank Associations
   */
  BloodInventory.associate = (models) => {
    BloodInventory.belongsTo(models.BloodDonor, { foreignKey: 'donorId', as: 'donor' });
    BloodInventory.belongsTo(models.Patient, { foreignKey: 'reservedForPatientId', as: 'reservedFor' });
    BloodInventory.belongsTo(models.Patient, { foreignKey: 'issuedToPatientId', as: 'issuedTo' });
  };

  BloodRequest.associate = (models) => {
    BloodRequest.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    BloodRequest.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
  };

  BloodDonor.associate = (models) => {
    BloodDonor.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'linkedPatient' });
    BloodDonor.hasMany(models.BloodInventory, { foreignKey: 'donorId', as: 'donations' });
  };

  return { BloodInventory, BloodDonor, BloodRequest };
};
