const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('supplier-procurement-model');

/**
 * Hospital Management System - Supply Chain & Procurement Model
 * 
 * Manages institutional vendors, the master Purchase Order (PO) ledger, 
 * and granular item-level procurement tracking with automated stock rollups.
 */
module.exports = (sequelize) => {
  // --- Supplier Model ---
  class Supplier extends Model {
    /**
     * @description Approves a vendor for institutional procurement
     */
    async approve(approvedBy, approvalDoc) {
      return this.update({
        isApproved: true,
        approvedBy,
        approvalDoc,
        approvedAt: new Date()
      });
    }

    /**
     * @description Immediately restricts vendor for quality/conduct issues
     */
    async blacklist(reason, blacklistedBy, doc) {
      const transaction = await sequelize.transaction();
      try {
        await this.update({
          isBlacklisted: true,
          blacklistReason: reason,
          blacklistedBy,
          blacklistDoc: doc,
          blacklistedAt: new Date(),
          isActive: false
        }, { transaction });

        // Logic for cancelling pending POs
        if (sequelize.models.PurchaseOrder) {
          await sequelize.models.PurchaseOrder.update(
            { status: 'cancelled', cancellationReason: 'Supplier Blacklisted' },
            { where: { supplierId: this.id, status: { [Op.in]: ['pending_approval', 'draft'] } }, transaction }
          );
        }
        
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
  }

  Supplier.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Sequential Vendor ID (SUP-XXXXX) */
    supplierCode: { type: DataTypes.STRING, unique: true, field: 'supplier_code' },
    companyName: { type: DataTypes.STRING(255), allowNull: false, field: 'company_name' },
    tradeName: { type: DataTypes.STRING(255), field: 'trade_name' },
    supplierType: {
      type: DataTypes.ENUM('medicine', 'equipment', 'surgical_supplies', 'consumables', 'linen', 'laboratory', 'food', 'it_services', 'maintenance', 'housekeeping', 'multi_category'),
      allowNull: false,
      field: 'supplier_type'
    },
    gstNumber: { type: DataTypes.STRING(20), unique: true, field: 'gst_number' },
    panNumber: { type: DataTypes.STRING(20), field: 'pan_number' },
    drugLicenseNumber: { type: DataTypes.STRING(100), field: 'drug_license_number' },
    address: { type: DataTypes.JSON, defaultValue: {}, field: 'address' },
    contactPersonName: { type: DataTypes.STRING(100), field: 'contact_person_name' },
    contactPersonPhone: { type: DataTypes.STRING(20), field: 'contact_person_phone' },
    email: { type: DataTypes.STRING(100) },
    paymentTerms: {
      type: DataTypes.ENUM('immediate', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'advance', 'cod'),
      defaultValue: 'net_30',
      field: 'payment_terms'
    },
    creditLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'credit_limit' },
    currentOutstanding: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'current_outstanding' },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    isApproved: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_approved' },
    approvedBy: { type: DataTypes.UUID, field: 'approved_by' },
    approvedAt: { type: DataTypes.DATE, field: 'approved_at' },
    isBlacklisted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_blacklisted' },
    contractEndDate: { type: DataTypes.DATEONLY, field: 'contract_end_date' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'Supplier',
    tableName: 'suppliers',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (sup) => {
        const count = await Supplier.count();
        sup.supplierCode = `SUP-${(count + 1).toString().padStart(5, '0')}`;
      }
    }
  });

  // --- Purchase Order Model ---
  class PurchaseOrder extends Model {
    /**
     * @description Finalizes the Goods Receipt and updates stock globally
     */
    async receiveGoods(grnData, receivedBy) {
       // Logic handles GRN generation and stock rollup via Items
       return this.update({
         ...grnData,
         status: 'fully_received',
         actualDeliveryDate: new Date(),
         receivedBy
       });
    }
  }

  PurchaseOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Sequential PO ID (PO-YYYYMMDD-XXXXX) */
    poNumber: { type: DataTypes.STRING, unique: true, field: 'po_number' },
    supplierId: { type: DataTypes.UUID, allowNull: false, field: 'supplier_id' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    poType: {
      type: DataTypes.ENUM('medicine', 'equipment', 'consumables', 'emergency_procurement', 'rate_contract', 'repeat_order', 'return_order'),
      defaultValue: 'medicine',
      field: 'po_type'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'l1_approved', 'l2_approved', 'approved', 'sent_to_supplier', 'acknowledged', 'partially_received', 'fully_received', 'invoiced', 'partially_paid', 'fully_paid', 'cancelled', 'closed', 'disputed', 'on_hold'),
      defaultValue: 'draft'
    },
    priority: { type: DataTypes.ENUM('routine', 'urgent', 'emergency'), defaultValue: 'routine' },
    poDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW, field: 'po_date' },
    expectedDeliveryDate: { type: DataTypes.DATEONLY, field: 'expected_delivery_date' },
    actualDeliveryDate: { type: DataTypes.DATE, field: 'actual_delivery_date' },
    // --- Financial Layout ---
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'discount_amount' },
    totalTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_tax' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_amount' },
    // --- Logistics ---
    grnNumber: { type: DataTypes.STRING(50), field: 'grn_number', comment: 'Goods Receipt Note' },
    receivedBy: { type: DataTypes.UUID, field: 'received_by' },
    qualityCheckStatus: {
      type: DataTypes.ENUM('pending', 'in_progress', 'passed', 'failed', 'partial'),
      defaultValue: 'pending',
      field: 'quality_check_status'
    }
  }, {
    sequelize,
    modelName: 'PurchaseOrder',
    tableName: 'purchase_orders',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (po) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await PurchaseOrder.count();
        po.poNumber = `PO-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
      }
    }
  });

  // --- Purchase Order Item Model ---
  class PurchaseOrderItem extends Model {}
  PurchaseOrderItem.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    poId: { type: DataTypes.UUID, allowNull: false, field: 'po_id' },
    itemType: { type: DataTypes.ENUM('medicine', 'equipment', 'consumable', 'other'), field: 'item_type' },
    medicineId: { type: DataTypes.UUID, field: 'medicine_id' },
    inventoryId: { type: DataTypes.UUID, field: 'inventory_id' },
    itemName: { type: DataTypes.STRING, field: 'item_name' },
    quantityOrdered: { type: DataTypes.INTEGER, allowNull: false, field: 'quantity_ordered' },
    quantityReceived: { type: DataTypes.INTEGER, defaultValue: 0, field: 'quantity_received' },
    unitPurchasePrice: { type: DataTypes.DECIMAL(10, 2), field: 'unit_purchase_price' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), field: 'total_amount' },
    batchNumber: { type: DataTypes.STRING(50), field: 'batch_number' },
    expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date' },
    isReceived: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_received' }
  }, {
    sequelize,
    modelName: 'PurchaseOrderItem',
    tableName: 'purchase_order_items',
    underscored: true,
    paranoid: true,
    hooks: {
      afterUpdate: async (item) => {
        // Clinical Stock Propagation
        if (item.changed('quantityReceived') && item.quantityReceived > 0) {
           if (item.medicineId && sequelize.models.Pharmacy) {
             // Create/Update MedicineBatch in Pharmacy
             await sequelize.models.Pharmacy.create({
               medicineId: item.medicineId,
               batchNumber: item.batchNumber,
               quantityReceived: item.quantityReceived,
               expiryDate: item.expiryDate,
               purchaseOrderId: item.poId
             });
           } else if (item.inventoryId && sequelize.models.Inventory) {
              // Update general hospital currentStock
              await sequelize.models.Inventory.increment('currentStock', { 
                by: item.quantityReceived, 
                where: { id: item.inventoryId } 
              });
           }

           // Update Supplier Outstanding
           const po = await sequelize.models.PurchaseOrder.findByPk(item.poId);
           if (po && sequelize.models.Supplier) {
              await sequelize.models.Supplier.increment('currentOutstanding', {
                by: item.totalAmount,
                where: { id: po.supplierId }
              });
           }
        }
      }
    }
  });

  // --- Associations ---
  Supplier.associate = (models) => {
    Supplier.hasMany(models.PurchaseOrder, { foreignKey: 'supplierId', as: 'orders' });
  };

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'vendor' });
    PurchaseOrder.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'requestingDept' });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, { foreignKey: 'poId', as: 'items' });
  };

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, { foreignKey: 'poId', as: 'order' });
    PurchaseOrderItem.belongsTo(models.Medicine, { foreignKey: 'medicineId', as: 'medicineDetails' });
    PurchaseOrderItem.belongsTo(models.Inventory, { foreignKey: 'inventoryId', as: 'assetDetails' });
  };

  return { Supplier, PurchaseOrder, PurchaseOrderItem };
};
