const { 
  BloodUnit, 
  Donor, 
  BloodRequest, 
  TransfusionLog, 
  AuditLog, 
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
 * Hematology & Blood Bank Systems Service
 * 
 * Manages the life-critical biological supply chain: Cold-chain tracking, 
 * ABO compatibility logic, and Platelet-shelf-life monitoring.
 */

class BloodBankService {
  /**
   * Blood Unit Intake & Expiry Calculation
   */
  async addBloodUnit(bloodUnitData, addedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { componentType, bloodGroup, collectionDate } = bloodUnitData;

      // 1. Component-Specific Expiry Logic
      const shelfLifeDays = {
        'whole_blood': 35,
        'RBC': 42,
        'platelets': 5,
        'FFP': 365,
        'cryoprecipitate': 365
      };

      const days = shelfLifeDays[componentType] || 35;
      const expiryDate = new Date(new Date(collectionDate).getTime() + days * 24 * 60 * 60 * 1000);

      // 2. Quarantine Logic (72h from collection)
      const availableFrom = new Date(new Date(collectionDate).getTime() + 72 * 60 * 60 * 1000);

      // 3. Register Unit
      const barcode = `BLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const unit = await BloodUnit.create({
        ...bloodUnitData,
        barcode,
        expiryDate,
        availableFrom,
        status: new Date() > availableFrom ? 'AVAILABLE' : 'QUARANTINE',
        addedBy
      }, { transaction });

      await transaction.commit();

      // Check stock levels for immediate alert
      this._checkCriticalStock(bloodGroup, componentType);

      return unit;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Compatibility-Aware Blood Request (ABO + Rh)
   */
  async requestBloodUnit(requestData, requestedBy) {
    const { bloodGroup, component, unitsRequired } = requestData;

    // 1. Compatibility Matrix Check
    const compatibleGroups = this._getCompatibleGroups(bloodGroup);

    const availableUnits = await BloodUnit.findAll({
      where: {
        bloodGroup: { [sequelize.Op.in]: compatibleGroups },
        componentType: component,
        status: 'AVAILABLE',
        expiryDate: { [sequelize.Op.gt]: new Date() }
      },
      order: [['expiryDate', 'ASC']], // FIFO
      limit: unitsRequired
    });

    if (availableUnits.length < unitsRequired) {
      this._triggerEmergencyDonorSearch(bloodGroup);
      throw new AppError(`Insufficient ${component} stock for group ${bloodGroup}. Total available compatible: ${availableUnits.length}`, 400);
    }

    const request = await BloodRequest.create({
      ...requestData,
      status: 'PENDING_CROSSMATCH',
      requestedBy
    });

    return { request, availableCompatibleUnits: availableUnits.length };
  }

  /**
   * Cold-Chain Return Policy (30-Minute Restrictive Window)
   */
  async returnBloodUnit(unitId, returnData, returnedBy) {
    const unit = await BloodUnit.findByPk(unitId);
    if (!unit || unit.status !== 'ISSUED') {
      throw new ValidationError('Unit is not currently issued');
    }

    // 1. Cold Chain Breakdown Check (30 min max)
    const issueLog = await TransfusionLog.findOne({ 
      where: { bloodUnitId: unitId, action: 'ISSUE' },
      order: [['createdAt', 'DESC']]
    });

    const diffMinutes = (new Date() - new Date(issueLog.createdAt)) / (1000 * 60);
    
    if (diffMinutes > 30) {
      await unit.update({ status: 'DISCARDED', remarks: 'Cold chain break - Time exceeded 30 mins' });
      throw new AppError('Unit rejected: Cold chain exceeded 30 minutes. Unit marked for discard.', 400);
    }

    await unit.update({ status: 'AVAILABLE' });
    return { success: true, message: 'Unit returned to available inventory' };
  }

  /**
   * Donor Eligibility & Deferral Algorithm
   */
  async registerDonor(donorData) {
    // 1. Basic Eligibility Gates
    if (donorData.age < 18 || donorData.age > 65) {
      throw new ValidationError('Donor must be between 18 and 65 years old');
    }
    if (donorData.weight < 45) {
      throw new ValidationError('Minimum weight for donation is 45kg');
    }

    // 2. Donation Gap Check (56 Days for Whole Blood)
    const lastDonation = await BloodUnit.findOne({
      where: { donorId: donorData.id },
      order: [['collectionDate', 'DESC']]
    });

    if (lastDonation) {
      const diffDays = (new Date() - new Date(lastDonation.collectionDate)) / (1000 * 60 * 60 * 24);
      if (diffDays < 56) {
        throw new AppError(`Donor in deferral period. Next eligible date: ${new Date(new Date(lastDonation.collectionDate).getTime() + 56 * 24 * 60 * 60 * 1000).toDateString()}`, 400);
      }
    }

    const donor = await Donor.create(donorData);
    return donor;
  }

  /**
   * Real-time Inventory Insights with Platelet Critical Alerts
   */
  async getBloodBankInventory() {
    const cacheKey = 'blood:inventory:summary';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const inventory = await BloodUnit.findAll({
      where: { status: 'AVAILABLE' },
      attributes: [
        'bloodGroup', 'componentType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['bloodGroup', 'componentType']
    });

    await redis.set(cacheKey, JSON.stringify(inventory), 'EX', 60); // 1-minute TTL
    return inventory;
  }

  /**
   * Internal: Critical Stock Alerter
   */
  async _checkCriticalStock(bloodGroup, component) {
    const count = await BloodUnit.count({
      where: { bloodGroup, componentType: component, status: 'AVAILABLE' }
    });

    if (count < 5) { // Minimum threshold
      const io = getIO();
      io.to('blood_bank_officers').emit('CRITICAL_BLOOD_STOCK', { 
        bloodGroup, 
        component, 
        count,
        level: 'LOW' 
      });
      logger.warn(`CRITICAL STOCK: ${bloodGroup} ${component} is low (${count} units left)`);
    }
  }

  /**
   * ABO + Rh Compatibility Logic Table
   */
  _getCompatibleGroups(targetGroup) {
    const matrix = {
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-']
    };
    return matrix[targetGroup] || ['O-']; // Fallback to O- (Universal donor)
  }

  /**
   * Emergency Donor Outreach
   */
  _triggerEmergencyDonorSearch(group) {
    const io = getIO();
    io.emit('EMERGENCY_DONOR_SEARCH', { bloodGroup: group });
    logger.error(`EMERGENCY: Immediate ${group} supply needed. Searching registry...`);
  }
}

module.exports = new BloodBankService();
