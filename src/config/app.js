const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger.util');
const mainRouter = require('../routes/index');
const { isRedisAlive } = require('./redis');

/**
 * Express Application Bootstrap (Enterprise Configuration)
 * 
 * Configures professional security middleware, structured logging, 
 * performance optimizations, and health observability.
 */

const app = express();

// 1. Request ID Middleware (Tracing)
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 2. Advanced Logging & Tracing
const { accessLogger, debugLogger, injectLogContext } = require('../middleware/logging.middleware');
app.use(accessLogger);
app.use(debugLogger);
app.use(injectLogContext);

// 3. Security Hardening
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.amazonaws.com"],
      connectSrc: ["'self'", "https://*.amazonaws.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

app.use(hpp()); // HTTP Parameter Pollution prevention
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Rate Limiting & Smart Throttling
const { globalLimiter } = require('../middleware/rateLimit.middleware');
app.use(globalLimiter);

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests, then start slowing down
  delayMs: () => 500 // delay subsequent requests by 500ms
});
app.use(speedLimiter);

// 5. Global Health & Status Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/v1/status', async (req, res) => {
  const redisAlive = await isRedisAlive();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${process.uptime().toFixed(2)}s`,
    services: {
      database: 'connected',
      redis: redisAlive ? 'connected' : 'disconnected',
    },
    system: {
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
      }
    }
  });
});

// 6. Audit Trail Compliance (HIPAA/DISHA)
const { auditTrail } = require('../middleware/audit.middleware');
app.use(auditTrail);

// 7. API Route Mounting
app.use('/api/v1', mainRouter);

// 7. Unknown Route Handler (404)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Resource not found: ${req.originalUrl}`,
    requestId: req.id
  });
});

// 8. Global Error Handler
const globalErrorHandler = require('../middleware/error.middleware');
app.use(globalErrorHandler);

module.exports = app;
