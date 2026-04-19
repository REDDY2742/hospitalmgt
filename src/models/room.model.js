const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('room-model');

/**
 * Hospital Management System - Room Model
 * 
 * Manages physical room inventory, clinical amenities, 
 * hygiene statuses (Cleaning/Maintenance), and patient occupancy.
 */
module.exports = (sequelize) => {
  class Room extends Model {
    /**
     * @description Fetches all unassigned bed IDs within this room
     * @returns {Promise<Array<Object>>}
     */
    async getAvailableBedsInRoom() {
      if (!sequelize.models.Bed) return [];
      return sequelize.models.Bed.findAll({
        where: { roomId: this.id, status: 'available' }
      });
    }

    /**
     * @description Assigns a patient to a specific bed in this room
     */
    async assignBed(patientId, bedId) {
      if (!sequelize.models.Bed) return false;
      const bed = await sequelize.models.Bed.findByPk(bedId);
      if (!bed || bed.roomId !== this.id || bed.status !== 'available') {
        throw new Error('Bed Assignment Error: Bed is either unavailable or belongs to another room.');
      }
      return bed.update({ status: 'occupied', patientId });
    }

    /**
     * @description Transitions room to cleaning required state
     */
    async markForCleaning() {
      return this.update({
        cleaningStatus: 'needs_cleaning',
        status: 'cleaning'
      });
    }

    /**
     * @description Marks room as sanitized
     */
    async markCleaned(cleanedBy) {
      return this.update({
        cleaningStatus: 'clean',
        status: this.currentOccupancy > 0 ? 'partially_occupied' : 'available',
        lastCleaned: new Date()
      });
    }

    /**
     * @description Financial projection for room stay
     */
    getRoomRevenue(startDate, endDate) {
      const days = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      return (days || 1) * this.dailyRate;
    }
  }

  Room.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roomNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      field: 'room_number'
    },
    roomName: { type: DataTypes.STRING(100), field: 'room_name' },
    wardId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'ward_id',
      references: { model: 'wards', key: 'id' }
    },
    floorNumber: { type: DataTypes.INTEGER, field: 'floor_number' },
    roomType: {
      type: DataTypes.ENUM(
        'general', 'semi_private', 'private', 'deluxe', 'suite', 'icu', 
        'operation_theatre', 'procedure_room', 'consultation_room', 
        'isolation', 'storage', 'nurses_station', 'utility'
      ),
      allowNull: false,
      field: 'room_type'
    },
    capacity: { type: DataTypes.INTEGER, defaultValue: 1 },
    currentOccupancy: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_occupancy' },
    status: {
      type: DataTypes.ENUM('available', 'partially_occupied', 'fully_occupied', 'under_maintenance', 'reserved', 'cleaning'),
      defaultValue: 'available'
    },
    dailyRate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'daily_rate' },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'JSON list of amenities like AC, TV, WIFI, etc.'
    },
    /** @type {Object} Metric space {length, width, unit} */
    dimensions: { type: DataTypes.JSON },
    // --- Bedside Gasses & Safety ---
    hasCallBell: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'has_call_bell' },
    hasEmergencyCode: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'has_emergency_code' },
    hasSuction: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_suction' },
    hasOxygen: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_oxygen' },
    hasCompressedAir: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_compressed_air' },
    /** @type {string} Nurse currently in charge of this room zone */
    assignedNurseId: { type: DataTypes.UUID, field: 'assigned_nurse_id' },
    // --- Sanitization & Maintenance ---
    lastCleaned: { type: DataTypes.DATE, field: 'last_cleaned' },
    cleaningStatus: {
      type: DataTypes.ENUM('clean', 'needs_cleaning', 'being_cleaned', 'inspected'),
      defaultValue: 'clean',
      field: 'cleaning_status'
    },
    maintenanceHistory: { type: DataTypes.JSON, defaultValue: [], field: 'maintenance_history' },
    notes: { type: DataTypes.TEXT },
    photos: { type: DataTypes.JSON, defaultValue: [] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['room_number'] },
      { fields: ['ward_id'] },
      { fields: ['room_type'] },
      { fields: ['status'] },
      { fields: ['floor_number'] }
    ],
    scopes: {
      available: { where: { status: 'available', isActive: true } },
      needsCleaning: { where: { cleaningStatus: 'needs_cleaning' } },
      byWard(id) { return { where: { wardId: id } }; },
      byType(type) { return { where: { roomType: type } }; }
    },
    hooks: {
      afterUpdate: async (room) => {
        // 1. Automatic Occupancy-based Status Updating
        if (room.changed('currentOccupancy')) {
          let newStatus = room.status;
          if (room.currentOccupancy === 0) newStatus = 'available';
          else if (room.currentOccupancy >= room.capacity) newStatus = 'fully_occupied';
          else newStatus = 'partially_occupied';
          
          if (newStatus !== room.status) {
            await room.update({ status: newStatus }, { hooks: false });
          }
        }

        // 2. Maintenance Notifications
        if (room.changed('status') && room.status === 'under_maintenance') {
          logger.warn(`FACILITY_ALERT: Room ${room.roomNumber} taken offline for maintenance.`);
          // Trigger notification to Ward Incharge
        }
      }
    }
  });

  /**
   * Hospital Management - Room Associations
   * @param {Object} models - Loaded models
   */
  Room.associate = (models) => {
    Room.belongsTo(models.Ward, { foreignKey: 'wardId', as: 'ward' });
    Room.belongsTo(models.Nurse, { foreignKey: 'assignedNurseId', as: 'primaryNurse' });
    Room.hasMany(models.Bed, { foreignKey: 'roomId', as: 'beds' });
  };

  return Room;
};
