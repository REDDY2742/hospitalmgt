const { 
  Ward, 
  Bed, 
  BedAllocation, 
  BedHistory, 
  Admission, 
  Bill, 
  User,
  sequelize 
} = require('../../models');
const { redis } = require('../../config/redis');
const { getIO } = require('../../config/socket');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Ward & Bed Management Service
 * 
 * Manages the physical throughput of the hospital: Real-time bed state machine,
 * Occupational analytics, and Redis-locked allocation orchestration.
 */

class WardService {
  /**
   * Ward Initialization and Bed Infrastructure Creation
   */
  async createWard(wardData, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { name, wardType, totalBeds } = wardData;

      // 1. Generate Ward Code (e.g., ICU-01)
      const typeCode = wardType.substring(0, 3).toUpperCase();
      const count = await Ward.count({ where: { wardType }, transaction });
      const wardCode = `${typeCode}-${String(count + 1).padStart(2, '0')}`;

      // 2. Create Ward Record
      const ward = await Ward.create({
        ...wardData,
        wardCode,
        totalBeds,
        createdBy
      }, { transaction });

      // 3. Generate Bed Infrastructure
      const bedRecords = [];
      for (let i = 1; i <= totalBeds; i++) {
        bedRecords.push({
          wardId: ward.id,
          bedNumber: `${wardCode}-B${String(i).padStart(2, '0')}`,
          status: 'AVAILABLE'
        });
      }
      await Bed.bulkCreate(bedRecords, { transaction });

      await transaction.commit();
      return ward;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Real-time Discovery with Redis Acceleration
   */
  async getBedAvailability(wardId) {
    const cacheKey = `ward:availability:${wardId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const beds = await Bed.findAll({
      where: { wardId },
      include: [{
        model: BedAllocation,
        as: 'currentAllocation',
        where: { status: 'ACTIVE' },
        required: false,
        include: ['patient']
      }]
    });

    const stats = {
      total: beds.length,
      available: beds.filter(b => b.status === 'AVAILABLE').length,
      occupied: beds.filter(b => b.status === 'OCCUPIED').length,
      maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
      cleaning: beds.filter(b => b.status === 'CLEANING').length
    };

    const result = { beds, stats };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 30); // 30s TTL
    return result;
  }

  /**
   * Atomic Bed Allocation with Mutex Locking
   */
  async allocateBed(patientId, wardId, bedId, admissionId, allocatedBy) {
    // 1. Redis Distributed Lock (10s Mutex)
    const lockKey = `lock:bed:${bedId}`;
    const acquired = await redis.set(lockKey, 'LOCKED', 'NX', 'EX', 10);
    if (!acquired) throw new ConflictError('This bed is currently being allocated by another ward staff');

    const transaction = await sequelize.transaction();

    try {
      const bed = await Bed.findByPk(bedId, { transaction });
      const ward = await Ward.findByPk(wardId, { transaction });

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new ValidationError('Requested bed is not available for allocation');
      }

      // 2. Create Allocation Record
      const allocation = await BedAllocation.create({
        patientId,
        wardId,
        bedId,
        admissionId,
        allocatedBy,
        startTime: new Date(),
        status: 'ACTIVE'
      }, { transaction });

      // 3. Update State Machine
      await bed.update({ status: 'OCCUPIED' }, { transaction });

      // 4. Integrate Billing (Daily Charge Start)
      await Bill.create({
        patientId,
        admissionId,
        sourceModule: 'WARD',
        sourceId: bedId,
        description: `Room Charge: ${ward.name} (${bed.bedNumber})`,
        amount: ward.chargePerDay,
        status: 'DRAFT'
      }, { transaction });

      await transaction.commit();

      // 5. Global Real-time Sync
      const io = getIO();
      io.to(`ward_${wardId}`).emit('BED_STATUS_CHANGE', { bedId, status: 'OCCUPIED' });
      
      this._checkOccupancyAlert(wardId);

      return allocation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await redis.del(lockKey);
    }
  }

  /**
   * Patient Transfer (Atomic Exit & Entry)
   */
  async transferPatient(patientId, fromBedId, toBedId, reason, transferredBy) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate Target Bed
      const targetBed = await Bed.findByPk(toBedId, { transaction });
      if (!targetBed || targetBed.status !== 'AVAILABLE') {
        throw new ValidationError('Target bed is not available');
      }

      // 2. Close Old Allocation
      const oldAllocation = await BedAllocation.findOne({
        where: { patientId, bedId: fromBedId, status: 'ACTIVE' },
        transaction
      });
      if (oldAllocation) {
        await oldAllocation.update({ 
          status: 'TRANSFERRED', 
          endTime: new Date() 
        }, { transaction });
      }

      // 3. Release Old Bed to Cleaning
      await Bed.update({ status: 'CLEANING' }, { where: { id: fromBedId }, transaction });

      // 4. Create New Allocation
      await BedAllocation.create({
        patientId,
        wardId: targetBed.wardId,
        bedId: toBedId,
        admissionId: oldAllocation?.admissionId,
        allocatedBy: transferredBy,
        startTime: new Date(),
        status: 'ACTIVE'
      }, { transaction });

      // 5. Update Target Bed status
      await targetBed.update({ status: 'OCCUPIED' }, { transaction });

      await transaction.commit();

      // Housekeeping Trigger
      this._scheduleCleaning(fromBedId);

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Discharge Lifecycle: Cleaning & Restoration
   */
  async _scheduleCleaning(bedId) {
    logger.info(`Housekeeping triggered for bed ${bedId}`);
    
    // Automatic restoration after 2 hours (Simulated here with timeout, in prod use Bull job)
    setTimeout(async () => {
      try {
        const bed = await Bed.findByPk(bedId);
        if (bed && bed.status === 'CLEANING') {
          await bed.update({ status: 'AVAILABLE' });
          logger.info(`Bed ${bedId} restored to AVAILABLE after cleaning cycle`);
          
          const io = getIO();
          io.to(`ward_${bed.wardId}`).emit('BED_STATUS_CHANGE', { bedId, status: 'AVAILABLE' });
          await redis.del(`ward:availability:${bed.wardId}`);
        }
      } catch (err) {
        logger.error(`Cleaning restoration failed for bed ${bedId}: ${err.message}`);
      }
    }, 2 * 60 * 60 * 1000); // 2 Hours
  }

  /**
   * High-Occupancy Sentinel
   */
  async _checkOccupancyAlert(wardId) {
    const ward = await Ward.findByPk(wardId);
    const occupiedCount = await Bed.count({ where: { wardId, status: 'OCCUPIED' } });
    
    const rate = (occupiedCount / ward.totalBeds) * 100;
    if (rate >= 90) {
      logger.warn(`WARD CRITICAL: ${ward.name} has reached ${rate.toFixed(1)}% occupancy`);
      const io = getIO();
      io.to('hospital_admins').emit('WARD_CAPACITY_ALERT', { wardName: ward.name, rate });
    }
  }

  /**
   * Global Hospital Dashboard
   */
  async getHospitalOccupancyDashboard() {
    const wards = await Ward.findAll({
      include: [{ model: Bed, as: 'beds' }]
    });

    return wards.map(w => {
      const stats = {
        total: w.beds.length,
        occupied: w.beds.filter(b => b.status === 'OCCUPIED').length,
        cleaning: w.beds.filter(b => b.status === 'CLEANING').length,
        maintenance: w.beds.filter(b => b.status === 'MAINTENANCE').length,
        available: w.beds.filter(b => b.status === 'AVAILABLE').length
      };

      return {
        id: w.id,
        name: w.name,
        code: w.wardCode,
        type: w.wardType,
        stats,
        occupancyRate: ((stats.occupied / stats.total) * 100).toFixed(1)
      };
    });
  }
}

module.exports = new WardService();
