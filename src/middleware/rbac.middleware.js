const { redis } = require('../config/redis');
const logger = require('../utils/logger.util');
const { User, sequelize } = require('../models');

/**
 * RBAC Middleware Module
 * 
 * Provides fine-grained permission control, resource ownership validation,
 * and department-level isolation for the Hospital Management System.
 */

// Default Static Matrix (Fallback if DB/Cache is unavailable)
const DEFAULT_MATRIX = {
  SUPER_ADMIN: ['*:*'], // Wildcard for all modules and actions
  ADMIN: ['patients:*', 'doctors:*', 'staff:*', 'billing:*', 'reports:*'],
  DOCTOR: ['patients:read', 'patients:update', 'prescriptions:*', 'appointments:manage', 'medical-records:*'],
  NURSE: ['patients:read', 'patients:update', 'vitals:create', 'medical-records:read'],
  PHARMACIST: ['prescriptions:read', 'inventory:*', 'billing:read'],
  LAB_TECHNICIAN: ['lab-tests:*', 'lab-reports:*'],
  RECEPTIONIST: ['appointments:*', 'patients:create', 'patients:read'],
  ACCOUNTANT: ['billing:*', 'payments:*'],
  STAFF: ['profile:read', 'inventory:read'],
  PATIENT: ['profile:*', 'appointments:read', 'medical-records:read']
};

/**
 * Authorization Middleware Factory
 * Checks if the user has the required permissions for the action.
 * 
 * @param {...string} requiredPermissions - e.g., 'patients:read'
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const { id: userId, role, departmentId } = req.user;
      
      // 1. Load User Permissions (Check Cache first)
      const cacheKey = `hms:permissions:${userId}`;
      let permissions = await redis.get(cacheKey);

      if (!permissions) {
        // Mock DB fetch for overrides - in real app, query UserPermissions table
        // For now, load default + placeholder empty overrides
        const staticPerms = DEFAULT_MATRIX[role] || [];
        permissions = JSON.stringify(staticPerms);
        
        // Cache for 5 minutes
        await redis.set(cacheKey, permissions, 'EX', 300);
      }

      const userPermissions = JSON.parse(permissions);

      // 2. Permission Check (Handle Wildcards)
      const hasPermission = requiredPermissions.every(reqPerm => {
        if (userPermissions.includes('*:*')) return true;
        
        const [module, action] = reqPerm.split(':');
        return userPermissions.some(userPerm => {
          const [uModule, uAction] = userPerm.split(':');
          return (uModule === module || uModule === '*') && 
                 (uAction === action || uAction === '*');
        });
      });

      if (!hasPermission) {
        return handleAuthFailure(req, res, 'PERMISSION_DENIED', requiredPermissions);
      }

      next();
    } catch (error) {
      logger.error(`RBAC Authorization Error: ${error.message}`);
      res.status(500).json({ status: 'error', message: 'Internal authorization error' });
    }
  };
};

/**
 * Resource Ownership Helper
 * Validates if the user owns the resource or has clinical assignment.
 * 
 * @param {Object} model - Sequelize model
 * @param {string} paramKey - Key in req.params (e.g., 'patientId')
 */
const checkOwnership = (model, paramKey) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramKey];
      const { id: userId, role } = req.user;

      // Admins and Super Admins bypass ownership
      if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return next();

      const resource = await model.findByPk(resourceId);
      if (!resource) {
        return res.status(404).json({ status: 'error', message: 'Resource not found' });
      }

      let isOwner = false;

      // Ownership Logic
      if (role === 'PATIENT') {
        // Patient can only access their own record
        isOwner = resource.userId === userId || resource.id === userId;
      } else if (role === 'DOCTOR') {
        // Doctor can access if they are the primary doctor or assigned
        isOwner = resource.doctorId === userId || resource.assignedDoctorId === userId;
      }

      if (!isOwner) {
        return handleAuthFailure(req, res, 'OWNERSHIP_DENIED', null, resourceId);
      }

      next();
    } catch (error) {
      logger.error(`Ownership Check Error: ${error.message}`);
      res.status(500).json({ status: 'error', message: 'Internal ownership validation error' });
    }
  };
};

/**
 * Department Isolation Middleware
 * Ensures staff can only access resources within their own department.
 */
const isolateDepartment = (model, departmentField = 'departmentId') => {
  return async (req, res, next) => {
    const { role, departmentId: userDeptId } = req.user;
    const resourceId = req.params.id || req.params[Object.keys(req.params)[0]];

    if (['SUPER_ADMIN', 'ADMIN'].includes(role)) return next();

    try {
      const resource = await model.findByPk(resourceId, { attributes: [departmentField] });
      if (resource && resource[departmentField] !== userDeptId) {
        return handleAuthFailure(req, res, 'DEPARTMENT_MISMATCH');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Handle Authorization Failure
 */
const handleAuthFailure = (req, res, reason, required = null, resource = null) => {
  const { id: userId, role } = req.user || {};
  
  logger.warn(`Authorization Failure | User: ${userId} | Role: ${role} | Reason: ${reason}`, {
    userId,
    role,
    attemptedAction: req.method + ' ' + req.originalUrl,
    resource,
    timestamp: new Date()
  });

  const responses = {
    PERMISSION_DENIED: {
      status: 403,
      message: 'You do not have the required permissions for this action',
      requiredPermission: required ? required[0] : 'N/A'
    },
    OWNERSHIP_DENIED: {
      status: 403,
      message: 'Access denied: You do not own this resource',
      reason: 'User is not the associated owner or assigned provider'
    },
    DEPARTMENT_MISMATCH: {
      status: 403,
      message: 'Access denied: Resource belongs to another department',
      reason: 'Cross-department data access restricted'
    }
  };

  const { status, ...body } = responses[reason] || { status: 403, message: 'Access Denied' };
  
  return res.status(status).json({
    status: 'error',
    code: 'FORBIDDEN',
    userRole: role,
    ...body
  });
};

module.exports = {
  authorize,
  checkOwnership,
  isolateDepartment
};
