const userService = require('./user.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const AppError = require('../../utils/appError');

/**
 * Hospital User & Identity Management Controller
 * 
 * Orchestrates user lifecycles, administrative governance, and session 
 * sovereignity across all clinical and staff domains.
 */

/**
 * --- User Administrative CRUD ---
 */

/**
 * @description Registers a new hospital staff/patient into the EMS
 * @access PRIVATE [ADMIN, SUPER_ADMIN]
 * @security JWT + RBAC
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const createdBy = req.user;
    const user = await userService.createUser(userData, createdBy);
    Response.sendCreated(res, user, 'User identity created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieves a specific user profile by ID with authority-based masking
 * @access PRIVATE [ADMIN, SUPER_ADMIN, STAFF, PATIENT]
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId, req.user);
    Response.sendSuccess(res, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Administrative deactivation (Soft-Delete) with clinical reason
 * @access PRIVATE [ADMIN, SUPER_ADMIN]
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const result = await userService.deactivateUser(userId, reason, req.user);
    Response.sendSuccess(res, result, 'User account deactivated and sessions revoked');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Profile & Self-Service ---
 */

/**
 * @description Retrieves the authenticated user's own clinical profile
 * @access ALL AUTHENTICATED
 * @security Prevents IDOR by ignoring URL params
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id, req.user);
    Response.sendSuccess(res, user, 'Own profile retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Secure profile photo upload and S3 orchestration
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No image provided', 400));
    const user = await userService.updateUser(req.user.id, { profilePhoto: req.file }, req.user);
    Response.sendSuccess(res, user, 'Profile photo updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Role & Authorization ---
 */

/**
 * @description Elevates or demotes a user's role and resets permissions
 * @access PRIVATE [SUPER_ADMIN ONLY]
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    
    if (req.user.role !== 'SUPER_ADMIN') {
      return next(new AppError('Forbidden: Only Super Admins can mutate base roles', 403));
    }

    const user = await userService.updateUser(userId, { role: newRole }, req.user);
    Response.sendSuccess(res, user, `User role changed to ${newRole}. Existing sessions revoked.`);
  } catch (error) {
    next(error);
  }
};

/**
 * --- Sessions & Activity ---
 */

/**
 * @description Lists active refresh tokens and device fingerprints for a user
 */
const getUserSessions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const sessions = await userService.getUserSessions(userId);
    Response.sendSuccess(res, sessions, 'Active user sessions retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * --- Administrative Intelligence ---
 */

/**
 * @description Exports user data to CSV/Excel with auto-queueing for large datasets
 */
const exportUsers = async (req, res, next) => {
  try {
    const filters = req.query;
    const count = await userService.getUserCount(filters);

    if (count > 1000) {
      const jobId = await userService.queueUserExport(filters, req.user.id);
      return Response.sendAccepted(res, { jobId }, 'Large dataset detected. Export queued for background processing.', 202);
    }

    const { buffer, filename } = await userService.generateUserExport(filters);
    Response.sendFileResponse(res, buffer, filename, 'text/csv');
  } catch (error) {
    next(error);
  }
};

/**
 * @description Global user growth and availability metrics
 */
const getUserStats = async (req, res, next) => {
  try {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return next(new AppError('Forbidden: Access limited to Administrative roles', 403));
    }
    const stats = await userService.getUserStats(req.query);
    Response.sendSuccess(res, stats, 'User demographics stats retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUserById,
  updateUser: async (req, res, next) => Response.sendSuccess(res, await userService.updateUser(req.params.userId, req.body, req.user)),
  deactivateUser,
  reactivateUser: async (req, res, next) => Response.sendSuccess(res, await userService.reactivateUser(req.params.userId, req.user)),
  listUsers: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await userService.getAllUsers(req.query, params, req.user);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  searchUsers: async (req, res, next) => {
    const params = paginationUtil.extractPaginationParams(req.query);
    const data = await userService.searchUsers(req.query.q, params);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  },
  getMyProfile,
  updateMyProfile: async (req, res, next) => Response.sendSuccess(res, await userService.updateUser(req.user.id, req.body, req.user)),
  uploadProfilePhoto,
  deleteProfilePhoto: async (req, res, next) => Response.sendSuccess(res, await userService.updateUser(req.user.id, { profilePhoto: null }, req.user)),
  changeMyPassword: async (req, res, next) => Response.sendSuccess(res, await userService.updatePassword(req.user.id, req.body.oldPassword, req.body.newPassword)),
  changeUserRole,
  updateUserPermissions: async (req, res, next) => Response.sendSuccess(res, await userService.updateUserPermissions(req.params.userId, req.body.permissions, req.user)),
  getUserPermissions: async (req, res, next) => Response.sendSuccess(res, await userService.getUserPermissions(req.params.userId)),
  getRolePermissionMatrix: (req, res, next) => Response.sendSuccess(res, userService.getPermissionMatrix()),
  getUserSessions,
  revokeSession: async (req, res, next) => Response.sendSuccess(res, await userService.revokeUserSession(req.params.userId, req.params.sessionId, req.user)),
  revokeAllSessions: async (req, res, next) => Response.sendSuccess(res, await userService.revokeAllUserSessions(req.params.userId, req.body.exceptCurrent, req.user)),
  getMyActiveSessions: async (req, res, next) => Response.sendSuccess(res, await userService.getUserSessions(req.user.id)),
  getUserActivityLog: async (req, res, next) => Response.sendSuccess(res, await userService.getUserActivityLog(req.params.userId, req.query)),
  getMyActivityLog: async (req, res, next) => Response.sendSuccess(res, await userService.getUserActivityLog(req.user.id, req.query)),
  bulkDeactivateUsers: async (req, res, next) => {
    if (req.body.userIds.length > 50) return next(new AppError('Bulk limit exceeded: Max 50 users per request', 400));
    Response.sendSuccess(res, await userService.bulkDeactivate(req.body.userIds, req.body.reason, req.user));
  },
  bulkUpdateDepartment: async (req, res, next) => Response.sendSuccess(res, await userService.bulkUpdateDept(req.body.userIds, req.body.departmentId, req.user)),
  getUserStats,
  exportUsers
};
