const reportService = require('./report.service');
const Response = require('../../utils/response.util');
const { redis } = require('../../config/redis');
const dateTimeUtil = require('../../utils/dateTime.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Business Intelligence (BI) & Analytics Controller
 * 
 * Orchestrates the extraction of actionable insights across clinical, 
 * financial, and operational datasets. Implements auto-queueing for 
 * long-run data exports.
 */

/**
 * --- Dashboard Gateway ---
 */

/**
 * @description Serves the executive hospital-wide command center
 * @access PRIVATE [ADMIN, SUPER_ADMIN]
 * @performance CACHED (2m)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getAdminDashboard();
    res.setHeader('X-Report-Generated-At', new Date().toISOString());
    res.setHeader('X-Cache-Status', 'HIT/MISS'); // Handled by service
    Response.sendSuccess(res, data, 'Hospital command-center dashboard retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Serves personalized clinical metrics for doctors/surgeons
 * @access PRIVATE [DOCTOR]
 * @performance CACHED (3m)
 */
const getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const data = await reportService.getDoctorDashboard(doctorId);
    Response.sendSuccess(res, data, 'Personalized doctor metrics retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Intelligent Report Finalization (Sync vs Async) ---
 */

/**
 * @description Higher-order routing for clinical reports with temporal auto-queueing
 */
const _routeReportRequest = async (req, res, next, reportType, serviceMethod) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 1. Date Integrity Check
    if (!dateTimeUtil.isValidRange(startDate, endDate)) {
      return res.status(400).json({ message: 'Invalid or missing date range' });
    }

    // 2. Large Date-Range Detection (>30 Days) -> Auto Async
    const isLargeRange = dateTimeUtil.getRangeInDays(startDate, endDate) > 30;
    
    if (isLargeRange) {
      const jobId = await reportService.queueExport(reportType, req.user.id, req.query);
      return Response.sendSuccess(res, { jobId, status: 'QUEUED' }, 'Large report range detected. Export has been queued for background processing.', 202);
    }

    // 3. Synchronous Fast Retrieval
    const data = await serviceMethod(req.query, req.user.id);
    res.setHeader('X-Report-Generated-At', new Date().toISOString());
    Response.sendSuccess(res, data, 'Report generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Clinical & Operational Reports ---
 */

/**
 * @description Comprehensive demographic and clinical distribution analytics
 * @access PRIVATE [ADMIN, SUPER_ADMIN, RESEARCHER]
 */
const getPatientReport = (req, res, next) => _routeReportRequest(req, res, next, 'PATIENT_REPORT', reportService.generatePatientReport);

/**
 * @description Financial P&L and revenue categorization audit
 * @access PRIVATE [ADMIN, ACCOUNTANT]
 */
const getRevenueReport = (req, res, next) => _routeReportRequest(req, res, next, 'REVENUE_REPORT', reportService.generateRevenueReport);

/**
 * @description Executive KPI summary with actual-vs-target variance
 * @access PRIVATE [ADMIN, SUPER_ADMIN]
 */
const getHospitalKPIReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await reportService.getHospitalKPIReport(month, year);
    Response.sendSuccess(res, data, 'Executive KPI metrics retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Real-time High Performance Stats ---
 */

/**
 * @description Ultra-lightweight endpoint for header telemetry
 * @access ALL AUTHENTICATED
 * @performance CRITICAL (<500ms guaranteed via Redis-Only)
 */
const getLiveHospitalStats = async (req, res, next) => {
  try {
    const stats = await redis.get('hospital:live_stats');
    if (!stats) {
       // Only if cache is dead, trigger a background refresh but don't block
       reportService.refreshLiveStats().catch(e => logger.error(`LIVE_STATS_REFRESH_ERR: ${e.message}`));
    }
    Response.sendSuccess(res, JSON.parse(stats) || {}, 'Real-time telemetry retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Export Management ---
 */

/**
 * @description Retrieve secure S3 download URL for finalized background exports
 * @access PRIVATE [OWNER, ADMIN]
 */
const downloadExport = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const exportRecord = await reportService.getExportRecord(jobId);

    if (!exportRecord) return res.status(404).json({ message: 'Export job not found' });

    // Ownership & Role Validation
    if (exportRecord.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: You cannot download exports belonging to other staff' });
    }

    const downloadUrl = await reportService.generatePreSignedUrl(exportRecord.s3Key);
    Response.sendSuccess(res, { downloadUrl }, 'S3 Download link generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getDoctorDashboard,
  getNurseDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getNurseDashboard(req.user.wardId, req.user.id)),
  getPharmacyDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getPharmacyDashboard()),
  getLabDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getLabDashboard()),
  getERDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getERDashboard()),
  getInventoryDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getInventoryDashboard()),
  getHRDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getHRDashboard()),
  getAccountsDashboard: async (req, res, next) => Response.sendSuccess(res, await reportService.getAccountsDashboard()),
  getPatientReport,
  getPatientDemographicsReport: (req, res, next) => _routeReportRequest(req, res, next, 'PATIENT_DEMOGRAPHICS', reportService.generateDemographicsReport),
  getDiagnosisFrequencyReport: (req, res, next) => _routeReportRequest(req, res, next, 'DIAGNOSIS_FREQUENCY', reportService.generateDiagnosisFreqReport),
  getRevenueReport,
  getRevenueByDepartmentReport: (req, res, next) => _routeReportRequest(req, res, next, 'REVENUE_DEPT', reportService.generateRevenueByDept),
  getProfitLossSnapshot: async (req, res, next) => Response.sendSuccess(res, await reportService.getPLSnapshot(req.query)),
  getDoctorPerformanceReport: (req, res, next) => _routeReportRequest(req, res, next, 'DOCTOR_PERFORMANCE', reportService.generatePerfReport),
  getOccupancyReport: (req, res, next) => _routeReportRequest(req, res, next, 'OCCUPANCY', reportService.generateOccupancyReport),
  getHospitalKPIReport,
  getAuditReport: async (req, res, next) => Response.sendSuccess(res, await reportService.generateAuditReport(req.query)),
  requestReportExport: async (req, res, next) => Response.sendSuccess(res, { jobId: await reportService.queueExport(req.body.type, req.user.id, req.body.filters) }, 'Export queued', 202),
  getExportStatus: async (req, res, next) => Response.sendSuccess(res, await reportService.getExportStatus(req.params.jobId)),
  downloadExport,
  listMyExports: async (req, res, next) => Response.sendSuccess(res, await reportService.listUserExports(req.user.id)),
  getLiveHospitalStats,
  getAlertsSummary: async (req, res, next) => Response.sendSuccess(res, await reportService.getAlertsSummary())
};
