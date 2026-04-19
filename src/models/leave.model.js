const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('leave-management-model');

/**
 * Hospital Management System - Workforce Leave Management Engine
 * 
 * Manages institutional leave policies, annual staff entitlement balances, 
 * multi-level approval workflows, and clinical coverage gaps.
 */
module.exports = (sequelize) => {
  // --- Leave Type Model ---
  class LeaveType extends Model {}
  LeaveType.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    leaveCode: { type: DataTypes.STRING(10), unique: true, field: 'leave_code' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    category: {
      type: DataTypes.ENUM('casual', 'sick', 'earned_privilege', 'maternity', 'paternity', 'bereavement', 'study', 'comp_off', 'special', 'sabbatical', 'quarantine', 'emergency', 'half_day'),
      defaultValue: 'casual'
    },
    daysPerYear: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'days_per_year' },
    carryForwardAllowed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'carry_forward_allowed' },
    documentRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'document_required' },
    isPaidLeave: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_paid_leave' },
    applicableGender: { type: DataTypes.ENUM('all', 'male', 'female'), defaultValue: 'all', field: 'applicable_gender' },
    applicableRoles: { type: DataTypes.JSON, defaultValue: ['*'], field: 'applicable_roles' },
    weekendsIncluded: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'weekends_included' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'LeaveType',
    tableName: 'leave_types',
    underscored: true,
    hooks: {
      beforeCreate: (lt) => {
        lt.leaveCode = `LT-${Math.random().toString(36).substring(7).toUpperCase()}`;
      }
    }
  });

  // --- Leave Balance Model ---
  class LeaveBalance extends Model {
    /** @type {number} Virtual: totalAvailable - used - pending - encashed */
    get available() {
      return (Number(this.openingBalance || 0) + Number(this.entitlement || 0) + Number(this.carryForward || 0)) 
             - (Number(this.used || 0) + Number(this.pending || 0));
    }
  }

  LeaveBalance.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
    leaveTypeId: { type: DataTypes.UUID, allowNull: false, field: 'leave_type_id' },
    year: { type: DataTypes.INTEGER, allowNull: false },
    openingBalance: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0, field: 'opening_balance' },
    entitlement: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
    carryForward: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0, field: 'carry_forward' },
    used: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
    pending: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
    encashed: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
    lapsed: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'LeaveBalance',
    tableName: 'leave_balances',
    underscored: true,
    paranoid: true,
    indexes: [{ unique: true, fields: ['staff_id', 'leave_type_id', 'year'] }],
    hooks: {
      beforeUpdate: (lb) => {
        if (lb.available < 0) {
          throw new Error('INSUFFICIENT_BALANCE: Action leads to negative leave balance.');
        }
      }
    }
  });

  // --- Leave Request Model ---
  class LeaveRequest extends Model {
    /**
     * @description Professional L1 level primary approval
     */
    async approveL1(approverId, notes) {
       return this.update({
         l1Status: 'approved',
         l1ApproverId: approverId,
         l1ApprovedAt: new Date(),
         l1Reason: notes,
         status: 'l1_approved'
       });
    }

    /**
     * @description Finalizes institutional leave approval and updates balances
     */
    async finalizeApproval(notes) {
       const transaction = await sequelize.transaction();
       try {
         await this.update({ status: 'approved' }, { transaction });
         
         const balance = await LeaveBalance.findByPk(this.leaveBalanceId);
         await balance.update({
            pending: Number(balance.pending) - Number(this.totalDays),
            used: Number(balance.used) + Number(this.totalDays)
         }, { transaction });

         await transaction.commit();
         logger.info(`LEAVE_FINALIZED: Request ${this.requestNumber} for Staff ${this.staffId} approved.`);
       } catch (err) {
         await transaction.rollback();
         throw err;
       }
    }
  }

  LeaveRequest.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    requestNumber: { type: DataTypes.STRING, unique: true, field: 'request_number' },
    staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
    leaveTypeId: { type: DataTypes.UUID, allowNull: false, field: 'leave_type_id' },
    leaveBalanceId: { type: DataTypes.UUID, field: 'leave_balance_id' },
    requestType: {
      type: DataTypes.ENUM('full_day', 'half_day_morning', 'half_day_afternoon', 'comp_off_availing'),
      defaultValue: 'full_day',
      field: 'request_type'
    },
    fromDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'from_date' },
    toDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'to_date' },
    totalDays: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: 'total_days' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'l1_approved', 'l2_approved', 'approved', 'rejected', 'cancelled', 'revoked', 'auto_approved'),
      defaultValue: 'pending_approval'
    },
    l1ApproverId: { type: DataTypes.UUID, field: 'l1_approver_id' },
    l1Status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending', field: 'l1_status' },
    coveringStaffId: { type: DataTypes.UUID, field: 'covering_staff_id' }
  }, {
    sequelize,
    modelName: 'LeaveRequest',
    tableName: 'leave_requests',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (lr) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        lr.requestNumber = `LR-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        // Logical Guard: Validate Balance availability
        if (lr.leaveBalanceId) {
           const lb = await LeaveBalance.findByPk(lr.leaveBalanceId);
           if (lb.available < lr.totalDays) throw new Error('BALANCE_EXCEEDED: Requested days exceed current available balance.');
        }
      },
      afterCreate: async (lr) => {
        // Hold the balance as pending
        if (lr.leaveBalanceId) {
           const lb = await LeaveBalance.findByPk(lr.leaveBalanceId);
           await lb.increment('pending', { by: lr.totalDays });
        }
      }
    }
  });

  // --- Associations ---
  LeaveType.associate = (models) => {
    LeaveType.hasMany(models.LeaveBalance, { foreignKey: 'leaveTypeId', as: 'balances' });
    LeaveType.hasMany(models.LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
  };

  LeaveBalance.associate = (models) => {
    LeaveBalance.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staff' });
    LeaveBalance.belongsTo(models.LeaveType, { foreignKey: 'leaveTypeId', as: 'policy' });
  };

  LeaveRequest.associate = (models) => {
    LeaveRequest.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'requester' });
    LeaveRequest.belongsTo(models.LeaveType, { foreignKey: 'leaveTypeId', as: 'type' });
    LeaveRequest.belongsTo(models.LeaveBalance, { foreignKey: 'leaveBalanceId', as: 'balanceSource' });
  });

  return { LeaveType, LeaveBalance, LeaveRequest };
};
