const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('ward-model');

/**
 * Hospital Management System - Ward Infrastructure Model
 * 
 * Manages physical ward assets, occupancy tracking, and clinical resource allocation.
 * Orchestrates admissions, discharges, and inter-ward transfers.
 */
module.exports = (sequelize) => {
  class Ward extends Model {
    /**
     * @description Calculates live occupancy percentage
     * @returns {number} 0-100
     */
    getOccupancyPercentage() {
      if (!this.totalBeds) return 0;
      return (this.occupiedBeds / this.totalBeds) * 100;
    }

    /**
     * @description Fetches all available beds within this ward
     * @returns {Promise<Array<Object>>}
     */
    async getAvailableBeds() {
      if (!sequelize.models.Bed) return [];
      return sequelize.models.Bed.findAll({
        where: { wardId: this.id, status: 'available' }
      });
    }

    /**
     * @description Executes atomical admission logic
     */
    async admitPatient(patientId, bedId) {
      const transaction = await sequelize.transaction();
      try {
        const bed = await sequelize.models.Bed.findByPk(bedId, { transaction });
        if (!bed || bed.status !== 'available') throw new Error('Bed Unavailable');

        await bed.update({ status: 'occupied', patientId }, { transaction });
        await this.increment('occupiedBeds', { transaction });
        
        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Resets bed status and decrements ward occupancy
     */
    async dischargePatient(patientId) {
      const transaction = await sequelize.transaction();
      try {
        const bed = await sequelize.models.Bed.findOne({ where: { patientId }, transaction });
        if (bed) {
          await bed.update({ status: 'available', patientId: null }, { transaction });
          await this.decrement('occupiedBeds', { transaction });
        }
        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Atomic transfer of patient between beds/wards
     */
    async transferPatient(patientId, targetWardId, targetBedId) {
      const transaction = await sequelize.transaction();
      try {
        await this.dischargePatient(patientId); // Local decrement
        const targetWard = await Ward.findByPk(targetWardId, { transaction });
        await targetWard.admitPatient(patientId, targetBedId); // Remote increment
        
        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
  }

  Ward.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    /** @type {string} Infrastructure ID (WRD-XXX) */
    wardCode: {
      type: DataTypes.STRING,
      unique: true,
      field: 'ward_code'
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    type: {
      type: DataTypes.ENUM(
        'general', 'icu', 'nicu', 'picu', 'ccu', 'ot', 'emergency', 'maternity', 
        'pediatric', 'oncology', 'orthopedic', 'psychiatric', 'isolation', 'post_op', 'daycare'
      ),
      allowNull: false
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'department_id',
      references: { model: 'departments', key: 'id' }
    },
    floorNumber: { type: DataTypes.INTEGER, field: 'floor_number' },
    wingLocation: { type: DataTypes.STRING(50), field: 'wing_location' },
    // --- Bed Inventory ---
    totalBeds: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_beds' },
    occupiedBeds: { type: DataTypes.INTEGER, defaultValue: 0, field: 'occupied_beds' },
    maintenanceBeds: { type: DataTypes.INTEGER, defaultValue: 0, field: 'maintenance_beds' },
    gender: { type: DataTypes.ENUM('male', 'female', 'mixed', 'pediatric'), defaultValue: 'mixed' },
    // --- Capability Matrix ---
    isIsolationCapable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_isolation_capable' },
    hasVentilators: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_ventilators' },
    ventilatorCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'ventilator_count' },
    hasMonitors: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_monitors' },
    monitorCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'monitor_count' },
    hasCCTV: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_cctv' },
    /** @type {Object} Nursing station geographic coordinates */
    nursingStation: { type: DataTypes.JSON, field: 'nursing_station' },
    /** @type {string} Senior Charge Nurse responsible for this ward */
    wardInchargeNurseId: { type: DataTypes.UUID, field: 'ward_incharge_nurse_id' },
    /** @type {string} Chief Resident/Consultant responsible for clinical oversight */
    wardInchargeDoctorId: { type: DataTypes.UUID, field: 'ward_incharge_doctor_id' },
    /** @type {Array<Object>} Visiting protocol [{day, from, to}] */
    visitingHours: { type: DataTypes.JSON, field: 'visiting_hours', defaultValue: [] },
    maxVisitorsPerPatient: { type: DataTypes.INTEGER, defaultValue: 2, field: 'max_visitors_per_patient' },
    // --- Billing Engine ---
    dailyCharge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'daily_charge' },
    icuDailyCharge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'icu_daily_charge' },
    facilities: { type: DataTypes.JSON, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    isUnderMaintenance: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_under_maintenance' },
    maintenanceReason: { type: DataTypes.STRING, field: 'maintenance_reason' },
    maintenanceStartDate: { type: DataTypes.DATE, field: 'maintenance_start_date' },
    maintenanceEndDate: { type: DataTypes.DATE, field: 'maintenance_end_date' },

    // --- Virtuals ---
    availableBeds: {
      type: DataTypes.VIRTUAL,
      get() {
        return Math.max(0, this.totalBeds - this.occupiedBeds - this.maintenanceBeds);
      }
    }
  }, {
    sequelize,
    modelName: 'Ward',
    tableName: 'wards',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['ward_code'] },
      { fields: ['type'] },
      { fields: ['department_id'] },
      { fields: ['is_active'] },
      { fields: ['floor_number'] }
    ],
    scopes: {
      active: { where: { isActive: true, isUnderMaintenance: false } },
      icu: { where: { type: { [Op.in]: ['icu', 'nicu', 'picu', 'ccu'] } } },
      emergency: { where: { type: 'emergency' } },
      withAvailableBeds: {
        where: sequelize.literal('(total_beds - occupied_beds - maintenance_beds) > 0')
      },
      byType(type) { return { where: { type } }; },
      byDepartment(id) { return { where: { departmentId: id } }; }
    },
    hooks: {
      beforeCreate: async (ward) => {
        const count = await Ward.count();
        ward.wardCode = `WRD-${(count + 1).toString().padStart(3, '0')}`;
      },
      beforeUpdate: (ward) => {
        if (ward.totalBeds < ward.occupiedBeds) {
          throw new Error('Infrastructure Error: Total beds cannot be less than current occupancy.');
        }
      },
      afterUpdate: (ward) => {
        // High Occupancy Alerts
        const rate = (ward.occupiedBeds / ward.totalBeds) * 100;
        if (rate >= 90) {
          logger.warn(`WARD_CAPACITY_ALERT: Ward ${ward.name} has reached ${rate.toFixed(2)}% occupancy.`);
          // Emit socket alert for bed manager
          try {
            const { getIO } = require('../config/socket');
            getIO().of('/ambulance').emit('ward_full', { wardId: ward.id, occupancy: rate });
          } catch (err) { /* Socket not yet init */ }
        }
      }
    }
  });

  /**
   * Hospital Management - Ward Associations
   * @param {Object} models - Loaded models
   */
  Ward.associate = (models) => {
    Ward.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Ward.belongsTo(models.Nurse, { foreignKey: 'wardInchargeNurseId', as: 'inchargeNurse' });
    Ward.belongsTo(models.Doctor, { foreignKey: 'wardInchargeDoctorId', as: 'inchargeDoctor' });
    Ward.hasMany(models.Room, { foreignKey: 'wardId', as: 'rooms' });
    Ward.hasMany(models.Bed, { foreignKey: 'wardId', as: 'beds' });
    Ward.hasMany(models.Nurse, { foreignKey: 'wardId', as: 'nurseStaff' });
  };

  return Ward;
};
