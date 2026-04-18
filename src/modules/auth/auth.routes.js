const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { 
  authLimiter, 
  globalLimiter, 
  passwordResetLimiter 
} = require('../../middleware/rateLimit.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} = require('./auth.validator');

/**
 * Authentication & Identity Routes
 * 
 * Section: Account Provisioning (Admin Only)
 */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Admin-only registration of new hospital staff or patients
 * @body    { name, email, phone, role, departmentId }
 * @access  Private (Admin: users:create)
 */
router.post('/register',
  globalLimiter,
  authenticate,
  authorize('users:create'),
  validate({ body: registerSchema }),
  authController.register
);

/**
 * Section: Session Management
 */

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user with credentials
 * @body    { email, password }
 * @returns { accessToken, user, permissions } + httpOnly cookie 'refreshToken'
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidate current session and blacklist token
 * @access  Private (Authenticated)
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Issue new access token using valid refresh token cookie
 * @access  Public (Requires httpOnly cookie)
 */
router.post('/refresh-token',
  authController.refreshToken
);

/**
 * Section: Password Recovery (MFA)
 */

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Trigger OTP and Reset challenge to user email
 * @body    { email }
 * @access  Public (Rate-limited)
 */
router.post('/forgot-password',
  passwordResetLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Validate 6-digit OTP code before password reset
 * @body    { email, otp }
 * @access  Public
 */
router.post('/verify-otp',
  validate({ body: verifyOTPSchema }),
  authController.verifyOTP
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Commit new password using cryptographic reset token
 * @body    { token, newPassword }
 * @access  Public
 */
router.post('/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

/**
 * Section: User Profile & Self-Service
 */

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Update password for logged-in user with challenge
 * @body    { oldPassword, newPassword }
 * @access  Private (Authenticated)
 */
router.put('/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve current user context and permissions
 * @access  Private (Authenticated)
 */
router.get('/me',
  authenticate,
  authController.getMe
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update non-sensitive profile information
 * @body    { name, phone, bio, avatar }
 * @access  Private (Authenticated)
 */
router.put('/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  authController.updateProfile
);

module.exports = router;
