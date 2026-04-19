const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('bed-model');

/**
 * Hospital Management System - Bed Model
 * 
 * Lowest granularity of clinical infrastructure management. 
 * Handles patient placement, ADT (Admission-Discharge-Transfer) logic, 
 * and asset lifecycle tracking.
 */
module.exports = (sequelize) => {
  class Bed extends Model {
    /**
     * @description Atomic assignment of patient to this bed
     */
    async assignPatient(patientId, admissionId, expectedDischarge) {
      if (this.status !== 'available' && this.status !== 'reserved') {
        throw new Error('Infrastructure Alert: Bed is not available for assignment.');
      }
      return this.update({
        status: 'occupied',
        currentPatientId: patientId,
        admissionId: admissionId,
        admittedAt: new Date(),
        expectedDischargeDate: expectedDischarge,
        totalAdmissions: this.totalAdmissions + 1
      });
    }

    /**
     * @description Clears the bed for next patient and triggers hygiene protocols
     */
    async releasePatient() {
      const stayDuration = this.calculateCurrentStayDuration();
      return this.update({
        status: 'cleaning',
        currentPatientId: null,
        admissionId: null,
        admittedAt: null,
        lastOccupiedAt: new Date(),
        totalDaysOccupied: (this.totalDaysOccupied || 0) + stayDuration
      });
    }

    /**
     * @description Calculates days since admittedAt
     * @returns {number}
     */
    calculateCurrentStayDuration() {
      if (!this.admittedAt) return 0;
      const diff = Date.now() - new Date(this.admittedAt).getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * @description Marks bed for maintenance
     */
    async markMaintenance(reason, expectedCompletion) {
      return this.update({
        status: 'under_maintenance',
        maintenanceNotes: reason,
        lastMaintenanceAt: new Date()
      });
    }

    // --- Class Methods ---

    /**
     * @description Fetches available inventory for specific ward/type
     */
    static async getAvailableBedsInWard(wardId, bedType) {
      const where = { wardId, status: 'available' };
      if (bedType) where.bedType = bedType;
      return this.findAll({ where });
    }

    /**
     * @description Daily occupancy snapshot for administrative reporting
     */
    static async getBedOccupancyReport(wardId, date) {
      return this.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { wardId },
        group: ['status']
      });
    }
  }

  Bed.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bedNumber: { type: DataTypes.STRING(20), field: 'bed_number' },
    /** @type {string} Forensic ID (BED-WRD-XXX-NUM) */
    bedCode: { type: DataTypes.STRING(50), unique: true, field: 'bed_code' },
    roomId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'room_id',
      references: { model: 'rooms', key: 'id' }
    },
    wardId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'ward_id',
      references: { model: 'wards', key: 'id' }
    },
    bedType: {
      type: DataTypes.ENUM('standard', 'fowler', 'icu', 'bariatric', 'pediatric', 'neonatal', 'delivery', 'recliner', 'stretcher'),
      defaultValue: 'standard',
      field: 'bed_type'
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'reserved', 'under_maintenance', 'quarantine', 'cleaning'),
      defaultValue: 'available'
    },
    /** @type {string} Link to current patient occupying the space */
    currentPatientId: {
      type: DataTypes.UUID,
      field: 'current_patient_id',
      allowNull: true
    },
    /** @type {string} Current clinical admission record identifier */
    admissionId: {
      type: DataTypes.UUID,
      field: 'admission_id'
    },
    admittedAt: { type: DataTypes.DATE, field: 'admitted_at' },
    expectedDischargeDate: { type: DataTypes.DATE, field: 'expected_discharge_date' },
    dailyRate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'daily_rate' },
    /** @type {Array<string>} Mechanical features of the bed asset */
    features: { type: DataTypes.JSON, defaultValue: [] },
    isIsolation: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_isolation' },
    requiresSpecialMattress: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'requires_special_mattress' },
    mattressType: {
      type: DataTypes.ENUM('standard', 'air', 'foam', 'water', 'bariatric'),
      defaultValue: 'standard',
      field: 'mattress_type'
    },
    // --- Metric Tracking ---
    lastOccupiedAt: { type: DataTypes.DATE, field: 'last_occupied_at' },
    lastCleanedAt: { type: DataTypes.DATE, field: 'last_cleaned_at' },
    lastMaintenanceAt: { type: DataTypes.DATE, field: 'last_maintenance_at' },
    totalDaysOccupied: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_days_occupied' },
    totalAdmissions: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_admissions' },
    maintenanceNotes: { type: DataTypes.TEXT, field: 'maintenance_notes' },
    qrCode: { type: DataTypes.STRING, field: 'qr_code', comment: 'S3 URL for printable Bed QR' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    // --- Analytics Aggregates ---
    totalRevenue: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'total_revenue' },
    averageLOS: { type: DataTypes.FLOAT, defaultValue: 0, field: 'average_los' }
  }, {
    sequelize,
    modelName: 'Bed',
    tableName: 'beds',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['bed_code'] },
      { fields: ['room_id'] },
      { fields: ['ward_id'] },
      { fields: ['status'] },
      { fields: ['current_patient_id'] },
      { fields: ['ward_id', 'status'] }
    ],
    scopes: {
      available: { where: { status: 'available', isActive: true } },
      occupied: { where: { status: 'occupied' } },
      needsMaintenance: { where: { status: 'under_maintenance' } },
      byWard(id) { return { where: { wardId: id } }; },
      byRoom(id) { return { where: { roomId: id } }; },
      byType(type) { return { where: { bedType: type } }; }
    },
    hooks: {
      beforeCreate: async (bed) => {
        // Generate Sequential Bed Code
        if (sequelize.models.Ward) {
          const ward = await sequelize.models.Ward.findByPk(bed.wardId);
          const count = await Bed.count({ where: { wardId: bed.wardId } });
          const code = ward ? ward.wardCode : 'WRD';
          bed.bedCode = `BED-${code}-${(count + 1).toString().padStart(3, '0')}`;
        }
      },
      beforeUpdate: (bed) => {
        // Enforce Clinical Status Transition Policy
        if (bed.changed('status')) {
          const oldStatus = bed.previous('status');
          const newStatus = bed.status;
          
          if (oldStatus === 'occupied' && newStatus === 'reserved') {
            throw new Error('Compliance Violation: Direct transition from Occupied to Reserved is prohibited.');
          }
        }
      },
      afterUpdate: (bed) => {
        // Real-time Availability Broadcast
        if (bed.changed('status') && bed.status === 'available') {
          try {
            const { getIO } = require('../config/socket');
            getIO().of('/ambulance').emit('bed_available', { 
              bedId: bed.id, 
              wardId: bed.wardId, 
              type: bed.bedType 
            });
            logger.info(`REAL_TIME_INVENTORY: Bed ${bed.bedCode} is now available for admission.`);
          } catch (err) { /* Socket not yet init */ }
        }
      }
    }
  });

  /**
   * Hospital Management - Bed Associations
   * @param {Object} models - Loaded models
   */
  Bed.associate = (models) => {
    Bed.belongsTo(models.Ward, { foreignKey: 'wardId', as: 'ward' });
    Bed.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
    Bed.belongsTo(models.Patient, { foreignKey: 'currentPatientId', as: 'currentPatient' });
  };

  return Bed;
};
