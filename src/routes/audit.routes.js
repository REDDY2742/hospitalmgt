const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const AuditLog = require('../models/auditLog.model');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * Compliance Audit Routes
 * Restricted to SUPER_ADMIN and Compliance Officers
 */

/**
 * @route   GET /api/v1/audit
 * @desc    Query audit logs with filters
 * @access  Private (Super Admin)
 */
router.get('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      userId, 
      module, 
      action, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      total: count,
      data: rows
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * @route   GET /api/v1/audit/verify/:id
 * @desc    Verify integrity of an audit entry using its hash
 */
router.get('/verify/:id', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    // Logic to re-calculate hash and compare with stored hash
    res.status(501).json({ message: 'Integrity verification logic pending implementation' });
});

module.exports = router;
