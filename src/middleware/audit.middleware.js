const AuditLog = require('../models/auditLog.model');
const { logAudit } = require('../utils/logger.util');

/**
 * Audit Trail Middleware
 * 
 * Intercepts sensitive medical operations and persists an immutable audit trail
 * for HIPAA/DISHA compliance.
 */

// Sensitive Clinical Modules
const SENSITIVE_MODULES = [
  'patients', 
  'medical-records', 
  'billing', 
  'prescriptions', 
  'lab-results', 
  'discharge'
];

/**
 * PII Masking Helper
 */
const sanitizePayload = (data) => {
  if (!data) return null;
  const sanitized = JSON.parse(JSON.stringify(data));
  const sensitiveKeys = ['ssn', 'aadhaar', 'cardNumber', 'cvv', 'password'];
  
  const mask = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        mask(obj[key]);
      } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = '***MASKED***';
      }
    }
  };
  
  mask(sanitized);
  return sanitized;
};

/**
 * Determines the simplified action type
 */
const getAction = (method) => {
  const map = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return map[method] || 'READ';
};

const auditTrail = (req, res, next) => {
  const module = req.originalUrl.split('/')[3]; // e.g., /api/v1/patients/... -> patients
  const isSensitive = SENSITIVE_MODULES.includes(module);
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  
  // Compliance Note: Read-audit required for clinical history access
  const isReadAudit = req.method === 'GET' && (
    req.originalUrl.includes('medical-records') || 
    req.originalUrl.includes('lab-reports') || 
    req.originalUrl.includes('billing')
  );

  if (!isSensitive && !isReadAudit) return next();

  // Capture start state if possible (In logic controllers, we'd do deeper diffing)
  // For middleware, we log the intent and the result
  const initialPayload = sanitizePayload(req.body);

  res.on('finish', () => {
    if (res.statusCode >= 400 && isReadAudit) return; // Don't log failed unauthorized reads

    const auditEntry = {
      userId: req.user ? String(req.user.id) : 'anonymous',
      userRole: req.user ? req.user.role : 'N/A',
      userName: req.user ? req.user.name : 'N/A',
      action: getAction(req.method),
      module: module || 'General',
      resourceId: req.params.id || null,
      previousValue: null, // Populated by service-level hooks usually
      newValue: isWrite ? initialPayload : null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
      endpoint: req.originalUrl,
      success: res.statusCode < 400
    };

    // Asynchronous Persistence
    process.nextTick(async () => {
      try {
        // 1. Write to DB
        await AuditLog.create(auditEntry);

        // 2. Write to winston audit stream
        logAudit(`Audit Entry | ${auditEntry.action} | ${auditEntry.module} | User: ${auditEntry.userId}`, auditEntry);
      } catch (err) {
        console.error('CRITICAL: Audit Log Persistence Failed', err);
      }
    });
  });

  next();
};

module.exports = { auditTrail };
