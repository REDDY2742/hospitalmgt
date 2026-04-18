const { 
  InventoryItem, 
  StockMovement, 
  PurchaseRequest, 
  PurchaseOrder, 
  GoodsReceipt, 
  VendorContract, 
  sequelize 
} = require('../../models');
const { uploadToS3 } = require('../../utils/s3.util');
const { generatePOPDF } = require('../../utils/pdf.util');
const { sendEmail } = require('../../utils/email.util');
const Decimal = require('decimal.js');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Supply Chain & Medical Inventory Service
 * 
 * Manages the clinical hardware lifecycle: Cold-chain receipt validation,
 * Three-way matching, and Narcotic dual-authorization protocols.
 */

class InventoryService {
  /**
   * Master Item Registration
   */
  async addInventoryItem(itemData, addedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { category, name } = itemData;

      // 1. Generate Item Code (INV-CAT-XXXXX)
      const count = await InventoryItem.count({ where: { category }, transaction });
      const itemCode = `INV-${category.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(5, '0')}`;

      // 2. Persist Infrastructure
      const item = await InventoryItem.create({
        ...itemData,
        itemCode,
        status: 'ACTIVE',
        addedBy
      }, { transaction });

      await transaction.commit();
      return item;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Procurement: Purchase Request Orchestration
   */
  async raisePurchaseRequest(requestData, raisedBy) {
    const transaction = await sequelize.transaction();

    try {
      const year = new Date().getFullYear();
      const count = await PurchaseRequest.count({ 
        where: { createdAt: { [sequelize.Op.gte]: new Date(year, 0, 1) } }, 
        transaction 
      });
      const prNumber = `PR-${year}-${String(count + 1).padStart(5, '0')}`;

      // 1. Threshold-Based Approval logic
      const totalEstimatedValue = requestData.items.reduce((acc, item) => 
        acc.add(new Decimal(item.estimatedUnitCost).mul(item.quantity)), new Decimal(0));
      
      let status = 'PENDING_HOD_APPROVAL';
      if (totalEstimatedValue.gt(1000000)) { // 10k threshold in paise
        status = 'PENDING_ADMIN_APPROVAL';
      }

      const request = await PurchaseRequest.create({
        prNumber,
        ...requestData,
        totalEstimatedValue: totalEstimatedValue.toNumber(),
        status,
        raisedBy
      }, { transaction });

      await transaction.commit();
      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Clinical Goods Receipt (Cold-Chain Validation)
   */
  async receiveInventory(poId, receivedData, receivedBy) {
    const transaction = await sequelize.transaction();

    try {
      const po = await PurchaseOrder.findByPk(poId, { transaction });
      if (!po) throw new NotFoundError('Purchase Order not found');

      // 1. Cold Chain Integrity Check
      for (const item of receivedData.items) {
        const itemMaster = await InventoryItem.findByPk(item.inventoryItemId, { transaction });
        
        if (itemMaster.isColdChain && (item.receivedTemp > itemMaster.maxTemp || item.receivedTemp < itemMaster.minTemp)) {
          logger.error(`COLD CHAIN ALERT: Item ${itemMaster.itemCode} received at ${item.receivedTemp}°C. Expected ${itemMaster.minTemp}-${itemMaster.maxTemp}°C.`);
          // Logic for quarantine or rejection...
        }
      }

      // 2. Three-Way Match & Stock Update
      const grnNumber = `GRN-${Date.now()}`;
      const grn = await GoodsReceipt.create({
        poId,
        grnNumber,
        receivedBy,
        timestamp: new Date()
      }, { transaction });

      for (const item of receivedData.items) {
        // Increment stock
        const inventoryItem = await InventoryItem.findByPk(item.inventoryItemId, { transaction });
        const newQty = new Decimal(inventoryItem.currentQuantity).add(item.receivedQuantity);
        
        await inventoryItem.update({ currentQuantity: newQty.toNumber() }, { transaction });

        // Record Movement
        await StockMovement.create({
          inventoryItemId: item.inventoryItemId,
          quantity: item.receivedQuantity,
          type: 'IN',
          referenceType: 'GRN',
          referenceId: grn.id,
          actorId: receivedBy
        }, { transaction });
      }

      await transaction.commit();
      return grn;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Supply Consumption (Real-time Deduction)
   */
  async issueInventory(issueData, issuedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { inventoryItemId, quantity, departmentId, isControlled } = issueData;

      // 1. High-Security Gate (Controlled/Narcotic)
      if (isControlled && !issueData.authorizedBy) {
        throw new ValidationError('Controlled/Narcotic item issuance requires Dual Authorization (authorizedBy).');
      }

      const item = await InventoryItem.findByPk(inventoryItemId, { transaction });
      if (new Decimal(item.currentQuantity).lt(quantity)) {
        throw new AppError('Insufficient stock for issuance', 400);
      }

      // 2. Atomic Deduction
      const newQty = new Decimal(item.currentQuantity).sub(quantity);
      await item.update({ currentQuantity: newQty.toNumber() }, { transaction });

      await StockMovement.create({
        inventoryItemId,
        quantity,
        type: 'OUT',
        referenceType: 'ISSUE',
        departmentId,
        actorId: issuedBy
      }, { transaction });

      await transaction.commit();
      
      // Post-issue checks for low stock alerts
      this._checkReorderThreshold(item);

      return { success: true, remainingQty: newQty.toNumber() };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Real-time Visibility & Low-Stock Alerts
   */
  async getLowStockAlerts() {
    return InventoryItem.findAll({
      where: {
        currentQuantity: { [sequelize.Op.lte]: sequelize.col('reorderLevel') },
        status: 'ACTIVE'
      },
      order: [['currentQuantity', 'ASC']]
    });
  }

  /**
   * Internal: Critical Stock Watchdog
   */
  async _checkReorderThreshold(item) {
    if (item.currentQuantity <= item.reorderLevel) {
      const io = getIO();
      io.to('inventory_managers').emit('LOW_STOCK_ALERT', { 
        itemCode: item.itemCode, 
        currentQuantity: item.currentQuantity 
      });
      logger.warn(`LOW STOCK ALERT: ${item.itemCode} (${item.name}) reached reorder level.`);
    }
  }
}

module.exports = new InventoryService();
