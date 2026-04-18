const { Op, fn, col } = require('sequelize');
const { db } = require('../../config/db');
const Department = require('./department.model'); // Assumed path
const DepartmentAssignment = require('./assignment.model'); // Assumed path
const HODHistory = require('./hodHistory.model'); // Assumed path
const User = require('../users/user.model');
const AppError = require('../../utils/appError');
const { redis } = require('../../config/redis');
const { io } = require('../../app');
const emailService = require('../../utils/email.util');

/**
 * Hospital Organizational & Department Management Service
 * 
 * Orchestrates clinical/administrative hierarchy, HOD transitions, 
 * budgetary oversight, and departmental workforce logistics.
 */

class DepartmentService {
  
  /**
   * --- Organizational Governance ---
   */

  /**
   * @description Provisions a new department with automated cost-center and HOD orchestration
   */
  async createDepartment(departmentData, createdBy) {
    const transaction = await db.transaction();
    try {
      // 1. Role Fidelity: Validate HOD candidate
      const hodCandidate = await User.findByPk(departmentData.hodId, { transaction });
      if (!hodCandidate || !['DOCTOR', 'ADMIN'].includes(hodCandidate.role)) {
        throw new AppError('IdentityError: HOD must be a DOCTOR or ADMIN', 400);
      }

      // 2. Sequential Branding: DEPT-XXX and CC-DEPT-XXXX
      const lastDept = await Department.findOne({ order: [['id', 'DESC']], transaction });
      const nextId = lastDept ? lastDept.id + 1 : 1;
      const code = `DEPT-${nextId.toString().padStart(3, '0')}`;
      const costCenter = departmentData.costCenter || `CC-${code}-${Math.floor(1000 + Math.random() * 9000)}`;

      const department = await Department.create({
        ...departmentData,
        code,
        costCenter,
        isActive: true,
        createdBy: createdBy.id
      }, { transaction });

      // 3. Tenure Integrity: Record HOD Start Date
      await HODHistory.create({
        departmentId: department.id,
        hodId: departmentData.hodId,
        startDate: new Date(),
        reason: 'Initial appointment on department creation'
      }, { transaction });

      await transaction.commit();

      // 4. Outreach & Cache
      await emailService.sendEmail(hodCandidate.email, 'DEPT_HOD_ASSIGNMENT', { departmentName: department.name, hodName: hodCandidate.firstName });
      await redis.set(`hms:departments:${department.id}`, JSON.stringify(department), 'EX', 3600);

      return department;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * @description Changes department leadership with atomic permission and history management
   */
  async changeDepartmentHOD(departmentId, newHodId, reason, changedBy) {
    const transaction = await db.transaction();
    try {
      const department = await Department.findByPk(departmentId, { transaction, lock: true });
      if (!department) throw new AppError('LocationError: Department not found', 404);

      const oldHodId = department.hodId;
      const newHod = await User.findByPk(newHodId, { transaction });
      if (!newHod || !['DOCTOR', 'ADMIN', 'SENIOR'].includes(newHod.role)) {
        throw new AppError('IdentityError: New HOD candidate must have a senior clinical or admin role', 400);
      }

      // 1. Tenure Sunset: End current HOD's era
      await HODHistory.update(
        { endDate: new Date(), exitReason: reason },
        { where: { departmentId, hodId: oldHodId, endDate: null }, transaction }
      );

      // 2. Tenure Sunrise: Start new HOD record
      await HODHistory.create({
        departmentId,
        hodId: newHodId,
        startDate: new Date(),
        reason
      }, { transaction });

      // 3. State Mutation
      department.hodId = newHodId;
      await department.save({ transaction });

      // 4. Administrative Hand-off (Mock Permissions logic)
      // await permissionsService.grantHODAccess(newHodId, departmentId);
      // await permissionsService.revokeHODAccess(oldHodId, departmentId);

      await transaction.commit();

      // 5. Real-time Broadcasting
      io.to(`dept_room_${departmentId}`).emit('HOD_CHANGED', { newHodName: newHod.firstName, reason });
      await redis.del(`hms:departments:${departmentId}`);

      return { success: true, message: 'Departmental leadership successfully transferred' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * --- Workforce & Staffing ---
   */

  /**
   * @description Orchestrates the internal transfer of clinical staff between departments
   */
  async transferStaff(staffId, fromDeptId, toDeptId, reason, transferredBy) {
    const transaction = await db.transaction();
    try {
      // 1. Sunset Existing Assignment
      await DepartmentAssignment.update(
        { endDate: new Date(), exitReason: reason, isActive: false },
        { where: { userId: staffId, departmentId: fromDeptId, isActive: true }, transaction }
      );

      // 2. Sunrise New Assignment
      const newAssignment = await DepartmentAssignment.create({
        userId: staffId,
        departmentId: toDeptId,
        startDate: new Date(),
        reason,
        isActive: true,
        assignedBy: transferredBy.id
      }, { transaction });

      // 3. Sync User Profile
      await User.update({ departmentId: toDeptId }, { where: { id: staffId }, transaction });

      await transaction.commit();

      // Notify HODs
      const depts = await Department.findAll({ where: { id: [fromDeptId, toDeptId] } });
      for (const dept of depts) {
        io.to(`user_${dept.hodId}`).emit('STAFF_TRANSFER_ALERT', { staffId, reason });
      }

      return newAssignment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * --- Org Intelligence & Telemetry ---
   */

  /**
   * @description Generates a hierarchical tree structure of the entire hospital organization
   */
  async getHospitalOrgChart() {
    const cacheKey = 'hms:org:chart';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const departments = await Department.findAll({
      include: [{ model: User, as: 'hod', attributes: ['firstName', 'lastName', 'email'] }],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    // Transform into tree grouped by Type
    const chart = departments.reduce((acc, dept) => {
      const type = dept.type.toUpperCase();
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        hod: dept.hod ? `${dept.hod.firstName} ${dept.hod.lastName}` : 'VACANT',
        floor: dept.floor
      });
      return acc;
    }, {});

    await redis.set(cacheKey, JSON.stringify(chart), 'EX', 3600);
    return chart;
  }

  /**
   * @description Aggregates real-time financial and operational health metrics for a department
   */
  async getDepartmentStats(departmentId, dateRange) {
    const stats = {
      patientVolume: await this._getPatientCounts(departmentId, dateRange),
      revenue: await this._getRevenueMetrics(departmentId, dateRange),
      utilization: await this._getStaffUtilization(departmentId)
    };
    return stats;
  }

  /**
   * --- Financial & Budgetary ---
   */

  /**
   * @description Tracks departmental spend against allocated cost-center budget
   */
  async getDepartmentBudget(departmentId, month, year) {
    const dept = await Department.findByPk(departmentId);
    if (!dept) throw new AppError('Department not found', 404);

    // Sum all spending associated with this department's costCenter (placeholder)
    const spent = await db.query('SELECT SUM(amount) as total FROM hospital_expenses WHERE cost_center = ? AND MONTH(date) = ? AND YEAR(date) = ?', {
      replacements: [dept.costCenter, month, year],
      type: db.QueryTypes.SELECT
    });

    const totalSpent = spent[0].total || 0;
    const utilization = ((totalSpent / dept.monthlyBudget) * 100).toFixed(2);

    return {
      allocated: dept.monthlyBudget,
      spent: totalSpent,
      remaining: dept.monthlyBudget - totalSpent,
      utilizationPercentage: utilization,
      costCenter: dept.costCenter
    };
  }

  /**
   * --- Internal Computation Helpers ---
   */

  async _getPatientCounts(deptId, range) {
    // Aggregation logic for OPD + IPD anchors
    return { opd: 142, ipd: 38 }; // MOCK output for service skeleton
  }

  async _getRevenueMetrics(deptId, range) {
    // Aggregation logic for billing records tagged per department
    return { totalRevenue: 1540200, currency: 'INR' }; // MOCK (paise conversion handled in billing)
  }

  async _getStaffUtilization(deptId) {
    // Staff assignment tracking
    const counts = await User.findAll({
      where: { departmentId: deptId },
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      group: ['role'],
      raw: true
    });
    return counts;
  }
}

module.exports = new DepartmentService();
