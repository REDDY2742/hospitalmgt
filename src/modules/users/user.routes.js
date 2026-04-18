const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const { uploadProfilePhoto: uploadMiddleware } = require('../../middleware/upload.middleware');
const { loginRateLimit: rateLimiter } = require('../../middleware/rateLimit.middleware');

const {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userFilterSchema,
  bulkDeactivateSchema
} = require('./user.validator');

/**
 * Hospital User & Identity API Gateway
 * Base Path: /api/v1/users
 * 
 * Orchestrates clinical workforce lifecycles, administrative governance, 
 * and persistent session monitoring with forensic auditing.
 */

// --- 1. Self-Service Access (Any Authenticated User) ---

router.use(authenticate); // Global authentication for all routes below

router.get('/me', userController.getMyProfile);
router.put('/me', validate({ body: updateUserSchema }), auditMiddleware, userController.updateMyProfile);

router.post('/me/photo', 
  rateLimiter, 
  uploadMiddleware, // S3/Multer integration
  auditMiddleware, 
  userController.uploadProfilePhoto
);

router.delete('/me/photo', auditMiddleware, userController.deleteProfilePhoto);

router.put('/me/password', 
  rateLimiter, 
  validate({ body: changePasswordSchema }), 
  auditMiddleware, 
  userController.changeMyPassword
);

router.get('/me/sessions', userController.getMyActiveSessions);
router.get('/me/activity', userController.getMyActivityLog);

// --- 2. Administrative User Governance ---

router.post('/', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: createUserSchema }), 
  auditMiddleware, 
  userController.createUser
);

router.get('/', 
  authorize(['SUPER_ADMIN', 'ADMIN', 'HR']), 
  validate({ query: userFilterSchema }), 
  userController.listUsers
);

router.get('/stats', authorize(['SUPER_ADMIN', 'ADMIN']), userController.getUserStats);
router.get('/export', authorize(['SUPER_ADMIN', 'ADMIN']), userController.exportUsers);

router.post('/bulk/deactivate', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: bulkDeactivateSchema }), 
  auditMiddleware, 
  userController.bulkDeactivateUsers
);

// --- 3. Individual User Management ---

router.get('/:userId', 
  authorize(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']), 
  userController.getUserById
);

router.put('/:userId', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  validate({ body: updateUserSchema }), 
  auditMiddleware, 
  userController.updateUser
);

router.post('/:userId/deactivate', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  auditMiddleware, 
  userController.deactivateUser
);

// --- 4. Role & Permission Governance ---

router.put('/:userId/role', 
  authorize('SUPER_ADMIN'), 
  auditMiddleware, // Higher-tier audit logging handled in controller
  userController.changeUserRole
);

router.put('/:userId/permissions', 
  authorize('SUPER_ADMIN'), 
  auditMiddleware, 
  userController.updateUserPermissions
);

// --- 5. Session Forensic Audit ---

router.get('/:userId/sessions', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  userController.getUserSessions
);

router.delete('/:userId/sessions/:sessionId', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  auditMiddleware, 
  userController.revokeSession
);

router.get('/:userId/activity', 
  authorize(['SUPER_ADMIN', 'ADMIN']), 
  userController.getUserActivityLog
);

module.exports = router;
