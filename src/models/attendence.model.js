const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('attendance-workforce-model');

/**
 * Hospital Management System - Workforce & Attendance Engine
 * 
 * Manages institutional rostering, shift orchestration, and clinical attendance tracking.
 * Includes support for biometric check-ins, nursing swaps, and holiday overtime logic.
 */
module.exports = (sequelize) => {
  // --- Shift Model ---
  class Shift extends Model {
    /**
     * @description Professional overtime pay calculation for HR payroll
     */
    calculateOvertimePay(actualHours, baseSalaryPerHour) {
       const otHours = Math.max(0, actualHours - this.durationHours);
       return otHours * (baseSalaryPerHour * (this.overtimeRateMultiplier || 1.5));
    }
  }

  Shift.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    shiftCode: { type: DataTypes.STRING(20), unique: true, field: 'shift_code' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    shiftType: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night', 'split', 'rotating', 'on_call', 'flexible'),
      defaultValue: 'morning',
      field: 'shift_type'
    },
    startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.TIME, allowNull: false, field: 'end_time' },
    durationHours: { type: DataTypes.DECIMAL(4, 2), field: 'duration_hours' },
    crossesMidnight: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'crosses_midnight' },
    graceTimeMinutes: { type: DataTypes.INTEGER, defaultValue: 15, field: 'grace_time_minutes' },
    overtimeRateMultiplier: { type: DataTypes.DECIMAL(3, 2), defaultValue: 1.5, field: 'overtime_rate_multiplier' },
    weekdays: { type: DataTypes.JSON, defaultValue: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
  }, {
    sequelize,
    modelName: 'Shift',
    tableName: 'shifts',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (shift) => {
        const count = 0; // Simulated count for code generation
        shift.shiftCode = `SHF-${Math.random().toString(36).substring(7).toUpperCase()}`;
      }
    }
  });

  // --- Shift Assignment Model ---
  class ShiftAssignment extends Model {
    /**
     * @description Professional shift swap execution
     */
    async approveSwap(targetAssignmentId, approvedBy) {
       const transaction = await sequelize.transaction();
       try {
         const target = await ShiftAssignment.findByPk(targetAssignmentId);
         const currentStaffId = this.staffId;
         const targetStaffId = target.staffId;

         await this.update({ staffId: targetStaffId, isSwapped: true, swapApprovedBy: approvedBy }, { transaction });
         await target.update({ staffId: currentStaffId, isSwapped: true, swapApprovedBy: approvedBy }, { transaction });

         await transaction.commit();
         logger.info(`SHIFT_SWAP: Assignment ${this.assignmentNumber} swapped with ${target.assignmentNumber}`);
       } catch (err) {
         await transaction.rollback();
         throw err;
       }
    }
  }

  ShiftAssignment.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    assignmentNumber: { type: DataTypes.STRING, unique: true, field: 'assignment_number' },
    staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
    nurseId: { type: DataTypes.UUID, field: 'nurse_id' },
    doctorId: { type: DataTypes.UUID, field: 'doctor_id' },
    shiftId: { type: DataTypes.UUID, allowNull: false, field: 'shift_id' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    assignedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'assigned_date' },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'on_duty', 'completed', 'absent', 'swapped', 'cancelled', 'on_leave'),
      defaultValue: 'scheduled'
    },
    isSwapped: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_swapped' },
    isOnCall: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_on_call' },
    assignedBy: { type: DataTypes.UUID, field: 'assigned_by' }
  }, {
    sequelize,
    modelName: 'ShiftAssignment',
    tableName: 'shift_assignments',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (sa) => {
        const dateStr = sa.assignedDate.toString().replace(/-/g, '');
        sa.assignmentNumber = `SA-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        // Logical Conflict Check
        const conflict = await ShiftAssignment.findOne({ where: { staffId: sa.staffId, assignedDate: sa.assignedDate } });
        if (conflict) throw new Error('STAFF_OVERLAP: Staff member already assigned to a shift on this date.');
      }
    }
  });

  // --- Attendance Model ---
  class Attendance extends Model {
    /**
     * @description Professional biometric check-in orchestration
     */
    async checkIn(method, location, photo) {
      const now = new Date();
      return this.update({
        checkInTime: now,
        checkInMethod: method,
        checkInLocation: location,
        checkInPhoto: photo
      });
    }

    /**
     * @description Finalizes daily attendance and calculates payable hours
     */
    async checkOut(method) {
      const checkOut = new Date();
      const checkIn = this.checkInTime;
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      
      return this.update({
        checkOutTime: checkOut,
        checkOutMethod: method,
        totalWorkingMinutes: Math.round(hours * 60)
      });
    }
  }

  Attendance.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    attendanceId: { type: DataTypes.STRING, unique: true, field: 'attendance_id' },
    staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
    shiftAssignmentId: { type: DataTypes.UUID, field: 'shift_assignment_id' },
    shiftId: { type: DataTypes.UUID, field: 'shift_id' },
    departmentId: { type: DataTypes.UUID, field: 'department_id' },
    attendanceDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW, field: 'attendance_date' },
    // --- Clock Logic ---
    checkInTime: { type: DataTypes.DATE, field: 'check_in_time' },
    checkInMethod: { type: DataTypes.ENUM('biometric', 'rfid_card', 'face_recognition', 'manual', 'mobile_app', 'qr_code'), field: 'check_in_method' },
    checkInLocation: { type: DataTypes.JSON, field: 'check_in_location' },
    checkInPhoto: { type: DataTypes.STRING, field: 'check_in_photo' },
    checkOutTime: { type: DataTypes.DATE, field: 'check_out_time' },
    checkOutMethod: { type: DataTypes.ENUM('biometric', 'rfid_card', 'face_recognition', 'manual', 'mobile_app', 'qr_code'), field: 'check_out_method' },
    totalWorkingMinutes: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_working_minutes' },
    // --- HR Status ---
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend_off', 'on_call'),
      defaultValue: 'present'
    },
    isLate: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_late' },
    hasOvertime: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'has_overtime' },
    isRegularized: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_regularized' }
  }, {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendances',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (att) => {
        const dateStr = att.attendanceDate.toString().replace(/-/g, '');
        att.attendanceId = `ATT-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      }
    }
  });

  // --- Associations ---
  Shift.associate = (models) => {
    Shift.hasMany(models.ShiftAssignment, { foreignKey: 'shiftId', as: 'assignments' });
    Shift.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  };

  ShiftAssignment.associate = (models) => {
    ShiftAssignment.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staffMember' });
    ShiftAssignment.belongsTo(models.Shift, { foreignKey: 'shiftId', as: 'shiftDetails' });
    ShiftAssignment.hasMany(models.Attendance, { foreignKey: 'shiftAssignmentId', as: 'attendanceLogs' });
  };

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staff' });
    Attendance.belongsTo(models.ShiftAssignment, { foreignKey: 'shiftAssignmentId', as: 'shiftPlan' });
    Attendance.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  };

  return { Shift, ShiftAssignment, Attendance };
};
