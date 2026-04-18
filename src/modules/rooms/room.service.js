const { Op, fn, col } = require('sequelize');
const { db } = require('../../config/db');
const Room = require('./room.model'); // Assumed path
const Bed = require('../wards/bed.model'); // Assumed relationship
const Ward = require('../wards/ward.model');
const AppError = require('../../utils/appError');
const { redis, lockResource, releaseLock } = require('../../config/redis');
const { cleaningQueue } = require('../../utils/scheduler.util');
const billingService = require('../billing/billing.service');
const wardService = require('../wards/ward.service');
const { io } = require('../../app'); // For Socket.io broadcasts

/**
 * Hospital Facilities & Room Management Service
 * 
 * Orchestrates clinical space allocation, real-time bed tracking, 
 * and automated housekeeping workflows across 13+ room archetypes.
 */

class RoomService {
  
  /**
   * --- Facility Governance ---
   */

  /**
   * @description Provisions a new clinical space with automated bed-record synchronization
   */
  async createRoom(roomData, createdBy) {
    const transaction = await db.transaction();
    try {
      const ward = await Ward.findByPk(roomData.wardId, { transaction });
      if (!ward) throw new AppError('InfrastructureError: Associated ward does not exist', 404);

      // 1. Regional Logic: Floor Range Check
      if (roomData.floor < ward.minFloor || roomData.floor > ward.maxFloor) {
        throw new AppError(`InfrastructureError: Floor ${roomData.floor} is outside Ward ${ward.name}'s range`, 400);
      }

      // 2. Sequential Code {WARD}-{FLOOR}-{NUM}
      const roomCode = `${ward.code}-${roomData.floor}-${roomData.roomNumber}`;

      const room = await Room.create({
        ...roomData,
        roomCode,
        occupancy: 0,
        isActive: true,
        createdBy: createdBy.id
      }, { transaction });

      // 3. Automated Asset Sync: Create beds for patient-facing rooms
      const patientRoomTypes = ['single_private', 'double_sharing', 'triple_sharing', 'general_ward', 'icu'];
      if (patientRoomTypes.includes(room.roomType)) {
        await wardService.synchronizeRoomBeds(room.id, room.capacity, transaction);
      }

      await transaction.commit();
      await redis.set(`hms:rooms:${room.id}`, JSON.stringify(room), 'EX', 1800);
      
      this._broadcastRoomChange();
      return room;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * @description Optimized lookup for vacant clinical spots with amenity filtering
   */
  async getRoomAvailability(filters) {
    const { wardId, roomType, amenities } = filters;
    
    const query = {
      where: {
        isAvailable: true,
        isActive: true,
        ...(wardId && { wardId }),
        ...(roomType && { roomType }),
        ...(amenities && { amenities: { [Op.contains]: amenities } })
      },
      include: [{
        model: Bed,
        as: 'beds',
        where: { status: 'AVAILABLE' },
        required: true
      }],
      order: [['roomNumber', 'ASC']]
    };

    return await Room.findAll(query);
  }

  /**
   * --- Clinical Operations ---
   */

  /**
   * @description Atomic patient-room anchoring with race-condition prevention (Redis Lock)
   */
  async allocateRoom(patientId, roomId, bedId, admissionId, allocatedBy) {
    const lockKey = `lock:room_allocation:${roomId}`;
    const acquired = await lockResource(lockKey, 10); // 10s Lock
    if (!acquired) throw new AppError('PersistenceError: Room is currently being modified by another request', 423);

    const transaction = await db.transaction();
    try {
      const room = await Room.findByPk(roomId, { transaction, lock: true });
      const bed = await Bed.findByPk(bedId, { transaction, lock: true });

      if (!room || room.occupancy >= room.capacity) throw new AppError('CapacityError: Target room is at maximum occupancy', 400);
      if (!bed || bed.status !== 'AVAILABLE') throw new AppError('InfrastuctureError: Specific bed is not available', 400);

      // 1. OT/ICU Equipment Check (Mock logic for required infrastructure)
      if (['icu', 'ot'].includes(room.roomType)) {
        // await equipmentService.verifyInfrastructure(roomId);
      }

      // 2. State Mutation
      room.occupancy += 1;
      bed.status = 'OCCUPIED';
      bed.currentPatientId = patientId;
      bed.admissionId = admissionId;

      await room.save({ transaction });
      await bed.save({ transaction });

      // 3. Billing Interconnect: Start daily recurring charge
      await billingService.initiateRoomCharge(patientId, admissionId, room.chargePerDay, room.id);

      await transaction.commit();
      
      // Real-time Nursing Alert
      io.to(`ward_${room.wardId}`).emit('BED_ALLOCATED', { roomId, bedId, patientId });
      
      return { success: true, message: 'Patient successfully anchored to clinical space' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await releaseLock(lockKey);
    }
  }

  /**
   * @description Post-clinical cleanup workflow with delayed availability logic (Bull)
   */
  async releaseRoom(roomId, bedId, releasedBy, reason) {
    const transaction = await db.transaction();
    try {
      const room = await Room.findByPk(roomId, { transaction });
      const bed = await Bed.findByPk(bedId, { transaction });

      room.occupancy = Math.max(0, room.occupancy - 1);
      bed.status = 'CLEANING';
      bed.currentPatientId = null;

      await room.save({ transaction });
      await bed.save({ transaction });

      // 1. Housekeeping Dispatch: Schedule clean-up duration (e.g., 45 mins)
      const cleaningDurationMs = 45 * 60 * 1000;
      await cleaningQueue.add({ roomId, bedId, action: 'MARK_AVAILABLE' }, { delay: cleaningDurationMs });

      await transaction.commit();
      
      io.to('housekeeping').emit('CLEANING_REQUIRED', { roomCode: room.roomCode, bedId });
      this._broadcastRoomChange();
      
      return { status: 'CLEANING', message: 'Bed sent to housekeeping queue. Auto-available scheduled.' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * --- Intelligence & Analytics ---
   */

  /**
   * @description Real-time census dashboard for hospital administrators
   */
  async getHospitalRoomDashboard() {
    const cacheKey = 'hms:dashboards:rooms';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stats = await Room.findAll({
      attributes: [
        'roomType',
        [fn('COUNT', col('id')), 'total_rooms'],
        [fn('SUM', col('occupancy')), 'total_occupied'],
        [fn('SUM', col('capacity')), 'total_capacity']
      ],
      group: ['roomType'],
      raw: true
    });

    const formatted = stats.map(s => ({
      type: s.roomType,
      occupancyRate: ((s.total_occupied / s.total_capacity) * 100).toFixed(2),
      availabilityCount: s.total_capacity - s.total_occupied
    }));

    await redis.set(cacheKey, JSON.stringify(formatted), 'EX', 300);
    return formatted;
  }

  /**
   * --- Internal Utilities ---
   */

  _broadcastRoomChange() {
    io.emit('HOSPITAL_CENSUS_UPDATED');
    redis.del('hms:dashboards:rooms');
  }
}

module.exports = new RoomService();
