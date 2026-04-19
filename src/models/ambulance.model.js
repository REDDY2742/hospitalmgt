const { Model, DataTypes, Op } = require('sequelize');
const schedule = require('node-schedule');
const logger = require('../utils/logger.util').createChildLogger('ambulance-fleet-model');

/**
 * Hospital Management System - Ambulance Fleet & Dispatch Orchestration
 * 
 * Manages institutional mobility assets, real-time trauma response dispatch, 
 * pre-hospital clinical care, and tele-medical GPS tracking.
 */
module.exports = (sequelize) => {
  // --- Ambulance Model ---
  class Ambulance extends Model {
    /**
     * @description Professional dispatch orchestration logic
     */
    async dispatch(driverId, paramedicId, dispatchData) {
      if (!this.isActive || this.status !== 'available') {
        throw new Error(`Fleet Alert: Ambulance ${this.ambulanceCode} is currently ${this.status}.`);
      }

      const transaction = await sequelize.transaction();
      try {
        await this.update({
          status: 'dispatched',
          currentDriverId: driverId,
          currentParamedicId: paramedicId
        }, { transaction });

        const dispatch = await sequelize.models.AmbulanceDispatch.create({
          ambulanceId: this.id,
          driverId,
          paramedicId,
          ...dispatchData,
          status: 'assigned',
          assignedAt: new Date()
        }, { transaction });

        await transaction.commit();
        logger.info(`FLEET_DISPATCH: ${this.ambulanceCode} dispatched for request ${dispatch.dispatchNumber}`);
        return dispatch;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    /**
     * @description Location-aware telemetry update
     */
    async updateLocation(lat, lng, speed, address) {
      return this.update({
        currentLocation: { lat, lng, speed, address, timestamp: new Date() }
      });
    }

    // --- Class Methods ---
    static async getNearestAmbulance(lat, lng) {
      const available = await this.findAll({ where: { status: 'available', isActive: true } });
      // Simplified: Just returning the first available for now
      return available[0] || null;
    }
  }

  Ambulance.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ambulanceCode: { type: DataTypes.STRING, unique: true, field: 'ambulance_code' },
    vehicleNumber: { type: DataTypes.STRING(20), unique: true, allowNull: false, field: 'vehicle_number' },
    vehicleType: {
      type: DataTypes.ENUM('basic_life_support', 'advanced_life_support', 'patient_transport', 'neonatal_ambulance', 'mobile_icu', 'air_ambulance'),
      allowNull: false,
      field: 'vehicle_type'
    },
    registrationNumber: { type: DataTypes.STRING(50), field: 'registration_number' },
    registrationExpiry: { type: DataTypes.DATEONLY, field: 'registration_expiry' },
    status: {
      type: DataTypes.ENUM('available', 'dispatched', 'on_route_to_pickup', 'at_pickup_location', 'patient_onboard', 'returning', 'at_hospital', 'under_maintenance', 'out_of_service', 'reserved'),
      defaultValue: 'available'
    },
    currentDriverId: { type: DataTypes.UUID, field: 'current_driver_id' },
    currentParamedicId: { type: DataTypes.UUID, field: 'current_paramedic_id' },
    currentLocation: { type: DataTypes.JSON, field: 'current_location', defaultValue: {} },
    gpsDeviceId: { type: DataTypes.STRING(50), field: 'gps_device_id' },
    isGPSActive: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_gps_active' },
    hasVentilator: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_ventilator' },
    hasMonitor: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_monitor' },
    totalTripsCompleted: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_trips_completed' },
    totalPatientTransported: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_patient_transported' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'Ambulance',
    tableName: 'ambulances',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (amb) => {
        const count = await Ambulance.count();
        amb.ambulanceCode = `AMB-${(count + 1).toString().padStart(3, '0')}`;
      },
      afterUpdate: (amb) => {
        if (amb.changed('status')) {
           try {
             const { getIO } = require('../config/socket');
             getIO().of('/ambulance').emit('ambulance:statusChanged', { code: amb.ambulanceCode, status: amb.status });
           } catch (e) {}
        }
      }
    }
  });

  // --- Ambulance Dispatch Model ---
  class AmbulanceDispatch extends Model {}
  AmbulanceDispatch.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    dispatchNumber: { type: DataTypes.STRING, unique: true, field: 'dispatch_number' },
    ambulanceId: { type: DataTypes.UUID, allowNull: false, field: 'ambulance_id' },
    emergencyId: { type: DataTypes.UUID, field: 'emergency_id' },
    patientId: { type: DataTypes.UUID, field: 'patient_id' },
    requestedByName: { type: DataTypes.STRING(100), field: 'requested_by_name' },
    requestedByPhone: { type: DataTypes.STRING(20), field: 'requested_by_phone' },
    requestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'requested_at' },
    requestType: {
      type: DataTypes.ENUM('emergency_response', 'scheduled_patient_transfer', 'opd_pickup', 'discharge_drop', 'inter_facility_transfer', 'body_transfer', 'event_coverage', 'private_hire'),
      defaultValue: 'emergency_response',
      field: 'request_type'
    },
    pickupAddress: { type: DataTypes.TEXT, field: 'pickup_address' },
    pickupLat: { type: DataTypes.DECIMAL(10, 8), field: 'pickup_lat' },
    pickupLng: { type: DataTypes.DECIMAL(11, 8), field: 'pickup_lng' },
    destinationAddress: { type: DataTypes.TEXT, field: 'destination_address' },
    priority: {
      type: DataTypes.ENUM('p1_life_threatening', 'p2_emergency', 'p3_urgent', 'p4_routine'),
      defaultValue: 'p2_emergency'
    },
    status: {
      type: DataTypes.ENUM('requested', 'assigned', 'driver_notified', 'accepted_by_driver', 'en_route_to_pickup', 'arrived_at_pickup', 'patient_loaded', 'en_route_to_destination', 'arrived_at_destination', 'patient_handed_over', 'completed', 'cancelled', 'no_show'),
      defaultValue: 'requested'
    },
    driverId: { type: DataTypes.UUID, field: 'driver_id' },
    paramedicId: { type: DataTypes.UUID, field: 'paramedic_id' },
    // --- Intra-Dispatch Analytics ---
    actualDistanceKm: { type: DataTypes.FLOAT, field: 'actual_distance_km' },
    actualDurationMinutes: { type: DataTypes.INTEGER, field: 'actual_duration_minutes' },
    patientConditionOnPickup: { type: DataTypes.TEXT, field: 'patient_condition_on_pickup' },
    /** @type {Object} Pre-hospital clinical readings recorded en-route */
    vitalsOnPickup: { type: DataTypes.JSON, field: 'vitals_on_pickup', defaultValue: {} },
    vitalsEnRoute: { type: DataTypes.JSON, field: 'vitals_en_route', defaultValue: [] },
    medicationsGivenEnRoute: { type: DataTypes.JSON, field: 'medications_given_en_route', defaultValue: [] },
    // --- Commercial ---
    totalFare: { type: DataTypes.DECIMAL(10, 2), field: 'total_fare' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'waived', 'billed_to_admission'), defaultValue: 'pending', field: 'payment_status' },
    billId: { type: DataTypes.UUID, field: 'bill_id' },
    completedAt: { type: DataTypes.DATE, field: 'completed_at' }
  }, {
    sequelize,
    modelName: 'AmbulanceDispatch',
    tableName: 'ambulance_dispatches',
    underscored: true,
    hooks: {
      beforeCreate: async (disp) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await AmbulanceDispatch.count();
        disp.dispatchNumber = `DISP-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      },
      afterUpdate: async (disp) => {
        if (disp.changed('status') && disp.status === 'completed') {
           // Release ambulance back to available
           if (sequelize.models.Ambulance) {
              await sequelize.models.Ambulance.update({
                 status: 'available',
                 currentDriverId: null,
                 currentParamedicId: null
              }, { where: { id: disp.ambulanceId } });
              await sequelize.models.Ambulance.increment('totalTripsCompleted', { where: { id: disp.ambulanceId } });
           }
        }
      }
    }
  });

  /**
   * Ambulance Associations
   */
  Ambulance.associate = (models) => {
    Ambulance.hasMany(models.AmbulanceDispatch, { foreignKey: 'ambulanceId', as: 'dispatches' });
    Ambulance.belongsTo(models.Staff, { foreignKey: 'currentDriverId', as: 'driver' });
    Ambulance.belongsTo(models.Staff, { foreignKey: 'currentParamedicId', as: 'paramedic' });
  };

  AmbulanceDispatch.associate = (models) => {
    AmbulanceDispatch.belongsTo(models.Ambulance, { foreignKey: 'ambulanceId', as: 'ambulance' });
    AmbulanceDispatch.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    AmbulanceDispatch.belongsTo(models.Emergency, { foreignKey: 'emergencyId', as: 'emergencyCase' });
    AmbulanceDispatch.belongsTo(models.Staff, { foreignKey: 'driverId', as: 'assignedDriver' });
    AmbulanceDispatch.belongsTo(models.Billing, { foreignKey: 'billId', as: 'bill' });
  };

  return { Ambulance, AmbulanceDispatch };
};
