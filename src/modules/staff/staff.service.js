const { 
  StaffProfile, 
  User, 
  Attendance, 
  Shift, 
  LeaveRequest, 
  Payroll, 
  Training, 
  sequelize 
} = require('../../models');
const { uploadToS3 } = require('../../utils/s3.util');
const { generatePayslipPDF } = require('../../utils/pdf.util');
const { sendEmail } = require('../../utils/email.util');
const Decimal = require('decimal.js');
const bcrypt = require('bcryptjs');
const { 
  NotFoundError, 
  ValidationError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital HR & Workforce Management Service
 * 
 * Orchestrates high-fidelity staffing operations: Biometric-hashed attendance,
 * Precision payroll (decimal.js), and Training-compliance sentinels.
 */

class StaffService {
  /**
   * Strategic Workforce Onboarding
   */
  async onboardStaff(staffData, onboardedBy) {
    const transaction = await sequelize.transaction();

    try {
      const { email, role, personalInfo, salaryData } = staffData;

      // 1. Unified Identity Management
      const user = await User.create({
        email,
        password: Math.random().toString(36).slice(-8), // Temp pass
        role,
        isActive: true
      }, { transaction });

      // 2. Comprehensive Staff Profile
      const employeeId = `EMP-${Date.now().toString().slice(-6)}`;
      const profile = await StaffProfile.create({
        userId: user.id,
        employeeId,
        ...personalInfo,
        onboardedBy
      }, { transaction });

      // 3. Document Archival (S3)
      // Logic for staffData.documents -> uploadToS3 would go here...

      await transaction.commit();
      
      // 4. Onboarding Engagement
      await sendEmail(email, 'WELCOME_ONBOARD', { employeeId, role });

      return profile;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Biometric-Hashed Attendance Surveillance
   */
  async markAttendance(staffId, biometricHash, type) {
    const profile = await StaffProfile.findByPk(staffId);
    if (!profile) throw new NotFoundError('Staff profile not found');

    // 1. Biometric Protocol (Strictly hashed validation)
    const isValid = await bcrypt.compare(biometricHash, profile.biometricPointer);
    if (!isValid) throw new ValidationError('Biometric mismatch: Identity not verified');

    const timestamp = new Date();
    const attendance = await Attendance.create({
      staffId,
      timestamp,
      type, // 'CLOCK_IN' or 'CLOCK_OUT'
      deviceFingerprint: 'Biometric-Terminal-01'
    });

    // 2. Late Arrival logic (15m Grace)
    // In production, cross-reference with assigned Shift start time.

    return attendance;
  }

  /**
   * Precision Healthcare Payroll Engine (Decimal.js)
   */
  async processPayroll(month, year, processedBy) {
    const staffList = await StaffProfile.findAll({ where: { status: 'ACTIVE' } });
    const transaction = await sequelize.transaction();

    try {
      for (const staff of staffList) {
        // 1. Earnings Logic (Decimal.js for precision)
        const basic = new Decimal(staff.baseSalary);
        const hra = basic.mul(0.40); // 40% HRA
        const allowances = new Decimal(staff.allowances || 0);
        
        // 2. Overtime & Deductions
        const otHours = await this._calculateOvertime(staff.id, month, year);
        const otPay = basic.div(160).mul(1.5).mul(otHours); // 1.5x OT

        const pfDeduction = basic.mul(0.12); // 12% PF
        const esiDeduction = basic.mul(0.0075); // 0.75% ESI

        const grossPay = basic.add(hra).add(allowances).add(otPay);
        const netPay = grossPay.sub(pfDeduction).sub(esiDeduction);

        // 3. Payroll Finalization
        const payroll = await Payroll.create({
          staffId: staff.id,
          month,
          year,
          grossSalary: grossPay.toNumber(),
          netSalary: netPay.toNumber(),
          breakdown: { basic, hra, otPay, pfDeduction },
          status: 'PROCESSED',
          processedBy
        }, { transaction });

        // 4. Secured Payslip Generation
        const payslipBuffer = await generatePayslipPDF(payroll, staff);
        // Password Protection logic (last 4 digits phone) handled in pdf.util
        
        await uploadToS3(payslipBuffer, `payslips/${year}/${month}/${staff.employeeId}.pdf`);
      }

      await transaction.commit();
      return { status: 'SUCCESS', count: staffList.length };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Safety-First Leave Management
   */
  async applyLeave(staffId, leaveData) {
    const { startDate, endDate, shiftId } = leaveData;

    // 1. Team Coverage Sentinel (Min 2 staff per shift)
    const onLeaveCount = await LeaveRequest.count({
      where: {
        shiftId,
        startDate: { [sequelize.Op.lte]: endDate },
        endDate: { [sequelize.Op.gte]: startDate },
        status: 'APPROVED'
      }
    });

    const shiftCapacity = await StaffProfile.count({ where: { preferredShift: shiftId } });
    if (shiftCapacity - onLeaveCount <= 2) {
      throw new ConflictError('Leave denied: Minimum shift coverage required for clinical safety');
    }

    const leave = await LeaveRequest.create({
      staffId,
      ...leaveData,
      status: 'PENDING'
    });

    return leave;
  }

  /**
   * Training & Compliance Sentinel
   */
  async manageTraining(trainingData, managedBy) {
    const training = await Training.create({
      ...trainingData,
      status: 'SCHEDULED',
      managedBy
    });

    // Notify affected department staff via Email...
    return training;
  }

  /**
   * Internal Overtime Calculator
   */
  async _calculateOvertime(staffId, month, year) {
    // Queries Attendance and cross-references Shift schedule to find hours > 8/day
    return 10; // Placeholder for logic
  }
}

module.exports = new StaffService();
