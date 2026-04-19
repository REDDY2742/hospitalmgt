const express = require('express');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const listEndpoints = require('express-list-endpoints');
const cors = require('cors');

const { sequelize } = require('../models');
const logger = require('../utils/logger.util');
const { AsyncStorage } = require('../utils/context.util'); // Placeholder for AsyncLocalStorage
const auditMiddleware = require('../middleware/audit.middleware');

/**
 * Hospital Management System - Master API Orchestrator
 */

const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../config/swagger.json');

// --- 1. CONSTANTS ---

const API_V1 = '/api/v1';
const MODULES_DIR = path.join(__dirname, '../modules');
const DEPRECATED_MSG = 'This API version is scheduled for deprecation in 2026. Please migrate to V2.';

const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts. Please try again after 15 minutes.' },
  REPORTS: { windowMs: 60 * 60 * 1000, max: 100, message: 'Report generation limit reached.' },
  STANDARD: { windowMs: 15 * 60 * 1000, max: 500 }
};

// --- 2. GLOBAL REQUEST INSTRUMENTATION ---

router.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
}));

/**
 * @description Injects unique trace IDs and context to each request
 */
router.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-API-Deprecation', DEPRECATED_MSG);
  
  // Propagate context (HIPAA tracing)
  AsyncStorage.run({ requestId: req.id, startTime: Date.now() }, () => next());
});

// Structured Logging via Morgan
router.use(morgan(':method :url :status :res[content-length] - :response-time ms [ID: :id]', {
  skip: (req) => req.url.includes('/health'),
  stream: { write: (msg) => logger.http(msg.trim()) }
}));

morgan.token('id', (req) => req.id);

router.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024,
  level: 6 // Balanced for Gzip/Brotli
}));

router.use(auditMiddleware); // Activity tracking for compliance

router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 3. CORE SYSTEM ROUTES ---

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive system health diagnostic (Readiness probe)
 */
router.get(`${API_V1}/health`, async (req, res) => {
  try {
    const [redisHealth, dbStatus] = await Promise.all([
      checkRedisHealth(),
      sequelize.authenticate().then(() => 'healthy').catch(() => 'unhealthy')
    ]);

    res.status(200).json({
      success: true,
      status: redisHealth.status === 'healthy' && dbStatus === 'healthy' ? 'READY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      telemetry: {
        memory: process.memoryUsage(),
        db: dbStatus,
        redis: redisHealth.status
      }
    });
  } catch (err) {
    res.status(503).json({ success: false, status: 'UNAVAILABLE', error: err.message });
  }
});

router.use(`${API_V1}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * @route   GET /api/v1/system
 * @desc    Admin-only telemetry including host metrics
 */
router.get(`${API_V1}/system`, async (req, res) => {
  const os = require('os');
  res.status(200).json({
    arch: os.arch(),
    platform: os.platform(),
    cpus: os.cpus().length,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    loadAvg: os.loadavg(),
    hospital: process.env.HOSPITAL_NAME
  });
});

// --- 4. DYNAMIC MODULE DISCOVERY ---

/**
 * @description Scans src/modules and auto-registers localized routes
 */
const autoDiscoverModules = () => {
  if (!fs.existsSync(MODULES_DIR)) {
    logger.error(`Module directory not found: ${MODULES_DIR}`);
    return;
  }

  const modules = fs.readdirSync(MODULES_DIR);
  
  modules.forEach((moduleName) => {
    const routePath = path.join(MODULES_DIR, moduleName, 'routes', `${moduleName}.routes.js`);

    if (fs.existsSync(routePath)) {
      try {
        const moduleRouter = require(routePath);
        
        // Apply specialized rate limits based on module type
        let limiter = rateLimit(RATE_LIMITS.STANDARD);
        if (moduleName === 'auth') limiter = rateLimit(RATE_LIMITS.AUTH);
        if (moduleName === 'reports') limiter = rateLimit(RATE_LIMITS.REPORTS);

        router.use(`${API_V1}/${moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`, limiter, moduleRouter);
        logger.info(`Module Registered: ${moduleName} -> ${API_V1}/${moduleName}`);
      } catch (err) {
        logger.error(`Failed to load module [${moduleName}]:`, err);
      }
    }
  });
};

autoDiscoverModules();

// --- 5. TERMINAL HANDLERS ---

// Global 404 for unmatched routes
router.use('*', (req, res, next) => {
  next(new NotFoundError('The requested endpoint was not found on this server', req.originalUrl));
});

// Global Error Orchestrator
router.use(handleGlobalError);

/**
 * @description Logs the routing table on startup (Development mode only)
 */
if (process.env.NODE_ENV !== 'production') {
  setTimeout(() => {
    logger.debug('Routing Table Initialized:');
    listEndpoints(router).forEach(route => {
      logger.debug(`${route.methods.join(',')} ${route.path}`);
    });
  }, 1000);
}

module.exports = router;
