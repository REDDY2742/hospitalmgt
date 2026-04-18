const { 
  Medicine, 
  Batch, 
  Prescription, 
  Dispensing, 
  PurchaseOrder, 
  Bill, 
  Interaction, 
  AuditLog, 
  User,
  sequelize 
} = require('../../models');
const { redis } = require('../../config/redis');
const { uploadToS3 } = require('../../utils/s3.util');
const { sendStockAlert, sendPrescriptionReady } = require('../../utils/email.util');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Pharmacy & Inventory Management Service
 * 
 * Handles the complete medication lifecycle: Stock-in, Automated 
 * Interaction Checks, FIFO dispensing, and Expiry Analytics.
 */

class PharmacyService {
  /**
   * Add New Medicine to Global Inventory
   */
  async addMedicine(medicineData, addedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { name, category, genericName } = medicineData;

      // 1. Generic Duplication Check
      const existing = await Medicine.findOne({ where: { genericName, isDeleted: false }, transaction });
      if (existing) {
        logger.warn(`Duplicate Generic Alert: ${genericName} already exists as ${existing.name}`);
      }

      // 2. Generate SKU (MED-CAT-XXXXX)
      const catCode = category.substring(0, 3).toUpperCase();
      const count = await Medicine.count({ where: { category }, transaction });
      const sku = `MED-${catCode}-${String(count + 1).padStart(5, '0')}`;

      // 3. Handle Media
      let imageUrl = null;
      if (medicineData.image) {
        const key = `medicines/${sku}-${Date.now()}.jpg`;
        imageUrl = await uploadToS3(medicineData.image, key, 'PHARMACY_IMAGES');
      }

      // 4. Create Record
      const medicine = await Medicine.create({
        ...medicineData,
        sku,
        imageUrl,
        addedBy
      }, { transaction });

      // 5. Initial Batch if provided
      if (medicineData.initialBatch) {
        await Batch.create({
          ...medicineData.initialBatch,
          medicineId: medicine.id,
          currentQuantity: medicineData.initialBatch.quantity
        }, { transaction });
      }

      await AuditLog.create({
        userId: addedBy,
        action: 'CREATE',
        module: 'pharmacy',
        resourceId: medicine.id,
        newValue: { sku, name }
      }, { transaction });

      await transaction.commit();
      return medicine;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Dispense Prescription with FIFO and Race Condition Guard
   */
  async dispensePrescription(prescriptionId, dispensedBy) {
    // 1. Redis Lock to prevent concurrent stock deduction for this prescription
    const lockKey = `lock:dispense:${prescriptionId}`;
    const acquired = await redis.set(lockKey, 'LOCKED', 'NX', 'EX', 60);
    if (!acquired) throw new ConflictError('This prescription is currently being processed by another counter');

    const transaction = await sequelize.transaction();

    try {
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: ['items', 'patient', 'doctor'],
        transaction
      });

      if (!prescription || prescription.status === 'DISPENSED') {
        throw new ValidationError('Prescription is invalid or already dispensed');
      }

      // 2. Clinical Interaction Check
      const items = prescription.items;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const interaction = await Interaction.findOne({
            where: {
              [sequelize.Op.or]: [
                { medA: items[i].medicineId, medB: items[j].medicineId },
                { medA: items[j].medicineId, medB: items[i].medicineId }
              ]
            },
            transaction
          });
          if (interaction && interaction.severity === 'HIGH') {
            throw new AppError(`Critical Interaction detected: ${items[i].name} and ${items[j].name}`, 400);
          }
        }
      }

      const dispensedBatches = [];

      // 3. FIFO Stock Deduction
      for (const item of items) {
        let remainingToDeduct = item.quantity;

        const batches = await Batch.findAll({
          where: { medicineId: item.medicineId, currentQuantity: { [sequelize.Op.gt]: 0 } },
          order: [['expiryDate', 'ASC']], // FIFO Logic (Oldest expiry first)
          transaction
        });

        const totalAvailable = batches.reduce((acc, b) => acc + b.currentQuantity, 0);
        if (totalAvailable < item.quantity) {
          throw new AppError(`Insufficient stock for ${item.name}`, 400);
        }

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const deduct = Math.min(batch.currentQuantity, remainingToDeduct);
          await batch.decrement('currentQuantity', { by: deduct, transaction });
          
          dispensedBatches.push({
            batchId: batch.id,
            medicineId: item.medicineId,
            quantity: deduct,
            price: batch.sellingPrice
          });

          remainingToDeduct -= deduct;
        }
      }

      // 4. Create Dispensing Record
      const dispensing = await Dispensing.create({
        prescriptionId,
        dispensedBy,
        totalAmount: dispensedBatches.reduce((acc, b) => acc + (b.price * b.quantity), 0),
        details: dispensedBatches
      }, { transaction });

      await prescription.update({ status: 'DISPENSED' }, { transaction });

      // 5. Generate Bill
      await Bill.create({
        patientId: prescription.patientId,
        sourceModule: 'PHARMACY',
        sourceId: dispensing.id,
        amount: dispensing.totalAmount,
        status: 'UNPAID'
      }, { transaction });

      await transaction.commit();

      // Notifications
      sendPrescriptionReady(prescription.patient.email, { prescriptionId });

      return dispensing;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await redis.del(lockKey);
    }
  }

  /**
   * Analytics: Expiry Risk Assessment
   */
  async checkExpiringMedicines(daysAhead = 90) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const expiringBatches = await Batch.findAll({
      where: {
        expiryDate: { [sequelize.Op.between]: [today, futureDate] },
        currentQuantity: { [sequelize.Op.gt]: 0 }
      },
      include: ['medicine'],
      order: [['expiryDate', 'ASC']]
    });

    const report = {
      within_30_days: [],
      within_60_days: [],
      within_90_days: [],
      totalValueAtRisk: 0
    };

    expiringBatches.forEach(batch => {
      const diffDays = Math.ceil((new Date(batch.expiryDate) - today) / (1000 * 60 * 60 * 24));
      const value = batch.currentQuantity * batch.purchasePrice;
      report.totalValueAtRisk += value;

      const item = { 
        name: batch.medicine.name, 
        batch: batch.batchNumber, 
        qty: batch.currentQuantity, 
        expiry: batch.expiryDate 
      };

      if (diffDays <= 30) report.within_30_days.push(item);
      else if (diffDays <= 60) report.within_60_days.push(item);
      else report.within_90_days.push(item);
    });

    if (report.within_30_days.length > 0) {
      sendStockAlert('pharmacy_manager@hospital.com', 'CRITICAL: Medicine Expiry Alert', report);
    }

    return report;
  }

  /**
   * Analytics: Low Stock Watchdog
   */
  async checkLowStockMedicines() {
    const lowStock = await Medicine.findAll({
      where: {
        currentStock: { [sequelize.Op.lte]: sequelize.col('reorderLevel') },
        isDeleted: false
      },
      order: [['currentStock', 'ASC']]
    });

    return lowStock.map(med => ({
      name: med.name,
      sku: med.sku,
      current: med.currentStock,
      reorderAt: med.reorderLevel,
      shortage: med.reorderLevel - med.currentStock
    }));
  }

  /**
   * Search and Discovery with Redis Aggregation
   */
  async searchMedicine(query, filters) {
    const cacheKey = `search:pharmacy:${query}:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = {
      isDeleted: false,
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.like]: `%${query}%` } },
        { genericName: { [sequelize.Op.like]: `%${query}%` } },
        { sku: { [sequelize.Op.like]: `%${query}%` } }
      ]
    };

    if (filters.category) where.category = filters.category;
    if (filters.inStock === 'true') where.currentStock = { [sequelize.Op.gt]: 0 };

    const results = await Medicine.findAll({
      where,
      limit: 20,
      include: [{ model: Batch, as: 'batches', where: { currentQuantity: { [sequelize.Op.gt]: 0 } }, limit: 1 }]
    });

    await redis.set(cacheKey, JSON.stringify(results), 'EX', 600); // 10 min cache
    return results;
  }

  /**
   * Pharmacy Performance Dashboard Stats
   */
  async getPharmacyDashboardStats() {
    const stats = await sequelize.query(`
      SELECT 
        (SELECT SUM(currentQuantity * purchasePrice) FROM Batches WHERE currentQuantity > 0) as inventoryValue,
        (SELECT COUNT(*) FROM Medicines WHERE currentStock <= reorderLevel AND isDeleted = 0) as lowStockCount,
        (SELECT COUNT(*) FROM Batches WHERE expiryDate <= DATE_ADD(NOW(), INTERVAL 90 DAY) AND currentQuantity > 0) as expiringSoonCount,
        (SELECT COUNT(*) FROM Dispensings WHERE CAST(createdAt AS DATE) = CURDATE()) as todayDispensingCount,
        (SELECT SUM(totalAmount) FROM Dispensings WHERE CAST(createdAt AS DATE) = CURDATE()) as todayRevenue
    `, { type: sequelize.QueryTypes.SELECT });

    return stats[0];
  }
}

module.exports = new PharmacyService();
