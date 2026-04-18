const departmentService = require('./department.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const dateTimeUtil = require('../../utils/dateTime.util');
const AppError = require('../../utils/appError');

/**
 * Hospital Organizational & Department Management Controller
 * 
 * Orchestrates clinical/administrative hierarchy, workforce mobility, 
 * budgetary oversight, and departmental operational telemetry.
 */

/**
 * --- Institutional CRUD & Org Structure ---
 */

/**
 * @description Provisions a new department with cost-center and HOD anchors
 * @access PRIVATE [ADMIN, CEO]
 */
const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body, req.user);
    Response.sendCreated(res, department, 'Hospital department created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieves full department profile with computed operational metrics
 * @access PRIVATE [ADMIN, HEAD_NURSE, DOCTOR]
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.departmentId);
    Response.sendSuccess(res, department, 'Department profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Transitions a department to an inactive state
 * @access PRIVATE [ADMIN ONLY]
 * @gate Conflict Check: Ensures zero active patient/staff anchors
 */
const deactivateDepartment = async (req, res, next) => {
  try {
    const { activeStaff, activePatients } = await departmentService.checkActiveAssignments(req.params.departmentId);
    
    if (activeStaff > 0 || activePatients > 0) {
      return next(new AppError(`Conflict: Cannot deactivate department with ${activeStaff} staff and ${activePatients} patients`, 409));
    }

    const result = await departmentService.updateDepartment(req.params.departmentId, { isActive: false }, req.user);
    Response.sendSuccess(res, result, 'Department successfully deactivated');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Generates a hierarchical tree-structure for institutional visualization
 * @access PUBLIC (Authenticated Staff)
 * @security Cache-Control: max-age=3600
 */
const getHospitalOrgChart = async (req, res, next) => {
  try {
    const chart = await departmentService.getHospitalOrgChart();
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Cache-Status', 'HIT'); // Simplified status beacon
    Response.sendSuccess(res, chart, 'Hospital organizational chart retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Leadership & Management ---
 */

/**
 * @description Atomic transition of departmental leadership
 * @access PRIVATE [ADMIN, CEO]
 */
const changeDepartmentHOD = async (req, res, next) => {
  try {
    const { newHodId, reason } = req.body;
    if (!reason) return next(new AppError('Protocol Error: A reason is mandatory for HOD change', 400));
    
    const result = await departmentService.changeDepartmentHOD(req.params.departmentId, newHodId, reason, req.user.id);
    Response.sendSuccess(res, result, 'Departmental leadership transferred successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Intelligence & Telemetry ---
 */

/**
 * @description Aggregates clinical and operational health metrics with date-range safety
 * @access PRIVATE [ADMIN, HOD]
 */
const getDepartmentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!dateTimeUtil.isValidRange(startDate, endDate)) {
      return next(new AppError('Query Error: Invalid date range for statistics aggregation', 400));
    }
    const stats = await departmentService.getDepartmentStats(req.params.departmentId, { startDate, endDate });
    Response.sendSuccess(res, stats, 'Department performance metrics retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Orchestrates departmental report generation with temporal scaling (Sync/Async)
 * @access PRIVATE [ADMIN, ACCOUNTANT]
 */
const exportDepartmentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dayCount = dateTimeUtil.getDifferenceInDays(startDate, endDate);

    if (dayCount > 60) {
      const jobId = await departmentService.queueExportJob(req.params.departmentId, req.query, req.user);
      return Response.sendAccepted(res, { jobId }, 'Large report generation scale detected. Job queued for background processing.');
    }

    const { buffer, filename } = await departmentService.generateReport(req.params.departmentId, req.query);
    Response.sendFileResponse(res, buffer, filename, 'application/pdf');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartmentById,
  updateDepartment: async (req, res, next) => Response.sendSuccess(res, await departmentService.updateDepartment(req.params.departmentId, req.body, req.user)),
  deactivateDepartment,
  reactivateDepartment: async (req, res, next) => Response.sendSuccess(res, await departmentService.updateDepartment(req.params.departmentId, { isActive: true }, req.user)),
  listDepartments: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await departmentService.getAllDepartments(req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  searchDepartments: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await departmentService.searchDepartments(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getHospitalOrgChart,
  changeDepartmentHOD,
  getHODHistory: async (req, res, next) => Response.sendSuccess(res, await departmentService.getHODHistory(req.params.departmentId)),
  getCurrentHOD: async (req, res, next) => Response.sendSuccess(res, await departmentService.getCurrentHOD(req.params.departmentId)),
  getDepartmentStaff: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await departmentService.getDepartmentStaff(req.params.departmentId, req.query, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getDepartmentDoctors: async (req, res, next) => Response.sendSuccess(res, await departmentService.getDepartmentDoctors(req.params.departmentId, req.query)),
  assignStaffToDepartment: async (req, res, next) => Response.sendSuccess(res, await departmentService.assignStaffToDepartment(req.body.staffId, req.params.departmentId, req.user)),
  removeStaffFromDepartment: async (req, res, next) => Response.sendSuccess(res, await departmentService.removeStaff(req.body.staffId, req.params.departmentId, req.user)),
  transferStaff: async (req, res, next) => Response.sendSuccess(res, await departmentService.transferStaff(req.body.staffId, req.params.fromDeptId, req.body.toDeptId, req.body.reason, req.user)),
  getDepartmentStaffCount: async (req, res, next) => Response.sendSuccess(res, await departmentService.getStaffCount(req.params.departmentId)),
  getDepartmentSchedule: async (req, res, next) => Response.sendSuccess(res, await departmentService.getDepartmentSchedule(req.params.departmentId, req.query.date)),
  updateDepartmentOperatingHours: async (req, res, next) => Response.sendSuccess(res, await departmentService.updateOperatingHours(req.params.departmentId, req.body, req.user)),
  getDepartmentOperatingHours: async (req, res, next) => Response.sendSuccess(res, await departmentService.getOperatingHours(req.params.departmentId)),
  getDepartmentStats,
  getDepartmentBudget: async (req, res, next) => Response.sendSuccess(res, await departmentService.getDepartmentBudget(req.params.departmentId, req.query.month, req.query.year)),
  updateDepartmentBudget: async (req, res, next) => Response.sendSuccess(res, await departmentService.updateBudget(req.params.departmentId, req.body, req.user)),
  getDepartmentPerformanceReport: async (req, res, next) => Response.sendSuccess(res, await departmentService.getPerformanceReport(req.params.departmentId, req.query)),
  getDepartmentPatients: async (req, res, next) => Response.sendSuccess(res, await departmentService.getDepartmentPatients(req.params.departmentId, req.query)),
  getDepartmentRevenue: async (req, res, next) => Response.sendSuccess(res, await departmentService.getDepartmentRevenue(req.params.departmentId, req.query)),
  exportDepartmentReport,
  getHospitalDepartmentSummary: async (req, res, next) => Response.sendSuccess(res, await departmentService.getSummary()),
  addDepartmentService: async (req, res, next) => Response.sendSuccess(res, await departmentService.addService(req.params.departmentId, req.body, req.user)),
  removeDepartmentService: async (req, res, next) => Response.sendSuccess(res, await departmentService.removeService(req.params.departmentId, req.params.serviceId, req.user)),
  getDepartmentServices: async (req, res, next) => Response.sendSuccess(res, await departmentService.getServices(req.params.departmentId))
};
