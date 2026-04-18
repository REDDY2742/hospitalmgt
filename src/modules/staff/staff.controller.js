const staffService = require('./staff.service');
const Response = require('../../utils/response.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Staff & HR Management Controller
 * 
 * Orchestrates clinician onboarding, shift/roster management, 
 * performance tracking, and regulatory-compliant payroll.
 */

/**
 * --- Staff Profile Management ---
 */

/**
 * @description Onboard new hospital staff and initialize credentials
 * @access PRIVATE [ADMIN]
 */
const onboardStaff = async (req, res, next) => {
  try {
    const data = await staffService.createNewStaff(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Staff onboarding initiated', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve authenticated staff member's own profile
 * @access PRIVATE [ALL STAFF]
 */
const getMyProfile = async (req, res, next) => {
  try {
    const data = await staffService.getProfile(req.user.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Deactivate staff and revoke active logins (offboarding)
 * @access PRIVATE [ADMIN]
 */
const deactivateStaff = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return next(new Error('Deactivation reason is mandatory for audit trail'));
    
    const data = await staffService.offboardStaff(req.params.id, reason, req.user.id);
    Response.sendSuccess(res, data, 'Staff access revoked and profile deactivated');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Attendance & Shifts ---
 */

/**
 * @description Log shift commencement with IP-based perimeter validation
 * @access PRIVATE [ALL STAFF]
 */
const checkIn = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const data = await staffService.markAttendance(req.user.id, 'CHECK_IN', { ipAddress, ...req.body });
    Response.sendSuccess(res, data, 'Check-in recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Log shift completion with auto-hour calculation
 * @access PRIVATE [ALL STAFF]
 */
const checkOut = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const data = await staffService.markAttendance(req.user.id, 'CHECK_OUT', { ipAddress, ...req.body });
    Response.sendSuccess(res, data, 'Check-out recorded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Leave Management ---
 */

/**
 * @description Apply for clinical/planned leave
 * @access PRIVATE [ALL STAFF]
 */
const applyLeave = async (req, res, next) => {
  try {
    const data = await staffService.createLeaveRequest(req.user.id, req.body);
    Response.sendSuccess(res, data, 'Leave application submitted', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Approve/Reject leave with reason coding
 * @access PRIVATE [MANAGER, ADMIN]
 */
const approveLeave = async (req, res, next) => {
  try {
    const data = await staffService.processLeave(req.params.id, 'APPROVED', req.body, req.user.id);
    Response.sendSuccess(res, data, 'Leave application approved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Payroll ---
 */

/**
 * @description Execute monthly payroll batch for entire hospital
 * @access PRIVATE [ADMIN, ACCOUNTANT]
 */
const processPayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return next(new Error('Payroll processing requires month and year parameters'));

    // Validation: Period already processed
    const alreadyDone = await staffService.checkPayrollStatus(month, year);
    if (alreadyDone) return next(new Error(`Payroll for ${month}/${year} has already been finalized`));

    const data = await staffService.runPayrollBatch(month, year, req.user.id);
    Response.sendSuccess(res, data, `Payroll batch for ${month}/${year} initiated`);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Fetch staff-specific payslip with ownership guard
 * @access PRIVATE [ALL STAFF]
 */
const getMyPayslips = async (req, res, next) => {
  try {
    const data = await staffService.getPayslipsByStaff(req.user.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Generate and stream payslip PDF with ownership/role authorization
 * @access PRIVATE [STAFF, ADMIN]
 */
const getPayslipPDF = async (req, res, next) => {
  try {
    const payslip = await staffService.getPayslipRecord(req.params.id);
    
    // Security Guard: Staff can only see own; Admin/Accountant can see any
    if (req.user.role !== 'ADMIN' && req.user.role !== 'ACCOUNTANT' && payslip.staffId !== req.user.id) {
       return res.status(403).json({ message: 'Forbidden: You are not authorized to access this payroll document' });
    }

    const { stream, filename } = await staffService.generatePayslipStream(req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  onboardStaff,
  getStaffById: async (req, res, next) => Response.sendSuccess(res, await staffService.getStaff(req.params.id)),
  updateStaffProfile: async (req, res, next) => Response.sendSuccess(res, await staffService.updateProfile(req.params.id, req.body)),
  deactivateStaff,
  reactivateStaff: async (req, res, next) => Response.sendSuccess(res, await staffService.restoreStaff(req.params.id)),
  listStaff: async (req, res, next) => Response.sendSuccess(res, await staffService.listFleet(req.query)),
  getStaffByDepartment: async (req, res, next) => Response.sendSuccess(res, await staffService.getByDept(req.params.deptId)),
  uploadStaffDocument: async (req, res, next) => Response.sendSuccess(res, await staffService.saveDocs(req.params.id, req.files), 'Documents uploaded'),
  getStaffDocuments: async (req, res, next) => Response.sendSuccess(res, await staffService.getDocs(req.params.id)),
  getMyProfile,
  updateMyProfile: async (req, res, next) => Response.sendSuccess(res, await staffService.updateProfile(req.user.id, req.body)),
  checkIn,
  checkOut,
  getAttendanceByStaff: async (req, res, next) => Response.sendSuccess(res, await staffService.getAttendance(req.params.id)),
  getAttendanceByDate: async (req, res, next) => Response.sendSuccess(res, await staffService.getAttendanceBatch(req.query.date)),
  correctAttendance: async (req, res, next) => Response.sendSuccess(res, await staffService.modifyAttendance(req.body)),
  getAttendanceSummary: async (req, res, next) => Response.sendSuccess(res, await staffService.getMonthlySummary(req.params.id, req.query)),
  getAbsenteeReport: async (req, res, next) => Response.sendSuccess(res, await staffService.getAbsentees(req.query)),
  createShift: async (req, res, next) => Response.sendSuccess(res, await staffService.createShift(req.body), 'Shift created', 201),
  getShiftSchedule: async (req, res, next) => Response.sendSuccess(res, await staffService.getSchedule(req.query)),
  assignShift: async (req, res, next) => Response.sendSuccess(res, await staffService.assignToShift(req.body)),
  updateShiftAssignment: async (req, res, next) => Response.sendSuccess(res, await staffService.updateAssignment(req.params.id, req.body)),
  getMyShifts: async (req, res, next) => Response.sendSuccess(res, await staffService.getShiftsByStaff(req.user.id)),
  swapShiftRequest: async (req, res, next) => Response.sendSuccess(res, await staffService.requestSwap(req.user.id, req.body)),
  approveShiftSwap: async (req, res, next) => Response.sendSuccess(res, await staffService.processSwap(req.params.swapId, 'APPROVED', req.user.id)),
  applyLeave,
  getLeaveById: async (req, res, next) => Response.sendSuccess(res, await staffService.getLeave(req.params.id)),
  getMyLeaves: async (req, res, next) => Response.sendSuccess(res, await staffService.getLeavesByStaff(req.user.id)),
  approveLeave,
  rejectLeave: async (req, res, next) => Response.sendSuccess(res, await staffService.processLeave(req.params.id, 'REJECTED', req.body, req.user.id)),
  cancelLeave: async (req, res, next) => Response.sendSuccess(res, await staffService.cancelPendingLeave(req.params.id, req.user.id)),
  getLeaveBalance: async (req, res, next) => Response.sendSuccess(res, await staffService.getBalances(req.user.id)),
  getLeaveReport: async (req, res, next) => Response.sendSuccess(res, await staffService.getLeaveSummary(req.query)),
  processPayroll,
  getPayslipById: async (req, res, next) => Response.sendSuccess(res, await staffService.getPayslip(req.params.id)),
  getMyPayslips,
  getPayslipPDF,
  getPayrollReport: async (req, res, next) => Response.sendSuccess(res, await staffService.getGlobalPayrollReport(req.query)),
  scheduleTraining: async (req, res, next) => Response.sendSuccess(res, await staffService.createTraining(req.body)),
  markTrainingAttendance: async (req, res, next) => Response.sendSuccess(res, await staffService.setTrainingAttendance(req.params.id, req.body)),
  uploadCertification: async (req, res, next) => Response.sendSuccess(res, await staffService.addCert(req.user.id, req.file)),
  getExpiringCertifications: async (req, res, next) => Response.sendSuccess(res, await staffService.getExpiringCerts(req.query)),
  getStaffTrainingReport: async (req, res, next) => Response.sendSuccess(res, await staffService.getTrainingStats(req.params.id)),
  getStaffPerformanceReport: async (req, res, next) => Response.sendSuccess(res, await staffService.getPerformance(req.params.id)),
  addPerformanceNote: async (req, res, next) => Response.sendSuccess(res, await staffService.addNote(req.params.id, req.body, req.user.id))
};
