i want to build something like hospital website . to run hospital website what is required& what features, hospital maintained, doctors,staff,patients,nurse, wards, pharmacy, billing section,.....like this in hospital have the more things like this . so we will create that with frontend reactjs , backend with nodejs & db is mysql& aws s3 bucket . analyse this prompt if any missing add to that & div9ide that into 3 phases like first backend,2nd frontend& last db . in backend what is the project structure & in backend how many files is there for that many files i need seperate prompt (only prompt not code) ,the prompt need to be very unique& advanced mode of code avoid the issues in code & get me the wow factor prompts . if any missing features add & give me forst backend


Thought Process
expand
🏥 Hospital Management System — Full Analysis & Backend Blueprint
✅ COMPLETE FEATURE ANALYSIS (Missing Features Added)
Category	Features
Core	Auth, RBAC, Audit Logs, Session Management
Patients	Registration, OPD, IPD, Vitals, Medical History, Discharge
Doctors	Profile, Schedule, Specialization, Availability, Consultation
Staff	HR, Attendance, Shift, Payroll, Leave Management
Nurses	Assignment, Shift, Ward Duty, Patient Care Notes
Wards & Rooms	Ward Types, Bed Management, Allocation, Transfer
Appointments	Booking, Rescheduling, Queue, Token System
Pharmacy	Medicine Inventory, Prescriptions, Expiry Alerts, Dispensing
Billing	Invoice, GST, Insurance Claim, Payment Gateway, Receipt
Laboratory	Test Orders, Results, Reports, Integration
Operation Theatre	Scheduling, Team Assignment, Equipment, Post-Op Notes
Emergency	Triage, ER Admission, Critical Alerts
Blood Bank	Inventory, Donor, Compatibility, Requests
Ambulance	Fleet, GPS Tracking, Dispatch, Availability
Insurance	Provider, Claims, Pre-Auth, TPA
Inventory	Medical Supplies, Equipment, Purchase Orders, Alerts
Telemedicine	Video Consult, E-Prescription, Online Queue
Departments	Specialties, HOD, Budget
Notifications	Email, SMS, Push, Real-time (Socket.io)
Reports & Analytics	Revenue, Occupancy, Doctor Performance, Patient Stats
Suppliers	Vendor Management, Purchase Orders, Invoices
Discharge	Summary, Instructions, Follow-up, Certificate
📦 3 PHASES
text
Phase 1 → BACKEND  (Node.js + Express + MySQL + AWS S3)
Phase 2 → DATABASE (MySQL Schema, Relations, Migrations, Seeders)
Phase 3 → FRONTEND (React.js + Redux + Tailwind + Charts)
🔴 PHASE 1 — BACKEND PROJECT STRUCTURE
text
hospital-management-backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── aws.js
│   │   ├── redis.js
│   │   ├── mailer.js
│   │   ├── socket.js
│   │   └── app.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── logger.middleware.js
│   │   └── audit.middleware.js
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validator.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validator.js
│   │   │
│   │   ├── patients/
│   │   │   ├── patient.controller.js
│   │   │   ├── patient.service.js
│   │   │   ├── patient.routes.js
│   │   │   └── patient.validator.js
│   │   │
│   │   ├── doctors/
│   │   │   ├── doctor.controller.js
│   │   │   ├── doctor.service.js
│   │   │   ├── doctor.routes.js
│   │   │   └── doctor.validator.js
│   │   │
│   │   ├── staff/
│   │   │   ├── staff.controller.js
│   │   │   ├── staff.service.js
│   │   │   ├── staff.routes.js
│   │   │   └── staff.validator.js
│   │   │
│   │   ├── nurses/
│   │   │   ├── nurse.controller.js
│   │   │   ├── nurse.service.js
│   │   │   ├── nurse.routes.js
│   │   │   └── nurse.validator.js
│   │   │
│   │   ├── departments/
│   │   │   ├── department.controller.js
│   │   │   ├── department.service.js
│   │   │   ├── department.routes.js
│   │   │   └── department.validator.js
│   │   │
│   │   ├── appointments/
│   │   │   ├── appointment.controller.js
│   │   │   ├── appointment.service.js
│   │   │   ├── appointment.routes.js
│   │   │   └── appointment.validator.js
│   │   │
│   │   ├── wards/
│   │   │   ├── ward.controller.js
│   │   │   ├── ward.service.js
│   │   │   ├── ward.routes.js
│   │   │   └── ward.validator.js
│   │   │
│   │   ├── rooms/
│   │   │   ├── room.controller.js
│   │   │   ├── room.service.js
│   │   │   ├── room.routes.js
│   │   │   └── room.validator.js
│   │   │
│   │   ├── pharmacy/
│   │   │   ├── pharmacy.controller.js
│   │   │   ├── pharmacy.service.js
│   │   │   ├── pharmacy.routes.js
│   │   │   └── pharmacy.validator.js
│   │   │
│   │   ├── billing/
│   │   │   ├── billing.controller.js
│   │   │   ├── billing.service.js
│   │   │   ├── billing.routes.js
│   │   │   └── billing.validator.js
│   │   │
│   │   ├── laboratory/
│   │   │   ├── lab.controller.js
│   │   │   ├── lab.service.js
│   │   │   ├── lab.routes.js
│   │   │   └── lab.validator.js
│   │   │
│   │   ├── medical-records/
│   │   │   ├── medicalRecord.controller.js
│   │   │   ├── medicalRecord.service.js
│   │   │   ├── medicalRecord.routes.js
│   │   │   └── medicalRecord.validator.js
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.controller.js
│   │   │   ├── inventory.service.js
│   │   │   ├── inventory.routes.js
│   │   │   └── inventory.validator.js
│   │   │
│   │   ├── insurance/
│   │   │   ├── insurance.controller.js
│   │   │   ├── insurance.service.js
│   │   │   ├── insurance.routes.js
│   │   │   └── insurance.validator.js
│   │   │
│   │   ├── emergency/
│   │   │   ├── emergency.controller.js
│   │   │   ├── emergency.service.js
│   │   │   ├── emergency.routes.js
│   │   │   └── emergency.validator.js
│   │   │
│   │   ├── blood-bank/
│   │   │   ├── bloodBank.controller.js
│   │   │   ├── bloodBank.service.js
│   │   │   ├── bloodBank.routes.js
│   │   │   └── bloodBank.validator.js
│   │   │
│   │   ├── operation-theatre/
│   │   │   ├── ot.controller.js
│   │   │   ├── ot.service.js
│   │   │   ├── ot.routes.js
│   │   │   └── ot.validator.js
│   │   │
│   │   ├── ambulance/
│   │   │   ├── ambulance.controller.js
│   │   │   ├── ambulance.service.js
│   │   │   ├── ambulance.routes.js
│   │   │   └── ambulance.validator.js
│   │   │
│   │   ├── telemedicine/
│   │   │   ├── telemedicine.controller.js
│   │   │   ├── telemedicine.service.js
│   │   │   ├── telemedicine.routes.js
│   │   │   └── telemedicine.validator.js
│   │   │
│   │   ├── discharge/
│   │   │   ├── discharge.controller.js
│   │   │   ├── discharge.service.js
│   │   │   ├── discharge.routes.js
│   │   │   └── discharge.validator.js
│   │   │
│   │   ├── suppliers/
│   │   │   ├── supplier.controller.js
│   │   │   ├── supplier.service.js
│   │   │   ├── supplier.routes.js
│   │   │   └── supplier.validator.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   ├── notification.routes.js
│   │   │   └── notification.validator.js
│   │   │
│   │   └── reports/
│   │       ├── report.controller.js
│   │       ├── report.service.js
│   │       ├── report.routes.js
│   │       └── report.validator.js
│   │
│   ├── models/
│   │   ├── index.js
│   │   ├── user.model.js
│   │   ├── patient.model.js
│   │   ├── doctor.model.js
│   │   ├── staff.model.js
│   │   ├── nurse.model.js
│   │   ├── department.model.js
│   │   ├── appointment.model.js
│   │   ├── ward.model.js
│   │   ├── room.model.js
│   │   ├── bed.model.js
│   │   ├── pharmacy.model.js
│   │   ├── medicine.model.js
│   │   ├── prescription.model.js
│   │   ├── billing.model.js
│   │   ├── payment.model.js
│   │   ├── lab.model.js
│   │   ├── labResult.model.js
│   │   ├── medicalRecord.model.js
│   │   ├── inventory.model.js
│   │   ├── insurance.model.js
│   │   ├── emergency.model.js
│   │   ├── bloodBank.model.js
│   │   ├── ot.model.js
│   │   ├── ambulance.model.js
│   │   ├── telemedicine.model.js
│   │   ├── discharge.model.js
│   │   ├── supplier.model.js
│   │   ├── notification.model.js
│   │   └── auditLog.model.js
│   │
│   ├── utils/
│   │   ├── response.util.js
│   │   ├── pagination.util.js
│   │   ├── jwt.util.js
│   │   ├── encryption.util.js
│   │   ├── pdf.util.js
│   │   ├── email.util.js
│   │   ├── sms.util.js
│   │   ├── s3.util.js
│   │   ├── logger.util.js
│   │   ├── scheduler.util.js
│   │   └── dateTime.util.js
│   │
│   └── routes/
│       └── index.js
│
├── migrations/
├── seeders/
├── tests/
│   ├── unit/
│   └── integration/
├── logs/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
📊 FILE COUNT SUMMARY
Folder	Files
config/	6
middleware/	8
modules/ (22 modules × 4)	88
models/	30
utils/	11
routes/	1
Root	server.js, .env, package.json etc.
Total	~150 files
🔥 ADVANCED UNIQUE PROMPTS — BACKEND FILES
⚙️ CONFIG FILES
src/config/database.js
text
You are a senior backend architect. Build a production-grade MySQL database 
configuration module for a Hospital Management System using the `mysql2` 
and `sequelize` packages in Node.js.

Requirements:
- Create a Sequelize instance with connection pooling (min:2, max:10, 
  acquire:30000, idle:10000)
- Support multiple environments: development, staging, production via 
  process.env.NODE_ENV
- Implement retry logic with exponential backoff (max 5 retries) if DB 
  connection fails on startup
- Add query logging only in development mode using a custom logger 
  (winston-based)
- Export a testConnection() async function that pings the DB and logs 
  success or throws a detailed error
- Use SSL in production with certificate path from env
- Apply dialectOptions for timezone, charset, and multipleStatements: false 
  for SQL injection safety
- Avoid hardcoded credentials — all from .env with validation using `joi` 
  schema at startup
- Handle graceful shutdown by closing DB pool on SIGTERM/SIGINT
- Add inline comments explaining every configuration key for team clarity
src/config/aws.js
text
You are a cloud infrastructure engineer. Create an advanced AWS configuration 
module for a Hospital Management System Node.js backend.

Requirements:
- Initialize AWS SDK v3 with S3Client, using credentials from environment 
  variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
- Create and export reusable S3 command wrappers: uploadFile, getSignedUrl, 
  deleteFile, copyFile, listFiles
- Support multiple S3 buckets (patient-documents, lab-reports, 
  prescriptions, profile-images) from separate env variables
- Implement pre-signed URL generation with configurable expiry 
  (default: 15 minutes for sensitive medical documents)
- Add MIME type validation before upload with whitelist: 
  [pdf, jpg, jpeg, png, dcm (DICOM)]
- Integrate retry strategy (3 retries) with exponential delay using 
  @aws-sdk/middleware-retry
- Add file size limit validation (max 10MB) before upload
- Include metadata tagging: uploadedBy, patientId, documentType, 
  uploadedAt on every S3 object
- Log every S3 operation (upload/delete/access) to a structured winston 
  logger with correlation IDs
- Never expose bucket names or credentials in error responses
src/config/redis.js
text
You are a backend performance engineer. Build a production-ready Redis 
configuration module for a Hospital Management System in Node.js 
using the `ioredis` package.

Requirements:
- Create a Redis client with retry strategy (max 10 retries with 
  exponential backoff, max delay 30s)
- Support Redis Sentinel or Cluster mode based on env flag 
  (REDIS_MODE=single|cluster|sentinel)
- Implement a cache wrapper with get, set, del, flush functions with 
  optional TTL support
- Create a separate Redis client for pub/sub (notification broadcasting) 
  isolated from the main client
- Add key prefixing strategy: `hms:{module}:{id}` for namespace isolation 
  across modules (patients, doctors, appointments)
- Implement cache invalidation helpers: invalidateByPattern, invalidateById
- Handle connection events: connect, error, reconnecting, close with 
  proper winston logging
- Add health check function isRedisAlive() returning boolean
- Protect against cache stampede using mutex locking pattern 
  for critical cache misses
- Use Redis for: JWT blacklisting, rate limit counters, OTP storage 
  (with TTL), session management, appointment slot locking
src/config/mailer.js
text
You are a backend communication engineer. Build a robust email configuration 
module for a Hospital Management System using Nodemailer with 
AWS SES as the transport layer.

Requirements:
- Initialize Nodemailer transport using AWS SES SDK v3 (not SMTP) 
  with region and credentials from environment variables
- Create a sendMail(options) base function with from, to, cc, bcc, 
  subject, html, attachments support
- Build dedicated hospital email functions:
  * sendAppointmentConfirmation(patient, appointment, doctor)
  * sendBillInvoice(patient, billData, pdfBuffer)
  * sendLabReportReady(patient, labTest)
  * sendDischargeInstructions(patient, discharge)
  * sendPasswordReset(user, token)
  * sendOTPVerification(user, otp)
  * sendEmergencyAlert(staff[], message)
- Use Handlebars or Mjml for professional hospital-branded HTML email 
  templates stored in /templates folder
- Add email queue using Bull (Redis-based) for async sending, retry 
  failed emails up to 3 times with delay
- Log every email: recipient, subject, status, timestamp using winston
- Validate email addresses with regex before sending
- Support attachments from Buffer (PDF invoices, lab reports from S3)
- Never expose SES credentials in error stacks
src/config/socket.js
text
You are a real-time systems engineer. Build a production-grade Socket.io 
configuration for a Hospital Management System integrated with 
an Express.js server.

Requirements:
- Initialize Socket.io with CORS restricted to allowed origins from 
  environment variable (FRONTEND_URL)
- Implement JWT-based socket authentication middleware — reject 
  unauthenticated connections immediately
- Create role-based socket rooms: doctor:{id}, nurse:{id}, admin, 
  emergency, ward:{wardId}
- Implement these real-time event namespaces:
  /emergency — critical patient alerts to ER staff
  /appointments — real-time queue updates to doctors & patients
  /notifications — system-wide alerts
  /ambulance — GPS location broadcasting
  /ot — operation theatre team communication
- Add connection tracking: store online users (userId → socketId) 
  in Redis with TTL
- Handle graceful disconnection: remove from Redis, broadcast 
  offline status to relevant rooms
- Implement heartbeat/ping-pong every 25s with 60s timeout
- Rate limit socket events per user (max 30 events/minute via Redis)
- Log all critical socket events with timestamp, userId, event, 
  room using winston structured logger
- Export io instance for use in service layers (push notifications 
  from anywhere in the app)
src/config/app.js
text
You are a senior Node.js architect. Build the Express.js application 
bootstrap file for a Hospital Management System with enterprise-grade 
configuration.

Requirements:
- Initialize Express with all security middleware in correct order:
  * helmet() with custom CSP headers
  * cors() with whitelist from env
  * express-mongo-sanitize equivalent for SQL injection prevention
  * hpp() for HTTP parameter pollution prevention
  * compression() for gzip
  * express.json() with 10mb limit
  * express.urlencoded() extended
- Mount the main router from src/routes/index.js under /api/v1
- Add request ID middleware (uuid v4 per request, attached to req.id 
  and response header X-Request-ID)
- Integrate morgan HTTP request logger piped to winston stream 
  (combined format in prod, dev format in development)
- Add global 404 handler for unknown routes with structured JSON response
- Mount global error handler middleware last
- Add /health and /api/v1/status endpoints returning: uptime, 
  DB status, Redis status, memory usage, environment
- Apply express-slow-down for gradual request throttling before 
  rate limiter kicks in
- Export the app (not listen) — server.js handles the listen
- Keep the file clean, modular, and fully commented
🛡️ MIDDLEWARE FILES
src/middleware/auth.middleware.js
text
You are a security-focused backend engineer. Build a bulletproof JWT 
authentication middleware for a Hospital Management System Node.js 
Express backend.

Requirements:
- Extract JWT from Authorization header (Bearer token) — reject 
  malformed headers with 401
- Verify token using jsonwebtoken with RS256 algorithm 
  (asymmetric keys from env)
- Check token against Redis blacklist (logged-out tokens) — 
  reject blacklisted tokens with 401
- Decode and attach full user payload to req.user: 
  {id, role, name, email, departmentId, isActive}
- Validate that the user account is still active in DB 
  (cached in Redis for 5 min)
- Implement token rotation: if token is within 10 minutes of expiry, 
  issue a new token in response header X-New-Token
- Handle all JWT errors distinctly: 
  TokenExpiredError → 401 with expiredAt timestamp
  JsonWebTokenError → 401 with message
  NotBeforeError → 401 with date
- Add refresh token support: separate /auth/refresh endpoint 
  with long-lived refresh token (7d) stored as httpOnly cookie
- Never expose token secrets or internal user data in error messages
- Log every failed authentication attempt: ip, userId (if decoded), 
  reason, timestamp to audit log
src/middleware/rbac.middleware.js
text
You are a security architect. Build a dynamic Role-Based Access Control 
(RBAC) middleware for a Hospital Management System with fine-grained 
permission control.

Hospital Roles:
SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, 
RECEPTIONIST, ACCOUNTANT, STAFF, PATIENT

Requirements:
- Create a permission matrix object mapping each role to allowed 
  module:action combinations 
  (e.g., DOCTOR: ['patients:read', 'prescriptions:create', 
  'appointments:manage'])
- Build authorize(...requiredPermissions) middleware factory that 
  checks req.user.role against permission matrix
- Support multi-role permission: user can have primary role + 
  additional permission overrides stored in DB
- Implement resource-level ownership check: patients can only access 
  their own records, doctors only their assigned patients
- Support department-level isolation: doctors from Cardiology 
  cannot access Neurology restricted data
- Load permissions from DB at startup, cache in Redis with 5-min TTL, 
  auto-refresh on permission changes
- Log every authorization failure: userId, role, attempted action, 
  resource, timestamp to audit log
- Return structured 403 response with: reason, requiredPermission, 
  userRole (never expose the full permission matrix)
- Add a checkOwnership(model, paramKey) helper for resource ownership 
  validation
- Make the middleware composable: 
  router.get('/', authenticate, authorize('patients:read'), controller)
src/middleware/upload.middleware.js
text
You are a file systems engineer. Build a comprehensive file upload 
middleware for a Hospital Management System using Multer with 
direct AWS S3 streaming.

Requirements:
- Use multer-s3 to stream files directly to S3 without saving to disk
- Configure separate upload handlers for different document types:
  * uploadProfilePhoto → profile-images bucket, max 2MB, jpg/png only
  * uploadMedicalDocument → patient-documents bucket, max 10MB, 
    pdf/jpg/png/dcm
  * uploadLabReport → lab-reports bucket, max 15MB, pdf/jpg/png/dcm
  * uploadPrescription → prescriptions bucket, max 5MB, pdf/jpg/png
- Generate unique file keys: 
  `{module}/{year}/{month}/{uuid}-{originalname}`
- Validate MIME type using file-type package (not just extension) 
  to prevent disguised malicious files
- Compress images (jpg/png) using sharp before upload if > 500KB
- Add file metadata as S3 object tags: uploadedBy, patientId, 
  documentType, module, uploadedAt
- Handle multer errors distinctly: LIMIT_FILE_SIZE, 
  LIMIT_UNEXPECTED_FILE with clear 400 responses
- Virus scan hook: placeholder function scanFile() 
  (integrate ClamAV or AWS GuardDuty in future)
- Return S3 key and pre-signed URL in req.uploadedFile after success
- Log every file upload: uploader, fileType, size, s3Key, 
  timestamp to structured logger
src/middleware/validation.middleware.js
text
You are a backend quality engineer. Build a universal request validation 
middleware for a Hospital Management System using Joi schema validation.

Requirements:
- Create a validate(schema, target) middleware factory where target 
  is 'body' | 'query' | 'params'
- Support combined validation: validate({body: schema, query: schema, 
  params: schema}) in a single middleware call
- Sanitize all string inputs: trim whitespace, strip HTML tags 
  using sanitize-html to prevent XSS
- Custom Joi extensions for hospital-specific formats:
  * phoneNumber — Indian/international format with country code
  * aadhaarNumber — 12-digit masked validation
  * bloodGroup — A+/A-/B+/B-/O+/O-/AB+/AB-
  * appointmentTime — 15-min slot format (HH:MM)
  * icd10Code — standard ICD-10 diagnosis code format
- Return ALL validation errors at once (not just first) as structured 
  array: [{field, message, value}]
- Strip unknown fields from request body (allowUnknown: false) 
  to prevent mass assignment attacks
- Support conditional validation (e.g., if admissionType is IPD, 
  then wardId is required)
- Log validation failures: endpoint, userId, errorCount, fields 
  to debug logger
- Keep validator schemas in respective module validator files 
  and import into middleware
src/middleware/rateLimiter.middleware.js
text
You are a backend security engineer. Build a multi-tier rate limiting 
middleware for a Hospital Management System using express-rate-limit 
with Redis store (rate-limit-redis).

Requirements:
- Create multiple rate limiters for different sensitivity levels:

  * globalLimiter — 500 req/15min per IP (applied globally)
  * authLimiter — 10 req/15min per IP (login/register/OTP)
  * passwordResetLimiter — 3 req/hour per email+IP
  * apiLimiter — 100 req/min per authenticated user
  * emergencyLimiter — 1000 req/min (bypass for ER endpoints)
  * uploadLimiter — 20 uploads/hour per user

- Use Redis store for distributed rate limiting 
  (works across multiple server instances)
- Implement dynamic rate limiting: reduce limits for IPs 
  with recent failed auth attempts (stored in Redis)
- Add custom key generator: combine IP + userId for 
  authenticated requests
- Return standard rate limit headers: 
  X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Implement IP whitelist for internal hospital network 
  (INTERNAL_IPS env variable — bypass rate limits)
- On rate limit exceeded: log IP, endpoint, userId, count 
  to security audit log and trigger alert if threshold 
  exceeds 3x in 5 minutes
- Send 429 response with retryAfter timestamp in human-readable 
  and epoch format
src/middleware/errorHandler.middleware.js
text
You are a backend reliability engineer. Build a centralized, 
production-grade global error handler middleware for a Hospital 
Management System Express.js backend.

Requirements:
- Create a custom AppError class extending Error with: 
  statusCode, isOperational, errorCode, module, details
- Create specific error subclasses:
  * ValidationError (400)
  * AuthenticationError (401)
  * ForbiddenError (403)
  * NotFoundError (404)
  * ConflictError (409) — e.g., appointment slot taken
  * RateLimitError (429)
  * DatabaseError (500)
  * S3UploadError (500)
  * ExternalServiceError (502)

- Global error handler middleware:
  * Distinguish operational errors vs programmer errors
  * Sequelize-specific error mapping: 
    UniqueConstraintError → 409, ValidationError → 400, 
    ForeignKeyConstraintError → 400, ConnectionError → 503
  * JWT errors → 401 with specific message
  * Multer errors → 400

- In development: return full stack trace + error details
- In production: return only safe, user-friendly message 
  (never leak stack/internals)
- Log all errors to winston with: 
  requestId, userId, endpoint, method, statusCode, 
  errorCode, message, stack (production: errors only)
- Send critical 500 errors to monitoring service 
  (placeholder for Sentry/Datadog integration)
- Unhandled rejection + uncaughtException handlers in server.js 
  with graceful shutdown
src/middleware/logger.middleware.js
text
You are a backend observability engineer. Build a comprehensive 
structured logging middleware for a Hospital Management System 
using Winston with multiple transports.

Requirements:
- Configure Winston logger with these transports:
  * Console transport — colorized in development, JSON in production
  * Daily rotate file — combined.log (all levels), error.log 
    (error only), audit.log (security events)
  * (Placeholder) CloudWatch transport for production log shipping

- Log format must include: timestamp, level, requestId, 
  userId, method, url, statusCode, responseTime, ip, userAgent
- Morgan integration: pipe HTTP access logs to Winston stream 
  with custom token for requestId
- Create child loggers per module: 
  logger.child({module: 'billing'}) for context isolation
- Implement log levels: error, warn, info, http, debug 
  (controlled by LOG_LEVEL env variable)
- Mask sensitive data in logs: passwords, tokens, aadhaarNumber, 
  cardNumber, OTP (replace with ***)
- Add request/response body logging in DEBUG mode only 
  (never in production for HIPAA-like compliance)
- Log rotation: keep 30 days of logs, compress older files with gzip
- Export structured log functions: logError, logWarn, logInfo, 
  logAudit, logSecurity with consistent signature
- Performance: use async logging (never block event loop)
src/middleware/audit.middleware.js
text
You are a compliance and security engineer. Build a medical-grade 
audit trail middleware for a Hospital Management System that tracks 
every critical data access and modification.

Requirements:
- Intercept and log ALL write operations (POST, PUT, PATCH, DELETE) 
  on sensitive modules: patients, medicalRecords, billing, 
  prescriptions, labResults, discharge
- Capture for each audit entry:
  {auditId, timestamp, userId, userRole, userName, action, 
  module, resourceId, previousValue, newValue, ipAddress, 
  userAgent, requestId, endpoint, success}
- Implement response interception to capture what was actually 
  changed (diff between before/after DB state)
- Sanitize audit data: mask sensitive fields 
  (SSN, aadhaar, payment details) before storing
- Store audit logs in dedicated DB table (never deleted, 
  append-only) + simultaneously write to separate 
  audit.log file via Winston
- Add read audit for sensitive operations: viewing patient 
  medical history, accessing billing info, downloading 
  lab reports (log even GET requests for these)
- Implement audit trail query API (for admin): 
  filter by user, module, date range, action type
- Compliance note comments: mark HIPAA/DISHA relevant 
  sections for future compliance review
- Performance: write audit logs asynchronously 
  (never block the main request)
- Add tamper detection: hash each audit entry 
  (SHA-256 of content) and store hash for integrity verification
🔐 AUTH MODULE
src/modules/auth/auth.controller.js
text
You are a senior backend engineer. Build the authentication controller 
for a Hospital Management System with enterprise-level security 
in Express.js and Node.js.

Implement these controller methods (thin controllers — delegate to service):

1. register(req, res, next)
   - Admin-only registration of new users with role assignment
   - Validate uniqueness of email + phone in service layer
   
2. login(req, res, next)
   - Credential-based login with role-specific response
   - Return: accessToken (15min), refreshToken (httpOnly cookie, 7d), 
     user profile, permissions list

3. logout(req, res, next)
   - Blacklist current accessToken in Redis
   - Clear refreshToken cookie
   - Log logout event

4. refreshToken(req, res, next)
   - Validate refreshToken from httpOnly cookie
   - Issue new accessToken without re-login

5. forgotPassword(req, res, next)
   - Generate OTP + reset token, send via email
   - Rate-limited: max 3 attempts per email per hour

6. verifyOTP(req, res, next)
   - Validate OTP (6-digit, 10min TTL in Redis)

7. resetPassword(req, res, next)
   - Validate reset token + new password complexity
   - Invalidate all existing sessions on reset

8. changePassword(req, res, next)
   - Authenticated user password change
   - Verify old password before accepting new

9. getMe(req, res, next)
   - Return current user profile with permissions

10. updateProfile(req, res, next)
    - Update non-sensitive profile fields

Requirements:
- All methods use try/catch delegating to next(error)
- Consistent response format via response.util.js
- No business logic in controller — pure HTTP layer
src/modules/auth/auth.service.js
text
You are a backend security architect. Build the complete authentication 
service layer for a Hospital Management System with all business logic.

Implement these service functions:

registerUser(userData, adminId):
- Validate email/phone uniqueness across users table
- Hash password with bcrypt (cost factor: 12)
- Auto-generate employee ID based on role prefix 
  (DR-001, NR-001, ST-001, PT-001)
- Send welcome email with temporary password
- Create audit log entry

loginUser(email, password, deviceInfo):
- Find user by email with role details
- Check isActive flag, lockout status
- Verify password with bcrypt.compare
- Implement account lockout: 5 failed attempts → lock 30min 
  (counter in Redis)
- Reset failed attempt counter on success
- Generate RS256 JWT accessToken (payload: id, role, 
  departmentId, permissions) exp: 15min
- Generate refreshToken (UUID), store hash in DB/Redis 
  (not raw), set httpOnly cookie
- Return sanitized user profile + token
- Log successful login with IP, device, timestamp

refreshAccessToken(refreshToken):
- Validate refresh token exists and not expired
- Check it's not revoked
- Issue new access token

logoutUser(userId, accessToken):
- Add current JWT to Redis blacklist with remaining TTL
- Revoke refresh token from DB
- Log logout event

generateAndSendOTP(email):
- Create 6-digit OTP, hash with SHA-256, store in Redis 
  with 10min TTL
- Send via email and SMS simultaneously
- Max 3 OTPs per email per hour (rate check in Redis)

verifyOTP(email, otp):
- Compare hashed OTP from Redis
- Single use — delete after successful verification

resetPassword(token, newPassword):
- Validate reset token from Redis
- Enforce password policy: min 8 chars, uppercase, number, special char
- bcrypt hash new password
- Revoke ALL refresh tokens for this user (force re-login everywhere)
- Send password change confirmation email

Requirements:
- All DB operations use transactions where multiple tables involved
- Never return raw passwords or tokens from service
- Comprehensive error throwing with custom AppError classes
src/modules/auth/auth.routes.js
text
You are a backend API design engineer. Build the secure, well-structured 
authentication routes for a Hospital Management System Express.js API.

Requirements:
- Mount all routes under /api/v1/auth
- Apply route-specific middleware correctly:

  POST   /register          → adminLimiter, authenticate, 
                              authorize('users:create'), 
                              validate(registerSchema), authController.register
                              
  POST   /login             → authLimiter, validate(loginSchema), 
                              authController.login
                              
  POST   /logout            → authenticate, authController.logout

  POST   /refresh-token     → authController.refreshToken

  POST   /forgot-password   → passwordResetLimiter, 
                              validate(forgotPasswordSchema), 
                              authController.forgotPassword

  POST   /verify-otp        → validate(verifyOTPSchema), 
                              authController.verifyOTP

  POST   /reset-password    → validate(resetPasswordSchema), 
                              authController.resetPassword

  PUT    /change-password   → authenticate, 
                              validate(changePasswordSchema), 
                              authController.changePassword

  GET    /me                → authenticate, authController.getMe

  PUT    /profile           → authenticate, 
                              validate(updateProfileSchema), 
                              authController.updateProfile

- Add JSDoc comments above each route explaining purpose, 
  required roles, request body, response
- Apply helmet, cors at router level if route-specific config needed
- Export router using express.Router()
- Group routes logically with section comments
src/modules/auth/auth.validator.js
text
You are a data integrity engineer. Build comprehensive Joi validation 
schemas for all authentication endpoints in a Hospital Management System.

Create and export these schemas:

registerSchema:
- name: string, min:2, max:50, trim, required
- email: valid email, lowercase, required
- phone: custom phone validator (with country code), required
- role: enum of all 10 hospital roles, required
- departmentId: uuid, required for clinical roles
- gender: enum [male, female, other], required
- dateOfBirth: date, max today, min 18 years ago (staff must be adult)
- employeeId: optional (auto-generated if not provided)

loginSchema:
- email: valid email, required
- password: string, required (no complexity check — that's registration)
- deviceInfo: object {deviceType, browser, os} optional

forgotPasswordSchema:
- email: valid email, required

verifyOTPSchema:
- email: valid email, required
- otp: string, exactly 6 digits, required

resetPasswordSchema:
- token: string, required
- password: strong password (min 8, uppercase, number, special char)
- confirmPassword: must match password

changePasswordSchema:
- currentPassword: required
- newPassword: strong, different from current
- confirmPassword: must match

updateProfileSchema:
- name: optional, min:2, max:50
- phone: optional, valid format
- address: optional object
- profilePhoto: optional URL string
- emergencyContact: object {name, phone, relation} optional

Requirements:
- Use .options({abortEarly: false}) for all schemas 
  (collect all errors)
- Add .stripUnknown(true) to prevent extra fields
- Custom error messages in plain English (not Joi defaults)
- Export schemas as named exports
👤 PATIENT MODULE
src/modules/patients/patient.service.js
text
You are a healthcare software engineer. Build the complete patient 
management service layer for a Hospital Management System with 
advanced medical data handling.

Implement these service functions with full business logic:

registerPatient(patientData, registeredBy):
- Auto-generate unique Patient ID (format: PAT-YYYY-XXXXXX)
- Generate QR code for patient card using qrcode package
- Create patient record with: personal info, contact, 
  emergency contact, blood group, allergies, 
  chronic conditions, insurance details
- Upload profile photo to S3 via s3.util.js
- Create initial medical record shell
- Send welcome SMS + Email with patient ID and QR code
- Log registration event in audit trail
- Return full patient profile with generated IDs

getPatientById(patientId, requestingUser):
- Role-based data filtering: 
  DOCTOR → full medical data
  NURSE → vitals + care notes
  RECEPTIONIST → basic info + appointment
  PATIENT → own data only (no internal notes)
- Cache patient profile in Redis for 5 min
- Log data access in audit trail

updatePatient(patientId, updateData, updatedBy):
- Allow partial updates with strict field whitelist
- Track changed fields (oldValue → newValue) for audit
- Invalidate patient cache on update

getPatientsByDoctor(doctorId, filters):
- Return paginated list of doctor's assigned patients
- Filter by: date, status, diagnosis

getPatientVitals(patientId, dateRange):
- Return time-series vitals data for chart display
- Include: BP, pulse, temperature, SpO2, weight, height

admitPatient(patientId, admissionData):
- Create IPD admission record
- Assign ward, room, bed (check availability)
- Assign primary doctor + nursing team
- Generate admission number (format: IPD-YYYY-XXXXX)
- Update bed/room status to occupied

dischargePatient(patientId, dischargeData):
- Validate all bills are cleared (or insurance approved)
- Release bed/room/ward
- Generate discharge summary
- Schedule follow-up appointment if needed
- Send discharge instructions via email

searchPatients(query, filters, pagination):
- Full-text search on name, patientId, phone, email
- Filter by: bloodGroup, doctor, ward, status, dateRange
- Paginated and sorted response

Requirements:
- All sensitive operations wrapped in DB transactions
- Soft delete only (never hard delete patient records)
- All service functions throw specific AppError subclasses
src/modules/patients/patient.controller.js
text
You are a backend API engineer. Build the patient management controller 
for a Hospital Management System with clean, thin controller pattern.

Implement controller methods delegating fully to patient.service.js:

1. registerPatient(req, res, next)
2. getPatientById(req, res, next)
3. updatePatient(req, res, next)
4. deletePatient(req, res, next) — soft delete, admin only
5. listPatients(req, res, next) — with pagination, search, filters
6. searchPatients(req, res, next)
7. getPatientMedicalHistory(req, res, next)
8. getPatientVitals(req, res, next)
9. addPatientVitals(req, res, next)
10. admitPatient(req, res, next)
11. dischargePatient(req, res, next)
12. getPatientAdmissions(req, res, next)
13. getPatientAppointments(req, res, next)
14. getPatientBills(req, res, next)
15. uploadPatientDocument(req, res, next) — uses upload middleware
16. getPatientDocuments(req, res, next)
17. generatePatientQR(req, res, next)
18. transferPatient(req, res, next) — transfer between wards/doctors
19. getPatientStatsByDoctor(req, res, next)
20. exportPatientReport(req, res, next) — PDF via pdf.util.js

Requirements:
- Thin controllers: extract params/body, call service, format response
- Use sendSuccess(res, data, message, statusCode) from response.util.js
- All wrapped in try/catch → next(error)
- Extract pagination params using pagination.util.js
- Log controller entry (debug level) with requestId
- Add JSDoc for each method: @param, @returns, @throws
src/modules/patients/patient.routes.js
text
You are an API architecture engineer. Build comprehensive, 
secure patient management routes for a Hospital Management System.

Mount all routes under /api/v1/patients

Define these routes with proper middleware chains:

Public-facing (authenticated only):
GET    /me                          → patient views own profile
GET    /me/appointments             → patient views own appointments
GET    /me/bills                    → patient views own bills

Staff routes:
POST   /register                    → RECEPTIONIST, ADMIN
GET    /                            → ADMIN, DOCTOR, NURSE, RECEPTIONIST 
                                      (filtered by role in service)
GET    /search                      → all staff roles
GET    /:patientId                  → role-based data (all staff)
PUT    /:patientId                  → ADMIN, RECEPTIONIST
DELETE /:patientId                  → ADMIN only (soft delete)

Medical routes:
GET    /:patientId/medical-history  → DOCTOR, NURSE
GET    /:patientId/vitals           → DOCTOR, NURSE
POST   /:patientId/vitals           → DOCTOR, NURSE
GET    /:patientId/admissions       → DOCTOR, NURSE, ADMIN
POST   /:patientId/admit            → DOCTOR, ADMIN
POST   /:patientId/discharge        → DOCTOR, ADMIN
POST   /:patientId/transfer         → DOCTOR, ADMIN

Documents:
POST   /:patientId/documents        → uploadMedicalDocument middleware
GET    /:patientId/documents        → DOCTOR, NURSE, ADMIN

Reports:
GET    /:patientId/qr               → all staff
GET    /:patientId/report/export    → DOCTOR, ADMIN

Apply: authenticate → authorize(permission) → validate(schema) 
→ controller on every route
Add rate limiting on document upload routes
Add audit middleware on all write operations
src/modules/patients/patient.validator.js
text
You are a healthcare data validation specialist. Build hospital-grade 
Joi validation schemas for all patient module endpoints.

Create and export these schemas:

registerPatientSchema:
- firstName, lastName: required, alpha only, 2-50 chars
- email: valid email, optional (not all patients have email)
- phone: required, valid mobile number
- alternatePhone: optional, valid mobile
- dateOfBirth: required, valid date, cannot be future, max 120 years old
- gender: required, enum [male, female, other, prefer_not_to_say]
- bloodGroup: required, valid blood group
- address: required object {street, city, state, pincode, country}
- emergencyContact: required {name, phone, relation}
- allergies: optional array of strings
- chronicConditions: optional array of strings
- insuranceProvider: optional string
- insurancePolicyNumber: optional string (required if provider given)
- aadhaarNumber: optional, exactly 12 digits (mask in logs)
- profilePhoto: optional, valid URL or handled separately via upload

admitPatientSchema:
- wardId: required uuid
- roomId: required uuid
- bedId: required uuid
- primaryDoctorId: required uuid
- admissionType: required enum [emergency, elective, maternity, 
  trauma, psychiatric]
- admissionReason: required, min:10, max:500
- estimatedStay: required, number, 1-365 days
- insurancePreAuth: optional boolean

addVitalsSchema:
- bloodPressureSystolic: number, 60-250
- bloodPressureDiastolic: number, 40-150
- pulse: number, 30-220
- temperature: number (Celsius), 34-42
- respiratoryRate: number, 8-40
- oxygenSaturation: number, 70-100
- weight: number kg, 0.5-500
- height: number cm, 30-250
- bloodGlucose: optional number
- notes: optional string, max 500

transferPatientSchema:
- newWardId: required uuid
- newRoomId: required uuid
- newBedId: required uuid
- transferReason: required, min:10
- newPrimaryDoctorId: optional uuid

Requirements:
- Custom error messages for medical context 
  (e.g., "Blood pressure systolic must be between 60-250 mmHg")
- stripUnknown: true on all schemas
- abortEarly: false for complete error collection
👨‍⚕️ DOCTOR MODULE
src/modules/doctors/doctor.service.js
text
You are a healthcare platform engineer. Build a complete doctor 
management service for a Hospital Management System with advanced 
scheduling and availability logic.

Implement these service functions:

createDoctorProfile(doctorData, createdBy):
- Create user account with DOCTOR role first
- Create extended doctor profile: specialization, qualifications 
  (array), experience years, registration number, 
  consultation fee, bio
- Upload profile photo to S3
- Assign department
- Create default weekly schedule template
- Generate doctor ID (format: DR-SPEC-001)
- Send onboarding email with login credentials

getDoctorAvailability(doctorId, date):
- Fetch doctor's schedule for that day (day of week)
- Get all appointments for that date
- Calculate and return available time slots (15-min intervals)
- Mark slots: available | booked | blocked | break
- Cache slot data in Redis (TTL: 5 min, invalidate on new booking)
- Account for doctor leaves/holidays

updateDoctorSchedule(doctorId, scheduleData):
- Set weekly recurring schedule: 
  {day: 'monday', startTime: '09:00', endTime: '13:00', 
   slotDuration: 15, maxPatients: 20}
- Validate no time overlap
- Invalidate cached slots for next 30 days
- Alert admin if schedule conflicts with existing appointments

blockDoctorSlot(doctorId, date, timeRange, reason):
- Block specific time range (lunch, emergency, meeting)
- Update cached availability
- Notify affected appointment patients via email/SMS

getDoctorPatients(doctorId, filters, pagination):
- Get all patients under this doctor
- Filter by: status (active/discharged), date, ward

getDoctorPerformanceStats(doctorId, dateRange):
- Consultations count, avg consultation time
- Patient satisfaction score (if rating system exists)
- Revenue generated, appointments completed vs no-show

getDoctorsByDepartment(departmentId, specialization, filters):
- Return doctors with availability indicator
- Filter by: specialization, available today, accepting new patients

applyDoctorLeave(doctorId, leaveData):
- Create leave record
- Check and notify patients with appointments during leave
- Suggest alternative doctors
- Notify admin for coverage arrangement

Requirements:
- Use DB transactions for schedule changes
- Implement slot locking using Redis to prevent double-booking
- All stat calculations done at service level, not DB queries
src/modules/doctors/doctor.routes.js
text
You are an API design engineer. Build comprehensive doctor management 
routes for a Hospital Management System.

Mount under /api/v1/doctors

Define these route groups:

Admin/HR routes:
POST   /                            → ADMIN, SUPER_ADMIN
GET    /                            → ADMIN, RECEPTIONIST (list all)
PUT    /:doctorId                   → ADMIN
DELETE /:doctorId                   → ADMIN, SUPER_ADMIN (soft delete)
POST   /:doctorId/photo             → ADMIN, DOCTOR (own photo)

Public/Patient-facing (authenticated):
GET    /available                   → all roles
GET    /by-department/:deptId       → all roles
GET    /by-specialization           → all roles
GET    /:doctorId/profile           → all roles
GET    /:doctorId/availability      → all roles (for booking)

Doctor self-management:
GET    /my/profile                  → DOCTOR
PUT    /my/schedule                 → DOCTOR
POST   /my/schedule/block           → DOCTOR
POST   /my/leave                    → DOCTOR
GET    /my/patients                 → DOCTOR
GET    /my/appointments             → DOCTOR
GET    /my/stats                    → DOCTOR

Admin oversight:
GET    /:doctorId/stats             → ADMIN, SUPER_ADMIN
GET    /:doctorId/schedule          → ADMIN, RECEPTIONIST, DOCTOR
PUT    /:doctorId/schedule          → ADMIN, DOCTOR (own only)
GET    /:doctorId/leave-requests    → ADMIN
PUT    /:doctorId/leave/:leaveId    → ADMIN (approve/reject)

Apply full middleware chain on each route:
authenticate → authorize(permission) → validate(schema) → controller
💊 PHARMACY MODULE
src/modules/pharmacy/pharmacy.service.js
text
You are a pharmaceutical systems engineer. Build a complete pharmacy 
management service for a Hospital Management System with inventory 
intelligence and prescription workflow.
Claude Sonnet 4.6
continue this module from 💊 PHARMACY MODULE


Thought Process
expand
💊 PHARMACY MODULE (Continued) + All Remaining Backend Module Prompts
src/modules/pharmacy/pharmacy.service.js
text
You are a pharmaceutical systems engineer. Build a complete pharmacy 
management service for a Hospital Management System with inventory 
intelligence and prescription workflow.

Implement these service functions:

addMedicine(medicineData, addedBy):
- Create medicine record with: name, genericName, brand, 
  category (antibiotic/analgesic/etc), form (tablet/syrup/injection),
  strength, manufacturer, HSN code, GST percentage
- Auto-generate medicine SKU (format: MED-CAT-XXXXX)
- Set reorder level, minimum stock quantity
- Alert if same generic medicine already exists (duplication check)
- Store batch details: batchNumber, manufactureDate, expiryDate, 
  purchasePrice, sellingPrice, quantity
- Upload medicine image to S3 (optional)
- Log inventory creation in audit trail

dispensePrescription(prescriptionId, dispensedBy):
- Fetch prescription with medicine list and quantities
- Validate prescription is: not expired, not already dispensed,
  issued by a registered doctor
- Check drug-drug interaction for all prescribed medicines 
  (use a predefined interaction matrix in DB)
- Check sufficient stock for all items simultaneously 
  (atomic check — avoid race condition with Redis lock)
- Deduct stock FIFO (First In First Out — oldest batch first)
- Create dispensing record with batch details used
- Update prescription status to DISPENSED
- Generate itemized bill and push to billing module
- If any item out of stock: return partial dispensing option 
  with out-of-stock list
- Send patient notification via SMS: "Your medicines are ready"
- Log full dispensing event in audit trail

receivePurchaseOrder(poId, receivedItems, receivedBy):
- Match received items against purchase order
- Create new batch records for each item with expiry dates
- Update stock quantities
- Identify and flag discrepancies between ordered vs received
- Calculate and update average purchase price
- Trigger quality check flag for controlled substances

checkExpiringMedicines(daysAhead):
- Query medicines expiring within daysAhead (default: 90 days)
- Group by: expiring_in_30_days, 60_days, 90_days
- Send automated alerts to pharmacy manager
- Return actionable report with stock value at risk

checkLowStockMedicines():
- Compare currentStock against reorderLevel for all active medicines
- Return priority-sorted list (most critical first)
- Auto-create purchase request if autoReorder flag is set
- Send alert notification to pharmacy manager + inventory team

getMedicineConsumptionReport(dateRange, filters):
- Calculate consumption per medicine per day/week/month
- Calculate consumption value (quantity × average cost)
- Identify fast-moving vs slow-moving medicines
- Return data formatted for chart visualization

searchMedicine(query, filters):
- Full text search on: name, genericName, brand, SKU
- Filter by: category, form, inStock, expiring, supplier
- Return with current stock level, price, availability
- Cache frequently searched terms in Redis

returnMedicine(dispensingId, returnData, returnedBy):
- Validate return within allowed window (default: 24 hours)
- Check medicine condition (unopened/sealed only)
- Restore stock to correct batch
- Create return record and reverse bill entry
- Notify billing module for refund processing

createPrescription(prescriptionData, doctorId):
- Validate doctor license is active
- Validate all medicines exist in system
- Apply drug-allergy check against patient allergy records
- Apply drug-drug interaction check
- Set expiry: 3 days for regular, 1 day for controlled substances
- Generate prescription PDF and upload to S3
- Send patient notification with prescription details

getPharmacyDashboardStats():
- Total inventory value
- Low stock count, expiring soon count
- Today's dispensing count and revenue
- Top 10 medicines by consumption this month
- Pending purchase orders count
- Return all stats in single optimized query

Requirements:
- Use Redis distributed locks during stock deduction 
  to prevent race conditions in concurrent dispensing
- All stock operations within DB transactions (ACID compliance)
- Soft delete medicines (mark inactive, never delete — 
  historical records must be preserved)
- Audit log every stock change: who, what, how much, when, batch
- FIFO stock deduction strictly enforced at query level
- All pricing stored with 2 decimal precision (DECIMAL(10,2))
src/modules/pharmacy/pharmacy.controller.js
text
You are a backend API engineer. Build a clean, thin pharmacy controller 
for a Hospital Management System following single-responsibility principle.

Implement these controller methods:

Medicine Management:
1.  addMedicine(req, res, next)
2.  getMedicineById(req, res, next)
3.  updateMedicine(req, res, next)
4.  deactivateMedicine(req, res, next) — soft delete
5.  listMedicines(req, res, next) — paginated, filtered
6.  searchMedicine(req, res, next)
7.  uploadMedicineImage(req, res, next)

Stock & Inventory:
8.  getMedicineStock(req, res, next)
9.  updateStockManually(req, res, next) — manual adjustment with reason
10. getLowStockAlerts(req, res, next)
11. getExpiringMedicines(req, res, next)
12. receivePurchaseOrder(req, res, next)

Prescription & Dispensing:
13. createPrescription(req, res, next)
14. getPrescriptionById(req, res, next)
15. dispensePrescription(req, res, next)
16. getPrescriptionsByPatient(req, res, next)
17. getPrescriptionsByDoctor(req, res, next)
18. returnMedicine(req, res, next)
19. getPrescriptionPDF(req, res, next) — stream from S3

Batches:
20. getMedicineBatches(req, res, next)
21. addMedicineBatch(req, res, next)

Drug Interaction:
22. checkDrugInteraction(req, res, next) — real-time check before dispensing

Reports:
23. getConsumptionReport(req, res, next)
24. getPharmacyDashboard(req, res, next)
25. exportInventoryReport(req, res, next) — PDF/Excel

Requirements:
- Extract pagination, filters, dateRange from query params cleanly
- Use uploadMedicineImage middleware on route 7
- Stream PDF responses with correct Content-Type and headers
- All wrapped in try/catch → next(error)
- Use sendSuccess from response.util.js consistently
- Add @description JSDoc on every method
src/modules/pharmacy/pharmacy.routes.js
text
You are an API security engineer. Build secure, well-organized 
pharmacy module routes for a Hospital Management System.

Mount under /api/v1/pharmacy

Medicine routes:
POST   /medicines                   → PHARMACIST, ADMIN
GET    /medicines                   → PHARMACIST, DOCTOR, NURSE, ADMIN
GET    /medicines/search            → PHARMACIST, DOCTOR, NURSE
GET    /medicines/low-stock         → PHARMACIST, ADMIN
GET    /medicines/expiring          → PHARMACIST, ADMIN
GET    /medicines/:medicineId       → PHARMACIST, DOCTOR, NURSE, ADMIN
PUT    /medicines/:medicineId       → PHARMACIST, ADMIN
DELETE /medicines/:medicineId       → ADMIN only
POST   /medicines/:medicineId/image → PHARMACIST, ADMIN (upload middleware)
GET    /medicines/:medicineId/batches → PHARMACIST, ADMIN
POST   /medicines/:medicineId/batches → PHARMACIST, ADMIN
POST   /medicines/check-interaction → PHARMACIST, DOCTOR

Stock routes:
PUT    /stock/:medicineId/adjust    → PHARMACIST, ADMIN (manual adjust)
POST   /stock/receive-po            → PHARMACIST, ADMIN

Prescription routes:
POST   /prescriptions               → DOCTOR
GET    /prescriptions/:prescriptionId         → PHARMACIST, DOCTOR, PATIENT (own)
GET    /prescriptions/:prescriptionId/pdf     → PHARMACIST, DOCTOR, PATIENT (own)
GET    /prescriptions/patient/:patientId      → PHARMACIST, DOCTOR, ADMIN
GET    /prescriptions/doctor/:doctorId        → PHARMACIST, ADMIN, DOCTOR (own)
POST   /prescriptions/:prescriptionId/dispense → PHARMACIST
POST   /prescriptions/:prescriptionId/return   → PHARMACIST

Reports:
GET    /reports/consumption         → PHARMACIST, ADMIN
GET    /reports/dashboard           → PHARMACIST, ADMIN
GET    /reports/inventory/export    → ADMIN

Middleware chain on all routes:
authenticate → authorize(permission) → validate(schema) → controller
Apply auditMiddleware on all write routes
Apply uploadMiddleware on image upload route
src/modules/pharmacy/pharmacy.validator.js
text
You are a pharmaceutical data validation engineer. Build strict 
Joi validation schemas for all pharmacy module endpoints.

Create and export these schemas:

addMedicineSchema:
- name: required, string, min:2, max:100
- genericName: required, string, min:2, max:100
- brand: required, string
- category: required, enum [antibiotic, analgesic, antifungal, 
  antiviral, cardiovascular, neurological, gastrointestinal, 
  respiratory, hormonal, vitamin, controlled, other]
- form: required, enum [tablet, capsule, syrup, injection, 
  cream, ointment, drops, inhaler, patch, suppository, powder]
- strength: required, string (e.g., "500mg", "10mg/5ml")
- manufacturer: required
- hsnCode: required, 8-digit string
- gstPercentage: required, number, valid GST slab [0, 5, 12, 18, 28]
- reorderLevel: required, integer, min:0
- minimumStock: required, integer, min:0
- isControlled: boolean, default false
- requiresPrescription: boolean, default true

addBatchSchema:
- batchNumber: required, string
- manufactureDate: required, date, must be past
- expiryDate: required, date, must be future, 
  must be after manufactureDate
- purchasePrice: required, number, min:0, max 2 decimal places
- sellingPrice: required, number, min:purchasePrice
- quantity: required, integer, min:1
- supplierId: required, uuid
- purchaseOrderId: optional, uuid

createPrescriptionSchema:
- patientId: required, uuid
- medicines: required, array, min:1, max:20, each item:
  {medicineId: uuid required, 
   dosage: string required (e.g., "1 tablet"), 
   frequency: enum [once_daily, twice_daily, thrice_daily, 
     four_times_daily, every_6_hours, every_8_hours, 
     as_needed, before_meals, after_meals],
   duration: integer required (days) min:1 max:365,
   quantity: integer required min:1,
   instructions: string optional max:200}
- diagnosis: required, string min:5 max:500
- notes: optional, string, max:1000
- isUrgent: boolean, default false

dispensePrescriptionSchema:
- prescriptionId: required, uuid
- patientPresent: required, boolean
- collectedBy: optional string (if not patient collecting)
- paymentMode: required, enum [cash, card, insurance, upi]
- notes: optional string max:200

stockAdjustmentSchema:
- medicineId: required uuid
- adjustmentType: required enum [addition, deduction, damaged, 
  expired_removal, audit_correction]
- quantity: required integer min:1
- reason: required string min:10 max:500
- batchNumber: optional string

Requirements:
- Custom error messages with pharmaceutical context
- abortEarly: false, stripUnknown: true on all schemas
- Validate that expiryDate is at least 30 days in future 
  when adding new batch (no short-expiry stock intake)
💰 BILLING MODULE
src/modules/billing/billing.service.js
text
You are a healthcare billing systems architect. Build a comprehensive 
billing and financial service for a Hospital Management System with 
GST compliance, insurance integration, and payment processing.

Implement these service functions:

generateBill(patientId, admissionId, billData, generatedBy):
- Consolidate all billable items for patient:
  * Consultation fees (per doctor visit)
  * Room/Ward charges (per day × rate)
  * Nursing charges
  * Medicine charges (from pharmacy module)
  * Lab test charges (from lab module)
  * OT charges if applicable
  * Procedure charges
  * Ambulance charges
  * Miscellaneous charges
- Apply GST per item category (5%, 12%, 18% per HSN/SAC code)
- Apply insurance coverage if patient has active policy 
  (fetch pre-authorization details)
- Apply discounts: concession, employee discount, 
  hospital scheme discount (with approval flags)
- Calculate: subtotal, tax breakdown, discount, insurance coverage, 
  net payable amount
- Auto-generate bill number (format: BILL-YYYY-MM-XXXXXX)
- Set status: DRAFT (review before finalizing)
- Store line items with category, description, quantity, 
  unit price, tax, total
- Return full bill with all breakdowns

finalizeBill(billId, finalizedBy):
- Validate bill is in DRAFT status
- Lock bill from further modifications
- Generate PDF invoice using pdf.util.js
- Upload PDF to S3 (invoices bucket)
- Send bill to patient email with PDF attachment
- Update status to PENDING_PAYMENT
- Notify insurance if coverage applies

processPayment(billId, paymentData, processedBy):
- Validate bill amount and status
- Support payment modes:
  CASH → direct record with cashier ID
  CARD → integrate Razorpay/Stripe payment gateway
  UPI → Razorpay UPI integration
  INSURANCE → mark as insurance_processing with claim reference
  MIXED → split payment (partial cash + partial insurance)
- Create payment transaction record with: 
  paymentId, gateway transactionId, mode, amount, 
  timestamp, status, processedBy
- On successful payment: update bill status to PAID
- Generate payment receipt PDF, upload to S3
- Send receipt via SMS + Email to patient
- Log to financial audit trail

processRefund(paymentId, refundData, approvedBy):
- Validate original payment exists and is eligible for refund
- Requires ADMIN approval for amounts > threshold
- Initiate gateway refund via Razorpay/Stripe API
- Create refund record linked to original payment
- Update bill status to PARTIALLY_REFUNDED or REFUNDED
- Send refund confirmation to patient
- Log to financial audit trail

getOutstandingBills(filters, pagination):
- Query all PENDING_PAYMENT + PARTIALLY_PAID bills
- Filter by: patientId, doctorId, dateRange, amountRange
- Calculate total outstanding amount
- Flag bills overdue by more than 30 days

generateDailyCashReport(date):
- Total collections by payment mode
- Total refunds
- Net revenue
- Pending payments count and value
- Breakdown by department/doctor

getRevenueAnalytics(dateRange, groupBy):
- Revenue by: department, doctor, service type
- GST collected breakdown
- Insurance vs cash ratio
- Month-over-month growth
- Average bill value

createInsuranceClaim(billId, insuranceData, submittedBy):
- Generate TPA claim document
- Attach required documents from S3
- Submit to insurance portal (placeholder integration)
- Track claim status: submitted, under_review, approved, 
  partially_approved, rejected

Requirements:
- All financial calculations use decimal.js to avoid 
  floating point precision errors
- Payment processing wrapped in DB transactions with 
  rollback on gateway failure
- Bill line items immutable after finalization
- Full audit trail for every financial transaction
- Currency stored as integer paise (divide by 100 for display)
- GST breakdowns: CGST + SGST for intra-state, 
  IGST for inter-state
src/modules/billing/billing.controller.js
text
You are a backend API engineer. Build a comprehensive billing controller 
for a Hospital Management System handling financial operations.

Implement these controller methods:

Bill Management:
1.  generateBill(req, res, next)
2.  getBillById(req, res, next)
3.  updateBillDraft(req, res, next) — only if DRAFT status
4.  finalizeBill(req, res, next)
5.  cancelBill(req, res, next) — admin only with reason
6.  listBills(req, res, next) — paginated with filters
7.  getBillsByPatient(req, res, next)
8.  getBillPDF(req, res, next) — stream from S3
9.  addBillLineItem(req, res, next)
10. removeBillLineItem(req, res, next)

Payment:
11. processPayment(req, res, next)
12. getPaymentById(req, res, next)
13. getPaymentsByBill(req, res, next)
14. processRefund(req, res, next)
15. getRefundStatus(req, res, next)
16. getReceiptPDF(req, res, next) — stream from S3
17. verifyGatewayPayment(req, res, next) — webhook/callback handler

Insurance:
18. createInsuranceClaim(req, res, next)
19. getClaimStatus(req, res, next)
20. updateClaimStatus(req, res, next) — admin/accountant
21. getInsuranceCoverage(req, res, next)

Reports (Accountant/Admin):
22. getOutstandingBills(req, res, next)
23. getDailyCashReport(req, res, next)
24. getRevenueAnalytics(req, res, next)
25. exportFinancialReport(req, res, next) — Excel/PDF

Requirements:
- Webhook handler (verifyGatewayPayment) must validate 
  Razorpay/Stripe signature before processing
- PDF streaming with proper Content-Disposition headers
- Extract date ranges from query with dateTime.util.js
- All financial amounts validated as positive numbers
- Sensitive financial logs at appropriate level only
- Role check for refund approval inline before service call
src/modules/billing/billing.routes.js
text
You are a financial API security engineer. Build secure billing routes 
for a Hospital Management System with strict role-based access.

Mount under /api/v1/billing

Bill routes:
POST   /bills                       → ACCOUNTANT, ADMIN (generate)
GET    /bills                       → ACCOUNTANT, ADMIN
GET    /bills/outstanding           → ACCOUNTANT, ADMIN
GET    /bills/:billId               → ACCOUNTANT, ADMIN, PATIENT (own)
GET    /bills/:billId/pdf           → ACCOUNTANT, ADMIN, PATIENT (own)
PUT    /bills/:billId               → ACCOUNTANT, ADMIN (draft only)
POST   /bills/:billId/finalize      → ACCOUNTANT, ADMIN
DELETE /bills/:billId               → ADMIN only
POST   /bills/:billId/line-items    → ACCOUNTANT, ADMIN
DELETE /bills/:billId/line-items/:itemId → ACCOUNTANT, ADMIN
GET    /bills/patient/:patientId    → ACCOUNTANT, ADMIN, DOCTOR

Payment routes:
POST   /payments                    → ACCOUNTANT, RECEPTIONIST
GET    /payments/:paymentId         → ACCOUNTANT, ADMIN, PATIENT (own)
GET    /payments/:paymentId/receipt → ACCOUNTANT, ADMIN, PATIENT (own)
POST   /payments/:paymentId/refund  → ADMIN (with approval)
GET    /payments/bill/:billId       → ACCOUNTANT, ADMIN

Webhook (no auth — signature verification instead):
POST   /payments/webhook/razorpay   → razorpayWebhookValidator middleware
POST   /payments/webhook/stripe     → stripeWebhookValidator middleware

Insurance:
POST   /insurance/claims            → ACCOUNTANT, ADMIN
GET    /insurance/claims/:claimId   → ACCOUNTANT, ADMIN
PUT    /insurance/claims/:claimId   → ACCOUNTANT, ADMIN
GET    /insurance/coverage/:patientId → ACCOUNTANT, ADMIN, DOCTOR

Reports:
GET    /reports/daily               → ACCOUNTANT, ADMIN
GET    /reports/revenue             → ADMIN, SUPER_ADMIN
GET    /reports/export              → ADMIN, SUPER_ADMIN

Note: Webhook routes bypass authenticate middleware but have 
custom signature validation middleware instead
Apply auditMiddleware on all write and payment routes
src/modules/billing/billing.validator.js
text
You are a financial data validation specialist. Build precise 
Joi validation schemas for all billing module endpoints.

Create and export these schemas:

generateBillSchema:
- patientId: required uuid
- admissionId: optional uuid (for IPD), required for inpatient billing
- billType: required enum [OPD, IPD, EMERGENCY, DAY_CARE, 
  PHARMACY_ONLY, LAB_ONLY]
- lineItems: optional array (can be empty, items added later):
  each item: {
    category: enum [consultation, room_charge, nursing, 
      medicine, lab, procedure, ot, ambulance, misc] required,
    description: string required min:3 max:200,
    quantity: number required min:0.5,
    unitPrice: number required min:0 (paise — integer),
    hsnSacCode: string optional,
    gstPercentage: enum [0, 5, 12, 18, 28] required,
    discountPercentage: number min:0 max:100 default:0
  }
- discountType: enum [none, percentage, fixed] default none
- discountValue: number min:0, required if discountType != none
- discountReason: string min:10, required if discountValue > 0
- insuranceClaimId: optional uuid
- notes: optional string max:500

processPaymentSchema:
- billId: required uuid
- amount: required integer min:1 (in paise)
- paymentMode: required enum [cash, card, upi, netbanking, 
  insurance, cheque, mixed]
- gatewayOrderId: required if mode is card/upi/netbanking
- gatewayPaymentId: required if mode is card/upi/netbanking
- gatewaySignature: required if mode is card/upi/netbanking
- splitPayments: array, required if mode is mixed:
  [{mode: enum, amount: integer}] 
  sum of splitPayments.amount must equal amount
- notes: optional string max:200
- cashierId: required for cash payments (from req.user.id)

refundSchema:
- paymentId: required uuid
- refundAmount: required integer min:1
- reason: required string min:10 max:500
- refundMode: required enum [original_method, cash, bank_transfer]
- bankDetails: object, required if mode is bank_transfer:
  {accountNumber, ifscCode, accountHolderName}
- approvedBy: auto from req.user.id

revenueQuerySchema (query params):
- startDate: required valid date
- endDate: required valid date, must be after startDate, 
  max range 366 days
- groupBy: enum [day, week, month, doctor, department, service]
- departmentId: optional uuid
- doctorId: optional uuid
- paymentMode: optional enum

Requirements:
- All monetary amounts validated as positive integers (paise)
- Date range validation: endDate cannot be before startDate
- If discountValue > 20% of total, flag for admin approval 
  (validation hint in response)
- abortEarly: false, stripUnknown: true
🧪 LABORATORY MODULE
src/modules/laboratory/lab.service.js
text
You are a medical laboratory systems engineer. Build a complete 
lab management service for a Hospital Management System.

Implement these service functions:

createLabTestOrder(orderData, orderedBy):
- Validate doctor has privileges to order specific test types
- Create test order with: patientId, doctorId, tests array,
  urgency (routine/urgent/stat), clinical notes, sample type
- Auto-generate order number (LAB-YYYY-XXXXXX)
- Calculate total cost and add to patient bill (draft)
- Assign to available lab technician based on workload/shift
- If STAT urgency: send immediate alert to lab via Socket.io
- Return order with estimated result time per test

collectSample(orderId, sampleData, collectedBy):
- Record sample collection: sampleId, collectedAt, 
  collectedBy, sampleType, volume, condition (good/hemolyzed/etc)
- Auto-generate barcode/sample ID
- Update order status to SAMPLE_COLLECTED
- Notify lab technician for processing
- Handle multi-sample orders (different samples for different tests)

enterLabResults(orderId, results, enteredBy):
- Validate technician is assigned to this order
- Enter results per test with value and unit
- Auto-flag CRITICAL/HIGH/LOW/NORMAL based on reference ranges 
  stored per test + patient age/gender adjusted ranges
- For CRITICAL values: immediately alert ordering doctor 
  via Socket.io + SMS (panic value protocol)
- Mark result as PENDING_VERIFICATION (needs doctor/senior review)

verifyLabResults(orderId, verifiedBy):
- Senior lab technician/pathologist review
- Digitally sign results (record verifierId + timestamp)
- Update status to VERIFIED
- Notify patient and doctor: "Lab results ready"
- Generate lab report PDF using pdf.util.js (formatted with 
  hospital header, reference ranges, flagged values highlighted)
- Upload PDF to S3 (lab-reports bucket)
- Auto-add result cost to patient bill

getLabResults(orderId, requestingUser):
- Role-based access: doctor gets full clinical result, 
  patient gets patient-friendly version
- Return with reference ranges and clinical interpretation hints
- Log every access to audit trail (HIPAA-like compliance)

getLabTestCatalog(filters):
- All available tests with: name, code, cost, 
  sample type, turnaround time, department
- Filter by: category, sample type, department, price range
- Cache catalog in Redis (TTL: 1 hour)

getLabWorkload(date, technicianId):
- Pending orders, in-process orders, completed today
- Average turnaround time
- STAT orders pending (prioritized list)

addTestToMaster(testData, addedBy):
- Add new lab test to catalog
- Set reference ranges per: gender, age group
- Set critical value thresholds (panic values)
- Set sample type, volume required, equipment needed
- Set TAT (Turnaround time) in hours

getLabDashboardStats():
- Today's total orders, pending, completed, critical
- Average TAT by test category
- Sample rejection rate
- Top 10 ordered tests this month

Requirements:
- Critical value alerts must be guaranteed delivery 
  (retry logic if doctor notification fails)
- Results immutable after verification (no edits — addendum only)
- All result values stored with original unit + SI unit conversion
- Reference ranges stored per test per demographic group
src/modules/laboratory/lab.routes.js
text
You are an API design engineer. Build comprehensive laboratory 
module routes for a Hospital Management System.

Mount under /api/v1/lab

Test Master (Admin/Lab routes):
POST   /tests                       → LAB_TECHNICIAN, ADMIN
GET    /tests                       → all authenticated roles
GET    /tests/catalog               → all authenticated roles
GET    /tests/:testId               → all authenticated roles
PUT    /tests/:testId               → LAB_TECHNICIAN, ADMIN
DELETE /tests/:testId               → ADMIN
POST   /tests/:testId/reference-ranges → LAB_TECHNICIAN, ADMIN

Orders:
POST   /orders                      → DOCTOR
GET    /orders                      → LAB_TECHNICIAN, DOCTOR, ADMIN
GET    /orders/workload             → LAB_TECHNICIAN, ADMIN
GET    /orders/:orderId             → LAB_TECHNICIAN, DOCTOR, PATIENT (own)
PUT    /orders/:orderId/assign      → LAB_TECHNICIAN, ADMIN
POST   /orders/:orderId/cancel      → DOCTOR, ADMIN
GET    /orders/patient/:patientId   → DOCTOR, LAB_TECHNICIAN, ADMIN

Sample Collection:
POST   /orders/:orderId/sample      → LAB_TECHNICIAN
PUT    /orders/:orderId/sample      → LAB_TECHNICIAN (update condition)
POST   /orders/:orderId/sample/reject → LAB_TECHNICIAN (with reason)

Results:
POST   /orders/:orderId/results     → LAB_TECHNICIAN
PUT    /orders/:orderId/results     → LAB_TECHNICIAN (before verify)
POST   /orders/:orderId/verify      → PATHOLOGIST, ADMIN
GET    /orders/:orderId/results     → DOCTOR, LAB_TECHNICIAN, PATIENT (own)
GET    /orders/:orderId/results/pdf → DOCTOR, LAB_TECHNICIAN, PATIENT (own)
POST   /orders/:orderId/addendum    → PATHOLOGIST (post-verification note)

Dashboard:
GET    /dashboard                   → LAB_TECHNICIAN, ADMIN
GET    /reports/tat                 → LAB_TECHNICIAN, ADMIN
GET    /reports/workload            → LAB_TECHNICIAN, ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on results entry and verification routes
🛏️ WARD & BED MANAGEMENT MODULE
src/modules/wards/ward.service.js
text
You are a hospital operations systems engineer. Build a complete 
ward and bed management service for a Hospital Management System.

Implement these service functions:

createWard(wardData, createdBy):
- Create ward with: name, wardType (general/ICU/NICU/PICU/
  maternity/surgical/orthopedic/pediatric/psychiatric/oncology),
  floor, totalBeds, chargePerDay, facilities list
- Auto-generate ward code (ICU-01, GEN-03, etc.)
- Create initial bed records for totalBeds count
- Assign head nurse to ward

getBedAvailability(wardId, dateTime):
- Return real-time bed status: available, occupied, reserved, 
  under_maintenance, cleaning
- Include patient name (if occupied) for ward staff
- Cache in Redis with very short TTL (30 seconds — high frequency)
- Return ward-level stats: occupancy rate, available count

allocateBed(patientId, wardId, bedId, doctorId, allocatedBy):
- Check bed is available (use Redis lock to prevent race condition)
- Create bed allocation record
- Update bed status to OCCUPIED
- Update patient admission record
- Notify ward nurse via Socket.io
- Auto-calculate expected room charges and add to bill
- Release lock after successful allocation

releaseBed(bedId, releasedBy, reason):
- Validate patient has been discharged or transferred
- Mark bed as CLEANING (not immediately available)
- Schedule bed to become AVAILABLE after cleaning time 
  (default: 2 hours — configurable per ward)
- Use node-cron or Bull job to auto-update status after cleaning
- Notify housekeeping team via notification service
- Update bed history record

transferPatient(patientId, fromBedId, toBedId, reason, transferredBy):
- Validate target bed is available
- Atomic operation: release old bed + allocate new bed in transaction
- Update billing (charge rate may change between wards)
- Notify: new ward nurse, old ward nurse, attending doctor
- Create transfer record with reason and timestamps

getWardOccupancyReport(wardId, dateRange):
- Occupancy rate per day (filled_beds / total_beds × 100)
- Average length of stay
- Most common diagnosis in ward
- Bed turnover rate

markBedMaintenance(bedId, maintenanceData, markedBy):
- Mark bed as under_maintenance with expected return date
- Notify ward manager
- Update availability count

getHospitalOccupancyDashboard():
- All wards with: total beds, occupied, available, 
  maintenance, cleaning counts
- Overall hospital occupancy rate
- ICU/critical beds specific dashboard
- Trend: occupancy last 7 days

Requirements:
- Redis locks mandatory for bed allocation (max lock: 10 seconds)
- Bed state machine: available → reserved → occupied → 
  cleaning → available | maintenance → available
- All state transitions logged with actor and timestamp
- Alert admin when any ward reaches 90% occupancy
- Real-time ward status updates via Socket.io to ward displays
src/modules/wards/ward.routes.js
text
You are an API engineer. Build ward and bed management routes 
for a Hospital Management System.

Mount under /api/v1/wards

Ward routes:
POST   /                            → ADMIN
GET    /                            → all authenticated staff
GET    /occupancy-dashboard         → ADMIN, NURSE, DOCTOR
GET    /:wardId                     → all authenticated staff
PUT    /:wardId                     → ADMIN
DELETE /:wardId                     → ADMIN
GET    /:wardId/occupancy-report    → ADMIN, NURSE

Bed routes:
GET    /:wardId/beds                → all authenticated staff
GET    /:wardId/beds/availability   → all authenticated staff
POST   /:wardId/beds                → ADMIN (add bed)
PUT    /:wardId/beds/:bedId         → ADMIN
GET    /:wardId/beds/:bedId         → all authenticated staff
POST   /:wardId/beds/:bedId/allocate   → DOCTOR, ADMIN
POST   /:wardId/beds/:bedId/release    → DOCTOR, NURSE, ADMIN
POST   /:wardId/beds/:bedId/transfer   → DOCTOR, ADMIN
POST   /:wardId/beds/:bedId/maintenance → ADMIN
POST   /:wardId/beds/:bedId/cleaning-done → NURSE, ADMIN

Nurse assignment:
POST   /:wardId/assign-nurse        → ADMIN
GET    /:wardId/nurses              → ADMIN, NURSE

Apply: authenticate → authorize → validate → controller
High-frequency availability endpoint: 
  apply aggressive caching headers (Cache-Control: no-cache, 
  rely on Redis not HTTP cache for real-time data)
🚨 EMERGENCY MODULE
src/modules/emergency/emergency.service.js
text
You are a critical care systems engineer. Build an emergency 
department management service for a Hospital Management System 
with life-critical reliability requirements.

Implement these service functions:

registerEmergencyPatient(patientData, registeredBy):
- Fast registration: minimal required fields 
  (name optional for unknown patients — use "Unknown Male/Female")
- Auto-generate Emergency ID (ER-YYYYMMDD-XXX)
- Assign triage level immediately (P1-Critical/P2-Urgent/
  P3-Less Urgent/P4-Minor)
- Alert ER duty doctor immediately via Socket.io + SMS
- Auto-allocate emergency bed based on triage level
- Start treatment timer (time from arrival to first treatment)
- Broadcast to emergency team room on Socket.io
- If P1: alert all on-call doctors simultaneously

triagePatient(emergencyId, triageData, triageBy):
- Update triage level with clinical findings
- Vital signs recording: BP, pulse, temp, SpO2, GCS score, 
  pain score (0-10)
- Chief complaint, mechanism of injury
- Allergies check (if patient identified)
- Drug/alcohol screening flag
- Calculate severity score (NEWS2 scoring system)
- Escalate to senior if NEWS2 ≥ 7 (high risk)
- Set monitoring frequency based on triage (P1: 15min, 
  P2: 30min, P3: 1hr)

escalateEmergency(emergencyId, escalationData, escalatedBy):
- Alert additional team members (specialist consultation)
- Create escalation record with reason
- Notify via Socket.io emergency room + SMS to specialist
- Log response time of each team member
- Trigger code protocol if needed (Code Blue/Red/Pink)

activateCodeProtocol(emergencyId, codeType, activatedBy):
- CODE_BLUE: Cardiac arrest → alert crash team immediately
- CODE_RED: Fire/Disaster → alert all staff
- CODE_PINK: Infant abduction → lock exits
- Broadcast via Socket.io to ALL connected staff (emergency namespace)
- Send mass SMS to all on-duty staff
- Log activation time, responders, response time

admitFromEmergency(emergencyId, admissionData):
- Convert ER visit to IPD admission
- Carry over all triage and treatment notes
- Allocate ward bed prioritized by triage level
- Transfer complete ER documentation to patient record

dischargeFromEmergency(emergencyId, dischargeData):
- Document disposition: discharged, transferred, admitted, 
  left_without_treatment, deceased
- Generate ER discharge summary
- Follow-up instructions if discharged
- Death documentation workflow if deceased
- Calculate total ER time (arrival to disposition)

getERDashboard():
- Real-time: current patients by triage level
- Beds available in ER
- Average wait time by triage level
- Pending lab and radiology results
- Active code protocols
- On-duty staff roster

Requirements:
- ER endpoints have NO rate limiting (EMERGENCY_LIMITER exemption)
- All ER notifications are HIGH PRIORITY in queue (jump queue)
- Socket.io events go to /emergency namespace with room: 'er-floor'
- Response time SLA monitoring: P1 < 5min, P2 < 15min alert
- Immutable audit trail — every ER action timestamped to millisecond
🩸 BLOOD BANK MODULE
src/modules/blood-bank/bloodBank.service.js
text
You are a hematology systems engineer. Build a complete blood bank 
management service for a Hospital Management System.

Implement these service functions:

addBloodUnit(bloodUnitData, addedBy):
- Register blood unit: bloodGroup (ABO+Rh), componentType 
  (whole_blood/RBC/plasma/platelets/cryoprecipitate/FFP),
  donorId or external source, bagNumber, collectionDate, 
  expiryDate (auto-calculated by component type)
- Validate: bag number uniqueness, not expired, sterile test passed
- Auto-calculate expiry: WB-35days, RBC-42days, 
  Platelets-5days, FFP-1year, Cryo-1year
- Generate unit barcode
- Quarantine period: 72 hours from collection before available
- Alert if stock of any blood group falls below minimum level

requestBloodUnit(requestData, requestedBy):
- Create blood request: patientId, bloodGroup, component, 
  units required, urgency, clinical indication
- Cross-matching check flag (required for RBC always)
- Check compatibility: ABO + Rh compatibility matrix
- Check available stock and reserve units (soft reservation)
- If insufficient stock: trigger emergency donor search + 
  notify blood bank officer
- For massive transfusion protocol (MTP): special workflow

issueBood(requestId, issuedBy):
- Complete cross-match check before issue
- Hard allocate units to patient
- Record: unit barcodes issued, issued to (ward/OT/ER)
- Update inventory
- Generate issue slip with all unit details
- Cannot un-issue without return workflow

returnBloodUnit(issueId, returnData, returnedBy):
- Only accept return within 30 minutes (cold chain break risk)
- Check: bag intact, not opened, temperature maintained
- If acceptable: restore to available inventory
- If compromised: discard with documentation

registerDonor(donorData):
- Create donor profile with complete medical history
- Eligibility check: age (18-65), weight (>45kg), 
  no recent illness, no high-risk behavior, hemoglobin level
- Last donation date check (56 days gap for whole blood)
- Blood group and antibody screening record
- Schedule next eligible donation date

getDonorHistory(donorId):
- All donations with units, dates, components
- Adverse reactions during/after donation
- Deferral history with reasons

getBloodBankInventory(filters):
- Stock by blood group and component type
- Expiring in 24/48/72 hours alerts (CRITICAL for platelets)
- Total inventory value
- Last updated timestamp
- Cache with 1-minute TTL

getCompatibilityMatrix():
- Return ABO + Rh compatibility for transfusion
- Emergency O-negative availability for unknown blood group

Requirements:
- Platelets have 5-day shelf life — hourly expiry check via scheduler
- Critical stock alerts fire immediately to blood bank officer
- Each unit has complete chain of custody log
- Integration point with external blood bank network (placeholder)
🏥 OPERATION THEATRE MODULE
src/modules/operation-theatre/ot.service.js
text
You are a surgical systems engineer. Build a complete operation theatre 
management service for a Hospital Management System.

Implement these service functions:

scheduleOperation(operationData, scheduledBy):
- Create OT booking: patientId, surgeonId, procedureType, 
  OT room, scheduled date/time, estimated duration
- Conflict check: OT room not double-booked, surgeon available
- Reserve OT room slot using Redis lock
- Assign OT team: assistant surgeons, anesthesiologist, 
  scrub nurse, circulating nurse
- Auto-generate OT number (OT-YYYY-XXXXX)
- Check pre-op requirements: blood availability, 
  consent forms, pre-op investigations complete
- Send OT schedule to all team members via notification
- Notify ward nurse to prepare patient

preOperativeChecklist(otId, checklistData, completedBy):
- Patient identity verification (name, DOB, MRN)
- Consent verification (signed and dated)
- Site marking verification
- Allergy re-verification
- Pre-op medication given
- Jewelry/metal removed
- NPO (nothing per oral) compliance
- Blood group and crossmatch available
- Pre-op vitals recorded
- Anesthesia pre-assessment done
- Mark checklist complete — cannot proceed without 100% completion

startOperation(otId, startedBy):
- Validate pre-op checklist 100% complete
- Record actual start time (vs scheduled)
- Lock OT room for duration
- Start real-time timer
- Alert team via Socket.io: Operation started

recordIntraOperativeNotes(otId, notes, recordedBy):
- Record: procedure performed, findings, complications, 
  blood loss, fluids given, specimen sent for histopathology
- Implant details if any (device ID, serial number — critical for recalls)
- Anesthesia notes: type, drugs, doses, duration
- Update in real-time (auto-save every 30 seconds to prevent data loss)

endOperation(otId, summaryData, endedBy):
- Record end time, calculate duration
- Post-op diagnosis and procedure summary
- Immediate post-op orders: recovery room, monitoring, medications
- Release OT room (set to CLEANING status)
- Schedule post-op follow-up
- Generate OT report PDF

postOperativeHandover(otId, recoveryData, handedBy):
- Handover to recovery room nurse
- SBAR format: Situation, Background, Assessment, Recommendation
- Recovery vitals baseline
- Pain score
- Transfer to ward when stable criteria met

getOTSchedule(date, filters):
- All OT rooms schedule for day
- Surgeons on duty, OT teams
- Emergency OT slots reserved
- Equipment availability
- Color-coded by status: scheduled/in-progress/complete/cancelled

getOTStats(dateRange):
- Utilization rate per OT room
- Average case duration by procedure type
- On-time start rate
- Complication rate
- Cancellation rate and reasons

Requirements:
- Pre-op checklist completion is mandatory gate — 
  cannot mark operation as started without it
- Implant logs are permanent records (regulatory requirement)
- OT schedule visible to all OT team members in real-time
- Post-op notes auto-push to patient's medical record
- Emergency OT override possible only by senior surgeon + admin
🚑 AMBULANCE MODULE
src/modules/ambulance/ambulance.service.js
text
You are a fleet management and emergency systems engineer. 
Build a complete ambulance management service for a Hospital 
Management System with real-time GPS tracking.

Implement these service functions:

registerAmbulance(ambulanceData, registeredBy):
- Create ambulance record: vehicleNumber, type 
  (BLS/ALS/MICU/neonatal/mortuary), manufacturer, model,
  year, capacity, equipment list
- Assign primary driver, paramedic
- Set initial status: AVAILABLE
- Generate ambulance ID (AMB-XXX)

dispatchAmbulance(requestData, dispatchedBy):
- Create dispatch request: pickupLocation (lat/lng + address), 
  patientCondition, callerName, callerPhone
- Find nearest AVAILABLE ambulance using Haversine formula
- Assign and dispatch, update status to DISPATCHED
- Notify driver via push notification (Firebase) with: 
  pickup address, patient condition, hospital destination
- Start trip tracking
- Alert ER team: ambulance dispatched, ETA, patient condition
- Generate dispatch ticket (format: DISP-YYYYMMDD-XXX)

updateAmbulanceLocation(ambulanceId, coordinates, updatedBy):
- Store GPS coordinates with timestamp in time-series format
- Broadcast location update via Socket.io 
  (to /ambulance namespace, room: dispatchId)
- Calculate and update ETA to hospital
- Alert ER when ambulance is 5 minutes away (pre-alert)
- Store location history for route playback

completeTrip(dispatchId, tripData, completedBy):
- Record: pickup time, hospital arrival time, 
  patient handover time, total distance
- Patient vitals during transport
- Treatments given en route (paramedic notes)
- Update ambulance status to AVAILABLE or MAINTENANCE
- Generate trip report
- Add trip charges to patient bill

scheduleAmbulanceForTransfer(transferData, scheduledBy):
- Scheduled (non-emergency) inter-facility transfers
- Patient-to-patient transfer for investigations (MRI, etc.)
- Body transport for mortuary
- Require: written transfer request, doctor authorization

getAmbulanceStatus():
- All ambulances: status, location, current trip, ETA
- Real-time on map (return formatted for frontend map)
- Available count, dispatched count, in maintenance count

getFleetReport(dateRange):
- Total trips, distance covered, response times
- Maintenance schedule compliance
- Driver performance metrics
- Revenue from ambulance services

scheduleAmbulanceMaintenance(ambulanceId, maintenanceData, scheduledBy):
- Log maintenance schedule
- Mark ambulance unavailable for maintenance period
- Alert fleet manager on due maintenance
- Track service history per vehicle

Requirements:
- Location updates throttled to max 1 per 5 seconds per ambulance
- GPS coordinates stored as POINT type in MySQL (spatial indexing)
- Pre-alert to ER is automated — no manual trigger required
- Trip data immutable after completion (legal record)
- Real-time map data served via Socket.io (not REST poll)
📹 TELEMEDICINE MODULE
src/modules/telemedicine/telemedicine.service.js
text
You are a digital health systems engineer. Build a complete 
telemedicine service for a Hospital Management System with 
video consultation and e-prescription capabilities.

Implement these service functions:

scheduleVideoConsultation(consultationData, scheduledBy):
- Create video appointment: patientId, doctorId, dateTime, 
  type (follow_up/new_consultation/second_opinion), duration (15/30/45 min)
- Check doctor's online consultation availability (separate from in-person)
- Generate unique meeting room ID
- Create Agora/Twilio video room token (or placeholder for integration)
- Collect consultation fee payment upfront (payment gateway)
- Send joining instructions to patient and doctor via email + SMS
- Add appointment to doctor's calendar
- Generate consultation ID (TELE-YYYY-XXXXXX)

generateVideoToken(consultationId, userId):
- Validate user is participant in this consultation
- Validate consultation is within 10-minute window of scheduled time
- Generate Agora RTC token with UID, channel name, expiry 
- Record token generation event
- Return token + channel name + Agora App ID

startConsultation(consultationId, startedBy):
- Validate doctor is starting (not patient)
- Record actual start time
- Update status to IN_PROGRESS
- Start billing timer if per-minute billing
- Notify patient via Socket.io: doctor has joined

endConsultation(consultationId, endedBy):
- Record end time, calculate duration
- Update status to COMPLETED
- Trigger post-consultation workflow:
  * Doctor must complete consultation notes within 2 hours
  * System generates e-prescription if medicines added

addConsultationNotes(consultationId, notes, doctorId):
- Record: chief complaint, history, examination (virtual assessment),
  diagnosis (ICD-10 code), plan, follow-up
- Validate only consulting doctor can add notes
- Notes immutable after 24 hours (addendum only)
- Push notes to patient's medical record

generateEPrescription(consultationId, prescriptionData, doctorId):
- Create digital prescription with QR code
- Apply same validation as pharmacy prescription
- Generate prescription PDF with digital signature placeholder
- Upload to S3
- Send to patient via email
- Valid at any registered pharmacy

rescheduleConsultation(consultationId, newDateTime, rescheduledBy):
- Validate can reschedule (not within 30 min of appointment)
- Free old slot, book new slot
- Send reschedule notification with new joining link
- Charge reschedule fee if applicable

getConsultationHistory(patientId):
- All past consultations with: doctor, date, diagnosis, 
  prescription, recording link (if applicable)
- Filter by: doctor, date range, type

cancelConsultation(consultationId, reason, cancelledBy):
- Refund policy: 100% if > 24hr, 50% if 2-24hr, 0% if < 2hr
- Process automatic refund via payment gateway
- Free the appointment slot
- Notify both parties

Requirements:
- Video tokens expire in 2 hours (security)
- Consultation notes required before marking COMPLETED
- E-prescription generation optional but recommended
- All consultations logged for regulatory compliance
- Integration-ready for Agora.io or Twilio (credential-based)
👥 STAFF MODULE
src/modules/staff/staff.service.js
text
You are an HR systems engineer specializing in healthcare workforce 
management. Build a comprehensive staff management service for 
a Hospital Management System.

Implement these service functions:

onboardStaff(staffData, onboardedBy):
- Create user account with appropriate role
- Create staff profile: employeeId, department, designation, 
  joiningDate, employmentType (permanent/contract/visiting), 
  salary, shift preference, qualifications
- Upload documents to S3: offer letter, ID proof, certificates
- Create payroll record
- Assign default shift schedule
- Send onboarding email with credentials and documents checklist
- Create asset assignment record (laptop, ID card, locker)

markAttendance(staffId, attendanceData):
- Check-in/Check-out with timestamp
- Validate using: biometric hash / IP-based (hospital network) / 
  PIN-based options (flag in env)
- Calculate: working hours, overtime, late arrival (grace: 15 min)
- Handle night shifts (check-out next day logic)
- Lunch break deduction if > 8 hours shift
- Flag consecutive absences (alert HR after 2 days)
- Store with IP address and device fingerprint

manageShifts(shiftData, managedBy):
- Create shift: Morning (7-15), Afternoon (15-23), Night (23-7)
- Shift assignment per department per week
- Validate: no back-to-back night → morning shift
- Minimum rest between shifts: 8 hours
- Fair rotation algorithm for night shifts
- Alert if understaffed for any shift (< minimum coverage)

applyLeave(staffId, leaveData):
- Leave types: casual/sick/earned/maternity/paternity/
  emergency/comp_off
- Check leave balance per type
- Check team coverage: minimum 2 staff must be present per shift
- Auto-approve sick leave if doctor certificate uploaded
- Manager approval workflow for planned leaves
- Update leave balance on approval

processPayroll(month, year, processedBy):
- Calculate for all active staff:
  * Basic salary + HRA + special allowance
  * Overtime pay (1.5x for > 8hrs, 2x for night)
  * Deductions: PF (12%), ESI (0.75% employee), 
    professional tax, TDS (if applicable)
  * Incentives/bonus if applicable
  * Leave deductions for unpaid leave
- Generate payslip PDF per employee
- Upload to S3 with employee-specific access only
- Bulk email payslips to staff
- Create bank transfer file (EFT format)
- Post journal entry to accounting module

getStaffPerformanceReport(staffId, dateRange):
- Attendance percentage
- Late arrivals count, early departures
- Overtime hours
- Leave utilization
- Training completion status

manageTraining(trainingData, managedBy):
- Schedule training programs
- Track attendance and completion per staff
- Store certifications with expiry
- Alert on expiring certifications (CPR, fire safety, etc.)
- Mandatory training compliance report

Requirements:
- Biometric data never stored raw — only hash
- Payroll calculation uses decimal.js for precision
- Payslip PDF password-protected with last 4 digits of staff phone
- Leave approval workflow with SMS/email notifications
- Payroll immutable after finalization (version history only)
📋 DISCHARGE MODULE
src/modules/discharge/discharge.service.js
text
You are a clinical documentation engineer. Build a comprehensive 
patient discharge management service for a Hospital Management System.

Implement these service functions:

initiateDischarge(patientId, admissionId, initiatedBy):
- Validate patient is admitted (not already discharged)
- Create discharge workflow checklist:
  ✓ Final diagnosis confirmed by doctor
  ✓ Discharge medication prescribed
  ✓ All investigations reviewed
  ✓ Bills generated and status checked
  ✓ Insurance pre-clearance if applicable
  ✓ Follow-up appointment scheduled
  ✓ Patient/family counseling done
  ✓ Discharge against medical advice (DAMA) flag if applicable
- Set discharge status to IN_PROGRESS
- Notify billing department to prepare final bill
- Notify pharmacy for discharge medications
- Estimated discharge time for ward planning

completeDischargeSummary(admissionId, summaryData, doctorId):
- Create clinical discharge summary:
  * Admission diagnosis vs final diagnosis (ICD-10)
  * Clinical course narrative
  * Procedures performed (with dates and outcomes)
  * Lab investigations summary (key values, trend)
  * Medications during stay
  * Complications if any
  * Discharge condition: stable/improved/same/worse/expired
  * Discharge medications with instructions
  * Dietary and activity restrictions
  * Warning signs to watch for
  * Follow-up: date, doctor, department
  * Referring hospital (if transferred)
- Validate all required fields complete
- Lock summary after 24 hours (request amendment for changes)
- Generate discharge summary PDF with hospital branding
- Upload to S3

finalizeDischarge(admissionId, finalizedBy):
- Validate: bills PAID or insurance approved, 
  discharge summary complete, medications dispensed
- Execute bed release
- Update patient admission status to DISCHARGED
- Calculate actual length of stay
- Send to patient via email: discharge summary + instructions PDF
- Send SMS with: discharge date, follow-up date, emergency contact
- Create follow-up appointment if specified
- Generate discharge certificate (legal document)
- Update ward bed status to CLEANING
- Release any reserved blood units

generateDischargeCertificate(admissionId):
- Legal certificate with: patient details, admission/discharge dates,
  diagnosis, treating doctor signature placeholder, hospital seal
- Formatted PDF with official hospital letterhead
- Unique certificate number for verification

getDischargeAnalytics(dateRange, filters):
- Average length of stay by ward/diagnosis
- Discharge disposition breakdown
- Re-admission rate within 30 days
- DAMA rate
- Discharge time distribution (peak hours)

scheduleFollowUp(patientId, followUpData, scheduledBy):
- Create follow-up appointment post-discharge
- Reminder: 2 days before follow-up via SMS + email
- Link to original admission for continuity

Requirements:
- Discharge finalization is irreversible — double confirmation required
- DAMA (Discharge Against Medical Advice) requires special 
  signed form document upload
- Discharge summary auto-shared with referring doctor if referral case
- Certificate verification endpoint for insurance/other hospitals
- 30-day re-admission flag automatically triggers review alert
📦 INVENTORY MODULE
src/modules/inventory/inventory.service.js
text
You are a hospital supply chain engineer. Build a complete 
medical inventory management service for a Hospital Management System.

Implement these service functions:

addInventoryItem(itemData, addedBy):
- Create item: name, category (medical_supply/equipment/
  surgical/PPE/housekeeping/office/linen), unit of measure,
  reorder level, minimum quantity, maximum quantity,
  storage location (room, shelf, bin), 
  vendor list, unit cost, HSN code
- Auto-generate item code (INV-CAT-XXXXX)
- Set temperature storage requirements if applicable 
  (cold chain items like vaccines)
- Upload item image and specification sheet to S3

raisePurchaseRequest(requestData, raisedBy):
- Create purchase request with: items array, 
  urgency (routine/urgent/emergency), 
  required by date, department, justification
- Auto-populate from low-stock alerts if trigger is automated
- Department HOD approval required for amounts > threshold
- Admin approval for amounts > higher threshold
- Auto-suggest preferred vendor from item's vendor list
- Generate PR number (PR-YYYY-XXXXX)

createPurchaseOrder(prId, poData, createdBy):
- Convert approved PR to PO
- Select vendor from approved vendor list
- Apply negotiated pricing from vendor contract
- Add GST, delivery charges, discount
- Generate PO PDF, send to vendor via email
- PO number: PO-YYYY-XXXXX
- Track expected delivery date

receiveInventory(poId, receivedItems, receivedBy):
- GRN (Goods Receipt Note) generation
- Match each item: ordered qty vs received qty
- Quality check flags per item
- Record: batch number, expiry (for perishables), condition
- Update stock quantities
- Calculate and update moving average cost
- Discrepancy report if qty/quality mismatch
- Three-way matching: PO + GRN + Invoice

issueInventory(issueData, issuedBy):
- Issue items to: department, ward, OT, emergency
- Validate sufficient stock before issue
- Use FIFO (first in first out) for perishables
- Deduct from inventory
- Create issue slip
- Department consumption tracking

conductStockAudit(auditData, conductedBy):
- Physical count vs system count comparison
- Variance identification and reason codes
- Adjustment entries for variances with approval
- Generate audit report
- Shrinkage calculation and investigation triggers

getLowStockAlerts():
- Items below reorder level sorted by criticality
- Estimated days of stock remaining
- Suggested order quantity
- Preferred vendor info
- Direct link to raise purchase request

getInventoryValuation(filters):
- Total inventory value by category
- Slow-moving items (no consumption in 90 days)
- Dead stock identification
- Return on Inventory metrics

Requirements:
- Cold chain items have temperature range validation 
  during receipt (flag if not met)
- Controlled/narcotic items require dual authorization for issue
- All stock movements logged with actor, timestamp, reference
- Inventory counts stored as decimals for items measured in units 
  less than 1 (ml, grams)
- Real-time stock deduction — no batch processing
📡 NOTIFICATIONS MODULE
src/modules/notifications/notification.service.js
text
You are a multi-channel communication systems engineer. Build a 
unified notification service for a Hospital Management System 
handling all internal and external communications.

Implement these service functions:

sendNotification(notificationData):
- Master notification dispatcher
- Route to appropriate channels based on type and urgency:
  LOW → in-app only
  MEDIUM → in-app + email
  HIGH → in-app + email + SMS
  CRITICAL → in-app + email + SMS + push + Socket.io immediate
- Queue normal notifications via Bull (async, retry on failure)
- CRITICAL notifications bypass queue — synchronous send
- Track delivery status per channel

sendBulkNotification(recipientList, template, data):
- Bulk send to role groups (all doctors, all nurses, etc.)
- Template variable substitution
- Throttle: max 100/second to avoid SMS gateway throttling
- Track individual delivery status
- Opt-out respect (check user notification preferences)

sendSMS(to, message, priority):
- Integrate Twilio/MSG91/Fast2SMS (env-configured)
- Message length check (160 chars for single SMS)
- OTP messages via dedicated transactional route
- Promotional messages via separate route (DND check)
- Delivery callback tracking
- Retry failed: up to 3 times with 1-minute delay

sendEmail(to, subject, template, data, attachments):
- Via AWS SES (from mailer.js config)
- HTML template rendering (Handlebars)
- Attachment support (PDFs from S3)
- Bounce and complaint handling (update user record)
- Unsubscribe link for non-critical emails
- Track open/click rates (placeholder)

sendPushNotification(userId, title, body, data):
- Firebase Cloud Messaging integration
- Store device tokens in user profile
- Multiple device support (mobile + tablet)
- Notification payload: title, body, icon, badge, data
- Handle invalid/expired tokens (auto-remove from DB)

createInAppNotification(userId, notificationData):
- Store in notifications table
- Mark as UNREAD
- Broadcast via Socket.io to user's socket room
- Support notification types: info, warning, success, critical
- Mark as read endpoint
- Badge count update

getNotificationPreferences(userId):
updateNotificationPreferences(userId, preferences):
- Per notification type: email on/off, SMS on/off, push on/off
- Quiet hours: start/end time (no SMS during quiet hours)
- Language preference

getNotificationHistory(userId, filters):
- All notifications with status (sent/delivered/read/failed)
- Filter by: type, channel, date range, read status
- Pagination

notificationTemplates:
- APPOINTMENT_BOOKED, APPOINTMENT_REMINDER (24hr + 1hr before)
- LAB_RESULT_READY, PRESCRIPTION_READY
- BILL_GENERATED, PAYMENT_RECEIVED, PAYMENT_DUE
- DISCHARGE_INSTRUCTIONS, FOLLOW_UP_REMINDER
- EMERGENCY_ALERT, CODE_PROTOCOL
- PASSWORD_RESET, OTP_VERIFICATION
- SHIFT_REMINDER, LEAVE_APPROVED/REJECTED
- LOW_STOCK_ALERT, EXPIRY_ALERT

Requirements:
- All notification sends logged: channel, recipient, 
  template, status, timestamp, messageId
- Failed notifications retried automatically with exponential backoff
- SMS content must comply with regulatory guidelines 
  (sender ID, DND compliance)
- Audit trail for all patient-facing notifications 
  (HIPAA compliance consideration)
- Never include PHI (Protected Health Information) 
  in SMS messages (use secure link instead)
📊 REPORTS MODULE
src/modules/reports/report.service.js
text
You are a healthcare business intelligence engineer. Build a 
comprehensive reporting and analytics service for a Hospital 
Management System with executive dashboards and operational reports.

Implement these service functions:

getAdminDashboard():
- Real-time stats (mix of Redis cache + live DB):
  * Total patients today: OPD + IPD + Emergency
  * Bed occupancy rate (live from ward service)
  * Revenue today vs yesterday vs this month
  * Appointments: scheduled, completed, cancelled, no-show
  * Doctors on duty, nurses on duty
  * Pending lab reports, pending surgeries, active emergencies
  * Low stock alerts count, expiring medicines count
  * Pending approvals: leave, purchase, discounts
- All data with trend indicators (↑↓ % vs previous period)
- Cache with 2-minute TTL, Socket.io push on significant changes

generatePatientReport(filters, exportFormat):
- Patient demographics: age distribution, gender, blood group
- New registrations trend
- OPD vs IPD ratio
-
Claude Sonnet 4.6
in LABORATORY MODULE,WARD & BED MANAGEMENT MODULE, EMERGENCY MODULE,BLOOD BANK MODULE, OPERATION THEATRE MODULE,AMBULANCE MODULE,TELEMEDICINE MODULE,STAFF MODULE, DISCHARGE MODULE,INVENTORY MODULE,NOTIFICATIONS MODULE,REPORTS MODULE in all this according to project structure some files prompts are missing ,get me all prompts ( i think 12 modules & every module have 4 files ,so 48 prompts need to be get )


Thought Process
expand
🏥 All 48 Module Prompts — 12 Modules × 4 Files
✅ service.js already provided for all 12 modules
🆕 Below = All missing controller.js + routes.js + validator.js prompts

🧪 1. LABORATORY MODULE
src/modules/laboratory/lab.controller.js
text
You are a backend API engineer. Build a clean, thin laboratory 
module controller for a Hospital Management System delegating 
all business logic to lab.service.js.

Implement these controller methods:

Test Master Management:
1.  addLabTest(req, res, next) — add new test to catalog
2.  getLabTestById(req, res, next)
3.  updateLabTest(req, res, next)
4.  deactivateLabTest(req, res, next) — soft delete
5.  getLabTestCatalog(req, res, next) — paginated, filtered
6.  addReferenceRanges(req, res, next) — per test per demographic

Order Management:
7.  createLabOrder(req, res, next)
8.  getLabOrderById(req, res, next)
9.  updateLabOrder(req, res, next) — before sample collection only
10. cancelLabOrder(req, res, next)
11. listLabOrders(req, res, next) — with filters and pagination
12. getOrdersByPatient(req, res, next)
13. assignLabTechnician(req, res, next)
14. getLabWorkload(req, res, next) — technician dashboard

Sample Management:
15. collectSample(req, res, next)
16. updateSampleCondition(req, res, next)
17. rejectSample(req, res, next) — with reason, re-collection needed

Result Management:
18. enterLabResults(req, res, next)
19. updateLabResults(req, res, next) — before verification only
20. verifyLabResults(req, res, next) — pathologist action
21. getLabResults(req, res, next) — role-filtered response
22. getLabResultPDF(req, res, next) — stream from S3
23. addResultAddendum(req, res, next) — post-verification note

Dashboard & Reports:
24. getLabDashboard(req, res, next)
25. getTATReport(req, res, next) — turnaround time analytics
26. getWorkloadReport(req, res, next)
27. getCriticalValuesLog(req, res, next) — all critical results today

Requirements:
- Extract query filters cleanly using dedicated helper: 
  extractLabFilters(req.query)
- PDF streaming: set Content-Type: application/pdf, 
  Content-Disposition: attachment headers
- Role-filtered results: pass req.user.role to service 
  for response shaping
- Critical results controller path must log to security audit
- All wrapped in try/catch → next(error)
- Use sendSuccess(res, data, message, statusCode) consistently
- Add @description and @access JSDoc on every method
src/modules/laboratory/lab.validator.js
text
You are a medical data validation specialist. Build comprehensive 
Joi validation schemas for all laboratory module endpoints 
in a Hospital Management System.

Create and export these schemas:

addLabTestSchema:
- testName: required, string, min:3, max:150
- testCode: required, uppercase alphanumeric, max:20
- category: required, enum [hematology, biochemistry, microbiology,
  serology, immunology, histopathology, cytology, radiology,
  cardiology, neurology, endocrinology, toxicology, genetic]
- sampleType: required, enum [blood, urine, stool, sputum, swab,
  csf, biopsy, pus, fluid, saliva, hair, nail]
- sampleVolume: required, string (e.g., "3ml", "5ml")
- unit: required, string (e.g., "mg/dL", "mmol/L", "cells/μL")
- method: optional string (test methodology)
- equipment: optional string
- turnaroundTimeHours: required, integer, min:1, max:720
- cost: required, integer min:0 (paise)
- requiresFasting: boolean, default false
- isActive: boolean, default true
- department: required, string
- instructions: optional string max:500 (patient prep instructions)

addReferenceRangesSchema:
- testId: required uuid
- ranges: required array min:1, each:
  {
    gender: enum [male, female, all] required,
    ageMin: integer min:0 required,
    ageMax: integer min:0 max:120 required,
    normalMin: number required,
    normalMax: number required,
    criticalLow: number optional (panic value),
    criticalHigh: number optional (panic value),
    unit: string required
  }
- Validate: ageMin < ageMax, normalMin < normalMax, 
  criticalLow < normalMin, criticalHigh > normalMax

createLabOrderSchema:
- patientId: required uuid
- doctorId: required uuid
- tests: required array min:1 max:30, each:
  {testId: uuid required, urgency: enum[routine,urgent,stat] required}
- overallUrgency: required enum [routine, urgent, stat]
- clinicalNotes: required string min:5 max:1000
- sampleCollectionTime: optional datetime (if pre-scheduled)
- isFasting: boolean (patient fasting status)
- clinicalDiagnosis: optional string max:500

collectSampleSchema:
- orderId: required uuid
- sampleType: required string
- sampleId: required string (barcode/accession number)
- collectedAt: required datetime (cannot be future)
- collectedBy: auto from req.user.id
- sampleVolume: required string
- condition: required enum [good, hemolyzed, lipemic, 
  insufficient, contaminated, clotted]
- storageTemperature: optional string
- notes: optional string max:200

rejectSampleSchema:
- orderId: required uuid
- sampleId: required string
- rejectionReason: required enum [insufficient_volume, 
  hemolyzed, wrong_container, unlabeled, contaminated,
  clotted, leaked, temperature_breach]
- notes: required string min:10 max:500

enterLabResultsSchema:
- orderId: required uuid
- results: required array min:1, each:
  {
    testId: uuid required,
    value: alternatives [string, number] required,
    unit: string required,
    flag: enum [normal, low, high, critical_low, 
      critical_high, positive, negative] required,
    instrument: optional string,
    notes: optional string max:500
  }
- technicianNotes: optional string max:1000

addAddendumSchema:
- orderId: required uuid
- addendum: required string min:10 max:2000
- reason: required string min:10 max:500

tatReportQuerySchema (query params):
- startDate: required valid date
- endDate: required valid date, max range 90 days
- category: optional enum of test categories
- technicianId: optional uuid
- urgency: optional enum [routine, urgent, stat]

Requirements:
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages with clinical context
- Validate that criticalLow is less than normalMin 
  and criticalHigh is greater than normalMax in reference ranges
- For stat orders: validation hint that TAT must be 
  communicated to supervisor
🛏️ 2. WARD & BED MANAGEMENT MODULE
src/modules/wards/ward.controller.js
text
You are a backend API engineer. Build a hospital operations 
controller for ward and bed management in a Hospital Management 
System following the thin controller pattern.

Implement these controller methods:

Ward Management:
1.  createWard(req, res, next)
2.  getWardById(req, res, next)
3.  updateWard(req, res, next)
4.  deleteWard(req, res, next) — soft delete, admin only
5.  listWards(req, res, next) — all wards with occupancy stats
6.  getWardOccupancyReport(req, res, next)
7.  assignHeadNurse(req, res, next)
8.  getWardNurses(req, res, next)
9.  getHospitalOccupancyDashboard(req, res, next)

Bed Management:
10. addBed(req, res, next)
11. getBedById(req, res, next)
12. updateBed(req, res, next)
13. listBeds(req, res, next) — per ward with filters
14. getBedAvailability(req, res, next) — real-time
15. allocateBed(req, res, next)
16. releaseBed(req, res, next)
17. transferPatient(req, res, next)
18. markBedMaintenance(req, res, next)
19. markBedCleaningDone(req, res, next)
20. getBedHistory(req, res, next) — full allocation history

Nurse Assignment:
21. assignNurseToWard(req, res, next)
22. removeNurseFromWard(req, res, next)
23. getNursesByWard(req, res, next)

Reports:
24. getOccupancyTrend(req, res, next) — last 30 days chart data
25. getBedTurnoverReport(req, res, next)
26. getAverageStayReport(req, res, next)

Requirements:
- getBedAvailability: set Cache-Control: no-store header 
  (real-time data, never HTTP-cached)
- getHospitalOccupancyDashboard: cached in Redis 2 min, 
  pass cache status in response meta
- For allocateBed: validate wardId and bedId match 
  in controller before service call
- Transfer patient: log req.user.id as transferredBy 
  before passing to service
- All wrapped in try/catch → next(error)
- Use sendSuccess from response.util.js
- Include @description, @access, @param JSDoc on each method
src/modules/wards/ward.validator.js
text
You are a hospital operations data validation engineer. Build 
Joi validation schemas for all ward and bed management endpoints.

Create and export these schemas:

createWardSchema:
- wardName: required, string, min:3, max:100
- wardCode: required, uppercase alphanumeric, max:10
- wardType: required, enum [general, icu, nicu, picu, 
  maternity, surgical, orthopedic, pediatric, psychiatric, 
  oncology, cardiac, neuro, burns, isolation, emergency]
- floor: required, integer, min:0, max:50
- building: optional string (for multi-building hospitals)
- totalBeds: required, integer, min:1, max:200
- chargePerDay: required, integer min:0 (paise per day)
- facilities: optional array of strings 
  (e.g., ["oxygen", "cardiac_monitor", "ventilator"])
- headNurseId: optional uuid
- description: optional string max:500
- isActive: boolean default true

updateWardSchema:
- Same as createWardSchema but all optional
- Cannot reduce totalBeds below currently occupied beds 
  (validation hint in error message)

addBedSchema:
- wardId: required uuid
- bedNumber: required string max:10 (e.g., "A-101")
- bedType: required enum [regular, icu, electric, 
  pediatric, birthing, bariatric]
- features: optional array enum values:
  [oxygen_port, suction, cardiac_monitor, ventilator_ready, 
   call_button, side_rails, iv_pole]
- chargeOverridePerDay: optional integer (override ward rate)

allocateBedSchema:
- patientId: required uuid
- wardId: required uuid
- bedId: required uuid
- primaryDoctorId: required uuid
- admissionId: required uuid
- allocationType: required enum [planned, emergency, transfer]
- notes: optional string max:500

releaseBedSchema:
- bedId: required uuid
- releaseReason: required enum [discharged, transferred, 
  deceased, procedure, admin]
- cleaningRequired: boolean default true
- estimatedCleaningMinutes: integer min:15 max:240 default:120
- notes: optional string max:300

transferPatientSchema:
- patientId: required uuid
- fromBedId: required uuid
- toBedId: required uuid
- toWardId: required uuid
- primaryDoctorId: optional uuid (if doctor also changes)
- transferReason: required string min:10 max:500
- transferType: required enum [medical, patient_request, 
  bed_management, upgrade, downgrade]
- authorizedBy: auto from req.user.id

markMaintenanceSchema:
- bedId: required uuid
- maintenanceType: required enum [electrical, mechanical, 
  cleaning_deep, mattress_replacement, inspection]
- startDate: required datetime, cannot be past more than 1hr
- estimatedEndDate: required datetime, must be after startDate
- technician: optional string
- notes: required string min:10 max:500

occupancyQuerySchema (query params):
- wardId: optional uuid
- startDate: required valid date
- endDate: required valid date, max range 90 days
- wardType: optional enum
- groupBy: optional enum [day, week, month, wardType]

Requirements:
- abortEarly: false, stripUnknown: true
- Custom error for bedNumber: must be alphanumeric with optional 
  hyphens only
- chargePerDay and chargeOverridePerDay validation: 
  warn if override is less than 50% of ward rate 
  (add warning in validation success response)
🚨 3. EMERGENCY MODULE
src/modules/emergency/emergency.controller.js
text
You are a critical care backend engineer. Build an emergency 
department controller for a Hospital Management System with 
life-critical reliability requirements.

Implement these controller methods:

Patient Registration & Triage:
1.  registerEmergencyPatient(req, res, next)
     — fast registration, minimal fields, immediate response
2.  getEmergencyPatientById(req, res, next)
3.  updateEmergencyPatient(req, res, next) — identify unknown patient
4.  triagePatient(req, res, next)
5.  updateTriage(req, res, next) — re-triage if condition changes
6.  listActiveERPatients(req, res, next) — sorted by triage priority

Clinical Actions:
7.  addTreatmentNote(req, res, next)
8.  updateVitals(req, res, next)
9.  orderEmergencyLab(req, res, next)
10. orderEmergencyMedication(req, res, next)
11. escalateEmergency(req, res, next)

Code Protocols:
12. activateCodeProtocol(req, res, next) — Code Blue/Red/Pink
13. deactivateCodeProtocol(req, res, next)
14. getActiveCodeProtocols(req, res, next)
15. logCodeResponse(req, res, next) — log responder + arrival time

Disposition:
16. admitFromEmergency(req, res, next) — convert ER → IPD
17. dischargeFromEmergency(req, res, next)
18. transferToAnotherFacility(req, res, next)
19. recordDeceased(req, res, next) — sensitive, requires admin

Dashboard & Reports:
20. getERDashboard(req, res, next) — real-time stats
21. getERWaitTimes(req, res, next)
22. getERPatientHistory(req, res, next) — past ER visits by patient
23. getERAnalyticsReport(req, res, next)
24. getTriageSummary(req, res, next)

Requirements:
- registerEmergencyPatient MUST respond within 200ms 
  (minimal processing, queue heavy work async)
- activateCodeProtocol: synchronous Socket.io broadcast 
  before sending HTTP response
- recordDeceased: requires double confirmation flag 
  in request body (confirmed: true)
- All ER actions stamped with millisecond precision timestamps
- No rate limiting applied to ER endpoints 
  (add comment: EMERGENCY_LIMITER exemption)
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/emergency/emergency.routes.js
text
You are a critical systems API engineer. Build emergency department 
routes for a Hospital Management System where speed and reliability 
are paramount.

Mount under /api/v1/emergency

Registration & Triage:
POST   /register                    → DOCTOR, NURSE, RECEPTIONIST, ADMIN
GET    /patients                    → DOCTOR, NURSE, ADMIN (active ER list)
GET    /patients/:emergencyId       → DOCTOR, NURSE, ADMIN
PUT    /patients/:emergencyId       → DOCTOR, NURSE, ADMIN
POST   /patients/:emergencyId/triage → DOCTOR, NURSE
PUT    /patients/:emergencyId/triage → DOCTOR, NURSE

Clinical Actions:
POST   /patients/:emergencyId/treatment-notes → DOCTOR, NURSE
POST   /patients/:emergencyId/vitals          → DOCTOR, NURSE
POST   /patients/:emergencyId/lab-order       → DOCTOR
POST   /patients/:emergencyId/medication      → DOCTOR
POST   /patients/:emergencyId/escalate        → DOCTOR, NURSE

Code Protocols (HIGHEST PRIORITY):
POST   /codes/activate              → DOCTOR, ADMIN
POST   /codes/:codeId/deactivate    → DOCTOR, ADMIN
GET    /codes/active                → all authenticated
POST   /codes/:codeId/response-log → DOCTOR, NURSE, ADMIN

Disposition:
POST   /patients/:emergencyId/admit      → DOCTOR, ADMIN
POST   /patients/:emergencyId/discharge  → DOCTOR
POST   /patients/:emergencyId/transfer   → DOCTOR, ADMIN
POST   /patients/:emergencyId/deceased   → DOCTOR, ADMIN (admin required)

Dashboard:
GET    /dashboard                   → DOCTOR, NURSE, ADMIN
GET    /wait-times                  → all authenticated
GET    /analytics                   → ADMIN
GET    /triage-summary              → DOCTOR, NURSE, ADMIN
GET    /patients/:emergencyId/history → DOCTOR, ADMIN

Special middleware notes:
- Apply emergencyLimiter (high threshold) instead of apiLimiter
- /codes/activate: apply Socket.io broadcast middleware 
  after controller (pre-response notification)
- /deceased: apply additionalAdminVerify middleware
- All routes: authenticate → authorizeER → validate → controller
- No caching headers on any ER route (all real-time)
- Apply auditMiddleware on ALL ER routes 
  (every action is medico-legal record)
src/modules/emergency/emergency.validator.js
text
You are a medical emergency data validation specialist. Build Joi 
validation schemas for emergency department endpoints with focus 
on fast, minimal validation for critical-path endpoints.

Create and export these schemas:

registerEmergencyPatientSchema:
- firstName: optional string max:50
- lastName: optional string max:50
- unknownPatient: boolean (if true, name not required)
- unknownPatientTag: string when unknownPatient true 
  (e.g., "Unknown Male Adult")
- approximateAge: optional integer min:0 max:120
- gender: required enum [male, female, other, unknown]
- arrivalMode: required enum [walk_in, ambulance, police, 
  referred, brought_by_relatives]
- chiefComplaint: required string min:3 max:500
- initialTriageLevel: required enum [P1_critical, P2_urgent, 
  P3_less_urgent, P4_minor]
- callerName: optional string
- callerPhone: optional valid phone number
- knownAllergies: optional string max:300
- Note: Keep schema minimal — speed is critical in ER

triagePatientSchema:
- emergencyId: from params, uuid
- triageLevel: required enum [P1_critical, P2_urgent, 
  P3_less_urgent, P4_minor]
- bloodPressureSystolic: required integer 40-300
- bloodPressureDiastolic: required integer 20-200
- pulse: required integer 0-300
- respiratoryRate: required integer 0-60
- temperature: required number 25-45 (Celsius)
- oxygenSaturation: required integer 0-100
- glasgowComaScale: required integer 3-15
- painScore: required integer 0-10
- mechanismOfInjury: optional string max:500
- allergiesChecked: required boolean
- drugAlcoholFlag: boolean default false
- news2Score: optional integer (auto-calculated from vitals)
- chiefComplaint: required string min:3 max:1000
- clinicalFindings: required string min:10 max:2000
- triageNurseNotes: optional string max:1000

activateCodeSchema:
- emergencyId: optional uuid
- codeType: required enum [CODE_BLUE, CODE_RED, CODE_PINK, 
  CODE_ORANGE, CODE_WHITE, MCI] 
  (MCI = Mass Casualty Incident)
- location: required string min:3 max:200
- description: required string min:10 max:500
- additionalInfo: optional string max:500
- requestedResources: optional array of strings

treatmentNoteSchema:
- emergencyId: from params, uuid
- noteType: required enum [doctor_note, nursing_note, 
  procedure_note, medication_given, observation]
- content: required string min:10 max:3000
- vitalsTaken: boolean default false
- medicationsGiven: optional array of strings

dispositionSchema:
- emergencyId: from params, uuid
- disposition: required enum [admitted, discharged, 
  transferred, left_without_treatment, deceased, 
  left_against_advice]
- dispositionNotes: required string min:10 max:1000
- followUpRequired: boolean
- followUpDate: date, optional, must be future if provided
- For admitted: wardId required uuid
- For transferred: facilityName required, transferReason required
- For deceased: timeOfDeath required datetime, 
  causeOfDeath required string min:5,
  confirmed boolean must be true (double confirmation)

Requirements:
- abortEarly: false but keep validation lightweight 
  for ER registration (only 3-4 critical checks)
- NEWS2 score auto-calculation hint in validator comment
- Custom messages with clinical terminology
- P1 triage: add validation warning that 
  senior doctor must be alerted immediately
🩸 4. BLOOD BANK MODULE
src/modules/blood-bank/bloodBank.controller.js
text
You are a backend API engineer. Build a complete blood bank 
controller for a Hospital Management System managing 
life-saving blood inventory.

Implement these controller methods:

Blood Unit Management:
1.  addBloodUnit(req, res, next)
2.  getBloodUnitById(req, res, next)
3.  updateBloodUnit(req, res, next) — update test results, status
4.  discardBloodUnit(req, res, next) — with mandatory reason
5.  getBloodInventory(req, res, next) — full inventory by group/component
6.  getInventoryByBloodGroup(req, res, next)
7.  getExpiringUnits(req, res, next) — expiring in X days
8.  getBloodUnitHistory(req, res, next) — chain of custody

Blood Requests:
9.  createBloodRequest(req, res, next)
10. getBloodRequestById(req, res, next)
11. updateBloodRequest(req, res, next)
12. cancelBloodRequest(req, res, next)
13. listBloodRequests(req, res, next)
14. fulfillBloodRequest(req, res, next) — assign units to request
15. issueBlood(req, res, next) — physical issue with crossmatch
16. returnBloodUnit(req, res, next) — unit returned unused

Donors:
17. registerDonor(req, res, next)
18. getDonorById(req, res, next)
19. updateDonor(req, res, next)
20. getDonorHistory(req, res, next)
21. checkDonorEligibility(req, res, next)
22. listDonors(req, res, next)
23. scheduleBloodCamp(req, res, next)
24. recordDonation(req, res, next)

Crossmatch:
25. performCrossmatch(req, res, next)
26. getCrossmatchResult(req, res, next)

Dashboard & Reports:
27. getBloodBankDashboard(req, res, next)
28. getCompatibilityMatrix(req, res, next)
29. getConsumptionReport(req, res, next)
30. getCriticalStockAlerts(req, res, next)

Requirements:
- issueBlood: validate crossmatch result exists and is COMPATIBLE 
  before allowing issue
- discardBloodUnit: require reason and supervisorId in body
- returnBloodUnit: check time elapsed since issue 
  (reject if > 30 minutes — cold chain)
- getCompatibilityMatrix: cache in Redis 24hr TTL (static data)
- All blood unit status changes emit Socket.io event to 
  'blood-bank' room
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/blood-bank/bloodBank.routes.js
text
You are an API design engineer. Build complete blood bank 
management routes for a Hospital Management System.

Mount under /api/v1/blood-bank

Blood Unit routes:
POST   /units                       → BLOOD_BANK_OFFICER, ADMIN
GET    /units                       → BLOOD_BANK_OFFICER, DOCTOR, ADMIN
GET    /units/expiring              → BLOOD_BANK_OFFICER, ADMIN
GET    /units/by-group              → BLOOD_BANK_OFFICER, DOCTOR, ADMIN
GET    /units/critical-alerts       → BLOOD_BANK_OFFICER, ADMIN
GET    /units/:unitId               → BLOOD_BANK_OFFICER, DOCTOR, ADMIN
PUT    /units/:unitId               → BLOOD_BANK_OFFICER, ADMIN
POST   /units/:unitId/discard       → BLOOD_BANK_OFFICER, ADMIN
GET    /units/:unitId/history       → BLOOD_BANK_OFFICER, ADMIN

Blood Request routes:
POST   /requests                    → DOCTOR, ADMIN
GET    /requests                    → BLOOD_BANK_OFFICER, DOCTOR, ADMIN
GET    /requests/:requestId         → BLOOD_BANK_OFFICER, DOCTOR, ADMIN
PUT    /requests/:requestId         → DOCTOR, BLOOD_BANK_OFFICER, ADMIN
DELETE /requests/:requestId         → DOCTOR, ADMIN (cancel only)
POST   /requests/:requestId/fulfill → BLOOD_BANK_OFFICER, ADMIN
POST   /requests/:requestId/issue   → BLOOD_BANK_OFFICER
POST   /requests/:requestId/crossmatch → BLOOD_BANK_OFFICER
GET    /requests/:requestId/crossmatch → BLOOD_BANK_OFFICER, DOCTOR

Return:
POST   /units/:unitId/return        → BLOOD_BANK_OFFICER

Donor routes:
POST   /donors                      → BLOOD_BANK_OFFICER, ADMIN
GET    /donors                      → BLOOD_BANK_OFFICER, ADMIN
GET    /donors/:donorId             → BLOOD_BANK_OFFICER, ADMIN
PUT    /donors/:donorId             → BLOOD_BANK_OFFICER, ADMIN
GET    /donors/:donorId/history     → BLOOD_BANK_OFFICER, ADMIN
GET    /donors/:donorId/eligibility → BLOOD_BANK_OFFICER
POST   /donors/:donorId/donate      → BLOOD_BANK_OFFICER

Blood Camps:
POST   /camps                       → ADMIN
GET    /camps                       → all authenticated

Dashboard & Reference:
GET    /dashboard                   → BLOOD_BANK_OFFICER, ADMIN
GET    /compatibility-matrix        → all authenticated
GET    /reports/consumption         → BLOOD_BANK_OFFICER, ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on all issue, discard, and return routes
Issue routes get NO rate limiting (critical medical operations)
src/modules/blood-bank/bloodBank.validator.js
text
You are a hematology data validation specialist. Build Joi 
validation schemas for blood bank management endpoints.

Create and export these schemas:

addBloodUnitSchema:
- bloodGroup: required enum [A+, A-, B+, B-, O+, O-, AB+, AB-]
- componentType: required enum [whole_blood, packed_rbc, 
  fresh_frozen_plasma, platelets, cryoprecipitate, 
  granulocytes, apheresis_platelets]
- bagNumber: required string, unique format validation 
  (alphanumeric, 8-15 chars)
- donorId: optional uuid (internal donor)
- externalSource: optional string (blood bank name if external)
- At least one of donorId or externalSource required
- collectionDate: required datetime, cannot be future
- volume: required integer (ml) min:50 max:500
- rhFactor: required enum [positive, negative]
- antibodyScreening: required enum [negative, positive, pending]
- infectiousMarkers: required object:
  {hiv: enum[negative,positive,pending] required,
   hbsAg: enum[negative,positive,pending] required,
   hcv: enum[negative,positive,pending] required,
   vdrl: enum[negative,positive,pending] required,
   malaria: enum[negative,positive,pending] required}
- storageLocation: required string max:50
- Note: Expiry auto-calculated by componentType in service

createBloodRequestSchema:
- patientId: required uuid
- requestedBy: auto from req.user.id
- bloodGroup: required enum
- componentType: required enum
- unitsRequired: required integer min:1 max:20
- urgency: required enum [routine, urgent, emergency, massive_transfusion]
- clinicalIndication: required string min:10 max:500
- requiredBy: required datetime, must be future min 30 mins
- crossmatchRequired: boolean default true
- alternateBloodGroups: optional array of blood group enums 
  (acceptable alternatives in emergency)
- specialRequirements: optional array enum 
  [irradiated, leukodepleted, washed, cmv_negative, 
   antigen_negative, pediatric_pack]

registerDonorSchema:
- firstName, lastName: required strings
- dateOfBirth: required date, donor must be 18-65 years old
- gender: required enum [male, female]
- bloodGroup: required enum [A+, A-, B+, B-, O+, O-, AB+, AB-]
- phone: required valid phone
- email: optional valid email
- address: required object {city, state, pincode}
- weight: required number min:45 kg
- lastDonationDate: optional date
- medicalHistory: object:
  {diabetes: boolean, hypertension: boolean, 
   heartDisease: boolean, hiv: boolean,
   hepatitis: boolean, recentTattoo: boolean,
   recentSurgery: boolean, pregnant: boolean,
   recentTravel: optional string}
- donorType: required enum [voluntary, replacement, autologous]

crossmatchSchema:
- requestId: required uuid
- patientSampleId: required string
- donorUnitId: required uuid
- method: required enum [immediate_spin, saline, 
  antiglobulin, electronic]
- result: required enum [compatible, incompatible, 
  weakly_positive, pending]
- performedBy: auto from req.user.id
- notes: optional string max:500

Requirements:
- bloodGroup validation: strict enum, no variations allowed
- For massive_transfusion urgency: automatically set 
  crossmatchRequired to false (emergency O-neg protocol hint)
- Donor age validation with exact error: 
  "Donor must be between 18 and 65 years of age"
- abortEarly: false, stripUnknown: true
🏥 5. OPERATION THEATRE MODULE
src/modules/operation-theatre/ot.controller.js
text
You are a surgical systems backend engineer. Build an operation 
theatre controller for a Hospital Management System managing 
the complete surgical workflow.

Implement these controller methods:

OT Scheduling:
1.  scheduleOperation(req, res, next)
2.  getOperationById(req, res, next)
3.  updateOperationSchedule(req, res, next)
4.  cancelOperation(req, res, next) — with mandatory reason
5.  getOTSchedule(req, res, next) — by date, OT room
6.  getOTRoomAvailability(req, res, next) — slot-based
7.  listOperations(req, res, next) — paginated with filters

Team Management:
8.  assignOTTeam(req, res, next)
9.  updateOTTeam(req, res, next)
10. getOTTeamByOperation(req, res, next)

Pre-Operative:
11. getPreOpChecklist(req, res, next)
12. updatePreOpChecklist(req, res, next)
13. markChecklistComplete(req, res, next) — validates 100%
14. addPreOpNote(req, res, next)

Operation Execution:
15. startOperation(req, res, next) — validates checklist complete
16. recordIntraOpNotes(req, res, next)
17. updateIntraOpNotes(req, res, next) — auto-save support
18. addImplantRecord(req, res, next) — critical for device tracking
19. endOperation(req, res, next)

Post-Operative:
20. recordPostOpNotes(req, res, next)
21. handoverToRecovery(req, res, next)
22. recordRecoveryVitals(req, res, next)
23. transferToWard(req, res, next)

OT Room Management:
24. createOTRoom(req, res, next)
25. updateOTRoom(req, res, next)
26. getOTRooms(req, res, next)
27. markOTRoomMaintenance(req, res, next)
28. markOTRoomReady(req, res, next)

Reports:
29. getOTStats(req, res, next)
30. getOTUtilizationReport(req, res, next)
31. getSurgeonPerformanceReport(req, res, next)
32. getComplicationReport(req, res, next)

Requirements:
- startOperation: validate pre-op checklist 100% complete 
  in controller before service call — return 400 if not
- addImplantRecord: flag as regulatory-critical in audit log
- recordIntraOpNotes: support partial update (PATCH semantics) 
  for auto-save functionality
- endOperation: trigger async: bed release, billing update, 
  ward notification via service layer
- All wrapped in try/catch → next(error)
- OT events broadcast via Socket.io handled in service, 
  not controller
src/modules/operation-theatre/ot.routes.js
text
You are a surgical systems API engineer. Build operation theatre 
routes for a Hospital Management System with strict surgical 
workflow enforcement.

Mount under /api/v1/ot

OT Room Management:
POST   /rooms                       → ADMIN
GET    /rooms                       → all authenticated
GET    /rooms/availability          → all authenticated staff
GET    /rooms/:roomId               → all authenticated
PUT    /rooms/:roomId               → ADMIN
POST   /rooms/:roomId/maintenance   → ADMIN
POST   /rooms/:roomId/ready         → ADMIN, NURSE

Scheduling:
POST   /operations                        → SURGEON, ADMIN
GET    /operations                        → SURGEON, NURSE, ANESTHESIOLOGIST, ADMIN
GET    /operations/schedule               → SURGEON, NURSE, ANESTHESIOLOGIST, ADMIN
GET    /operations/:otId                  → SURGEON, NURSE, ANESTHESIOLOGIST, ADMIN
PUT    /operations/:otId                  → SURGEON, ADMIN
DELETE /operations/:otId                  → SURGEON, ADMIN (cancel)

Team:
POST   /operations/:otId/team             → ADMIN, SURGEON
PUT    /operations/:otId/team             → ADMIN, SURGEON
GET    /operations/:otId/team             → all OT staff

Pre-Operative:
GET    /operations/:otId/checklist        → SURGEON, NURSE, ANESTHESIOLOGIST
PUT    /operations/:otId/checklist        → NURSE, ANESTHESIOLOGIST
POST   /operations/:otId/checklist/complete → NURSE (requires all items done)
POST   /operations/:otId/pre-op-notes     → SURGEON, ANESTHESIOLOGIST

Intra-Operative:
POST   /operations/:otId/start            → SURGEON (checklist must be complete)
POST   /operations/:otId/intra-op-notes   → SURGEON, SCRUB_NURSE
PUT    /operations/:otId/intra-op-notes   → SURGEON (auto-save PATCH)
POST   /operations/:otId/implants         → SURGEON
POST   /operations/:otId/end              → SURGEON

Post-Operative:
POST   /operations/:otId/post-op-notes    → SURGEON
POST   /operations/:otId/handover         → RECOVERY_NURSE, NURSE
POST   /operations/:otId/recovery-vitals  → NURSE
POST   /operations/:otId/transfer-ward    → DOCTOR, NURSE, ADMIN

Reports:
GET    /reports/stats                     → ADMIN, SURGEON
GET    /reports/utilization               → ADMIN
GET    /reports/surgeon/:surgeonId        → ADMIN, SURGEON (own)
GET    /reports/complications             → ADMIN, SURGEON

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on ALL OT write routes (medico-legal)
Implant records: apply enhanced audit (regulatory requirement)
No caching on OT status endpoints (real-time surgical data)
src/modules/operation-theatre/ot.validator.js
text
You are a surgical data validation engineer. Build Joi validation 
schemas for all operation theatre endpoints ensuring 
medico-legal data completeness.

Create and export these schemas:

scheduleOperationSchema:
- patientId: required uuid
- surgeonId: required uuid
- assistantSurgeonIds: optional array of uuids, max:3
- anesthesiologistId: required uuid
- otRoomId: required uuid
- scheduledDate: required date, must be future, 
  min 4 hours from now (urgent exception handled in service)
- scheduledTime: required HH:MM format
- estimatedDurationMinutes: required integer min:15 max:720
- procedureType: required string min:5 max:200
- procedureCode: optional string (CPT/ICD-10-PCS code)
- anesthesiaType: required enum [general, regional, local, 
  spinal, epidural, conscious_sedation, combined]
- urgency: required enum [elective, urgent, emergency, 
  trauma, lifesaving]
- preOpDiagnosis: required string min:5 max:500
- specialEquipment: optional array of strings
- bloodRequired: boolean default false
- bloodUnitsRequired: integer min:0, required if bloodRequired true
- consentObtained: required boolean, must be true
- notes: optional string max:1000

preOpChecklistSchema:
- otId: from params, uuid
- checklist: required object with boolean values for each item:
  {
    patientIdentityVerified: boolean required,
    consentSigned: boolean required,
    siteMark: boolean required (if orthopedic/surgical),
    allergyVerified: boolean required,
    preOpMedGiven: boolean required,
    jewelryRemoved: boolean required,
    npoCompliant: boolean required,
    bloodAvailable: boolean required (if bloodRequired=true on schedule),
    crossmatchDone: boolean,
    preOpVitalsDone: boolean required,
    anesthesiaAssessmentDone: boolean required,
    imagingAvailable: boolean required,
    ivAccessEstablished: boolean required
  }
- anesthesiologistSignoff: boolean required
- nurseName: required string
- verificationTime: required datetime

intraOpNotesSchema:
- otId: from params, uuid
- procedurePerformed: required string min:10 max:2000
- findings: required string min:5 max:2000
- complications: optional string max:1000
- estimatedBloodLoss: required integer min:0 (ml)
- fluidGiven: required object {crystalloid: integer, 
  colloid: integer, blood: integer} (all in ml)
- specimenSent: boolean default false
- specimenDetails: string, required if specimenSent true
- sutureUsed: optional string
- drainPlaced: boolean default false
- packingUsed: boolean default false
- notes: optional string max:2000

addImplantSchema:
- otId: from params, uuid
- implantType: required string min:3 max:200
- manufacturer: required string
- modelNumber: required string
- serialNumber: required string (unique, for recall tracking)
- lotNumber: required string
- expiryDate: optional date (if applicable)
- sizeSpecs: optional string
- implantLocation: required string min:3 max:200
- implantedBy: auto from req.user.id

endOperationSchema:
- otId: from params, uuid
- actualEndTime: required datetime
- finalProcedure: required string min:10 max:2000
- postOpDiagnosis: required string min:5 max:500
- postOpCondition: required enum [stable, guarded, critical, 
  poor, deceased_on_table]
- immediateOrders: required string min:10 max:2000
- recoveryRoom: required string
- surgeonNotes: optional string max:1000

Requirements:
- consentObtained must be true to schedule (hard validation)
- urgency = lifesaving bypasses scheduledDate future validation 
  (can be scheduled for right now)
- All intraOp fields required when submitting final 
  (allow partial for auto-save — add isAutoSave boolean flag)
- abortEarly: false, stripUnknown: true
- Custom messages with surgical terminology
🚑 6. AMBULANCE MODULE
src/modules/ambulance/ambulance.controller.js
text
You are a fleet management backend engineer. Build an ambulance 
management controller for a Hospital Management System 
with real-time GPS tracking capabilities.

Implement these controller methods:

Fleet Management:
1.  registerAmbulance(req, res, next)
2.  getAmbulanceById(req, res, next)
3.  updateAmbulance(req, res, next)
4.  deactivateAmbulance(req, res, next)
5.  listAmbulances(req, res, next) — with real-time status
6.  getAmbulanceStatus(req, res, next) — all fleet dashboard

Dispatch:
7.  createDispatchRequest(req, res, next)
8.  getDispatchById(req, res, next)
9.  dispatchAmbulance(req, res, next) — assign nearest available
10. cancelDispatch(req, res, next)
11. listDispatches(req, res, next)
12. getActiveDispatches(req, res, next)

Location Tracking:
13. updateLocation(req, res, next) — from driver device
14. getAmbulanceLocation(req, res, next)
15. getLocationHistory(req, res, next) — route playback
16. getETAToHospital(req, res, next)

Trip Management:
17. startTrip(req, res, next)
18. recordTripVitals(req, res, next) — paramedic records en route
19. addTripNote(req, res, next)
20. completeTrip(req, res, next)
21. getTripById(req, res, next)
22. getTripsByAmbulance(req, res, next)
23. getTripsByPatient(req, res, next)

Staff Assignment:
24. assignDriver(req, res, next)
25. assignParamedic(req, res, next)
26. getAmbulanceStaff(req, res, next)

Maintenance:
27. scheduleMaintenace(req, res, next)
28. completeMaintenance(req, res, next)
29. getMaintenanceHistory(req, res, next)
30. getServiceDueAlerts(req, res, next)

Reports:
31. getFleetReport(req, res, next)
32. getResponseTimeReport(req, res, next)
33. getDriverPerformanceReport(req, res, next)

Requirements:
- updateLocation: high-frequency endpoint, 
  validate GPS coordinates strictly, minimal processing
- dispatchAmbulance: synchronous Socket.io notify to driver 
  before HTTP response
- completeTrip: async billing integration 
  (fire-and-forget with error queue)
- getAmbulanceStatus: cache in Redis 30 seconds, 
  bust on every location update
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/ambulance/ambulance.routes.js
text
You are an API design engineer. Build ambulance management 
routes for a Hospital Management System with real-time 
tracking architecture.

Mount under /api/v1/ambulance

Fleet Management:
POST   /fleet                       → ADMIN
GET    /fleet                       → ADMIN, DISPATCHER
GET    /fleet/status                → ADMIN, DISPATCHER, DOCTOR, ER_STAFF
GET    /fleet/service-due           → ADMIN
GET    /fleet/:ambulanceId          → ADMIN, DISPATCHER
PUT    /fleet/:ambulanceId          → ADMIN
DELETE /fleet/:ambulanceId          → ADMIN
POST   /fleet/:ambulanceId/assign-driver   → ADMIN
POST   /fleet/:ambulanceId/assign-paramedic → ADMIN
GET    /fleet/:ambulanceId/staff    → ADMIN, DISPATCHER

Dispatch:
POST   /dispatch                    → DISPATCHER, ADMIN, RECEPTIONIST
GET    /dispatch                    → DISPATCHER, ADMIN
GET    /dispatch/active             → DISPATCHER, ADMIN, DOCTOR
GET    /dispatch/:dispatchId        → DISPATCHER, ADMIN
POST   /dispatch/:dispatchId/assign → DISPATCHER, ADMIN
DELETE /dispatch/:dispatchId        → DISPATCHER, ADMIN

Location (high-frequency — optimize middleware):
POST   /location/:ambulanceId       → DRIVER role, validate device token
GET    /location/:ambulanceId       → DISPATCHER, ADMIN, DOCTOR
GET    /location/:ambulanceId/history → DISPATCHER, ADMIN
GET    /location/:ambulanceId/eta   → DISPATCHER, ADMIN, ER_STAFF

Trips:
POST   /trips/:dispatchId/start     → DRIVER, PARAMEDIC
POST   /trips/:tripId/vitals        → PARAMEDIC
POST   /trips/:tripId/notes         → DRIVER, PARAMEDIC
POST   /trips/:tripId/complete      → DRIVER, PARAMEDIC, ADMIN
GET    /trips/:tripId               → DISPATCHER, ADMIN
GET    /trips/ambulance/:ambulanceId → ADMIN, DISPATCHER
GET    /trips/patient/:patientId    → ADMIN, DOCTOR

Maintenance:
POST   /maintenance/:ambulanceId    → ADMIN
PUT    /maintenance/:maintenanceId/complete → ADMIN
GET    /maintenance/:ambulanceId/history → ADMIN

Reports:
GET    /reports/fleet               → ADMIN
GET    /reports/response-times      → ADMIN
GET    /reports/driver/:driverId    → ADMIN

Middleware notes:
- Location update endpoint: custom lightweight middleware 
  (skip full RBAC for speed, use device token validation)
- Apply uploadLimiter on maintenance document upload
- All dispatch routes: apply auditMiddleware
- Emergency dispatch: no rate limiting
src/modules/ambulance/ambulance.validator.js
text
You are a fleet management data validation engineer. Build Joi 
validation schemas for ambulance management endpoints.

Create and export these schemas:

registerAmbulanceSchema:
- vehicleNumber: required string, valid Indian vehicle plate format 
  or generic alphanumeric max:15
- ambulanceType: required enum [BLS, ALS, MICU, 
  neonatal, pediatric, bariatric, mortuary]
- manufacturer: required string max:100
- model: required string max:100
- year: required integer min:2000 max:currentYear+1
- registrationExpiry: required date, must be future
- insuranceExpiry: required date, must be future
- fitnessExpiry: required date, must be future
- seatingCapacity: required integer min:2 max:6
- equipment: required array of strings min:1
- fuelType: enum [diesel, petrol, electric, cng] default diesel
- gpsDeviceId: optional string (GPS tracker device ID)

createDispatchRequestSchema:
- pickupLatitude: required number min:-90 max:90
- pickupLongitude: required number min:-180 max:180
- pickupAddress: required string min:10 max:500
- destinationLatitude: optional number
- destinationLongitude: optional number
- destinationAddress: optional string (defaults to hospital)
- patientId: optional uuid (may not be registered yet)
- callerName: required string min:2 max:100
- callerPhone: required valid phone number
- patientCondition: required string min:5 max:500
- triageLevel: required enum [P1_critical, P2_urgent, 
  P3_less_urgent, P4_minor]
- dispatchType: required enum [emergency, scheduled, 
  inter_facility, patient_transport, body_transport]
- specialRequirements: optional array enum 
  [oxygen, defibrillator, incubator, wheelchair, stretcher]

updateLocationSchema:
- latitude: required number min:-90 max:90
- longitude: required number min:-180 max:180
- speed: optional number min:0 max:200 (km/h)
- heading: optional number min:0 max:360 (degrees)
- accuracy: optional number (GPS accuracy in meters)
- timestamp: required datetime (device timestamp)
- Note: Keep validation minimal — high frequency endpoint

completeTripSchema:
- dispatchId: from params uuid
- pickupTime: required datetime
- hospitalArrivalTime: required datetime, must be after pickupTime
- patientHandoverTime: required datetime, must be after hospitalArrivalTime
- distanceCovered: required number min:0 max:1000 (km)
- fuelConsumed: optional number min:0 max:200 (liters)
- patientConditionOnPickup: required string min:5 max:500
- patientConditionOnArrival: required string min:5 max:500
- treatmentsGiven: optional array of strings
- complications: optional string max:500
- driverNotes: optional string max:500
- paramedicNotes: optional string max:1000

scheduleMaintenanceSchema:
- ambulanceId: required uuid
- maintenanceType: required enum [scheduled_service, 
  breakdown_repair, inspection, deep_cleaning, 
  equipment_check, tyre_change, battery]
- scheduledDate: required datetime, must be future
- estimatedDurationHours: required number min:0.5 max:72
- serviceCenterId: optional uuid
- notes: optional string max:500
- odometer: required integer min:0

Requirements:
- vehicleNumber custom validation: no spaces, uppercase
- pickupLatitude/Longitude: precise to 6 decimal places max
- Validate hospitalArrivalTime > pickupTime with message: 
  "Hospital arrival time must be after pickup time"
- abortEarly: false, stripUnknown: true
📹 7. TELEMEDICINE MODULE
src/modules/telemedicine/telemedicine.controller.js
text
You are a digital health backend engineer. Build a telemedicine 
controller for a Hospital Management System handling video 
consultations and e-prescriptions.

Implement these controller methods:

Consultation Management:
1.  scheduleConsultation(req, res, next)
2.  getConsultationById(req, res, next)
3.  updateConsultation(req, res, next)
4.  cancelConsultation(req, res, next)
5.  rescheduleConsultation(req, res, next)
6.  listConsultations(req, res, next) — paginated with filters
7.  getConsultationsByPatient(req, res, next)
8.  getConsultationsByDoctor(req, res, next)
9.  getUpcomingConsultations(req, res, next)

Video Session:
10. generateVideoToken(req, res, next)
11. startConsultation(req, res, next) — doctor action
12. endConsultation(req, res, next) — doctor action
13. joinConsultation(req, res, next) — patient action (get token)
14. getSessionStatus(req, res, next) — is doctor in room?

Clinical Documentation:
15. addConsultationNotes(req, res, next)
16. updateConsultationNotes(req, res, next)
17. getConsultationNotes(req, res, next)
18. addSymptoms(req, res, next) — patient pre-consultation input
19. getConsultationSummary(req, res, next)

E-Prescription:
20. generateEPrescription(req, res, next)
21. getEPrescription(req, res, next)
22. getEPrescriptionPDF(req, res, next) — stream from S3
23. sendEPrescriptionToPharmacy(req, res, next)

Follow-up & Referral:
24. scheduleFollowUp(req, res, next)
25. createReferral(req, res, next) — refer to specialist
26. getReferralById(req, res, next)

Payment:
27. initiatePayment(req, res, next) — pre-consultation payment
28. verifyPayment(req, res, next) — gateway callback
29. getPaymentStatus(req, res, next)

Doctor Availability:
30. getDoctorOnlineAvailability(req, res, next)
31. setDoctorOnlineAvailability(req, res, next) — doctor sets online hours
32. getAvailableDoctors(req, res, next) — doctors available now

Reports:
33. getTeleMedicineDashboard(req, res, next)
34. getConsultationAnalytics(req, res, next)

Requirements:
- generateVideoToken: validate consultation is within 
  ±10 minute window of scheduled time before issuing token
- joinConsultation: validate user is patient for this consultation
- All consultation notes: validate doctorId matches req.user.id
- initiatePayment: consultation status must be SCHEDULED 
  and not already paid
- verifyPayment: Razorpay/Stripe signature verification 
  before any state change
- All wrapped in try/catch → next(error)
src/modules/telemedicine/telemedicine.routes.js
text
You are an API design engineer. Build telemedicine routes for 
a Hospital Management System with secure video consultation access.

Mount under /api/v1/telemedicine

Consultation routes:
POST   /consultations               → PATIENT, ADMIN, RECEPTIONIST
GET    /consultations               → ADMIN (all), filtered
GET    /consultations/upcoming      → PATIENT (own), DOCTOR (own)
GET    /consultations/:consultId    → DOCTOR, PATIENT (own), ADMIN
PUT    /consultations/:consultId    → DOCTOR, ADMIN
POST   /consultations/:consultId/cancel    → PATIENT, DOCTOR, ADMIN
POST   /consultations/:consultId/reschedule → PATIENT, DOCTOR, ADMIN
GET    /consultations/patient/:patientId   → DOCTOR, ADMIN, PATIENT (own)
GET    /consultations/doctor/:doctorId     → ADMIN, DOCTOR (own)

Video Session:
POST   /consultations/:consultId/token    → DOCTOR, PATIENT (own only)
POST   /consultations/:consultId/start    → DOCTOR only
POST   /consultations/:consultId/end      → DOCTOR only
POST   /consultations/:consultId/join     → PATIENT (own)
GET    /consultations/:consultId/status   → DOCTOR, PATIENT (own)

Clinical:
POST   /consultations/:consultId/notes    → DOCTOR only
PUT    /consultations/:consultId/notes    → DOCTOR only
GET    /consultations/:consultId/notes    → DOCTOR, PATIENT (own)
POST   /consultations/:consultId/symptoms → PATIENT (own), DOCTOR
GET    /consultations/:consultId/summary  → DOCTOR, PATIENT (own), ADMIN

E-Prescription:
POST   /consultations/:consultId/prescription → DOCTOR only
GET    /consultations/:consultId/prescription → DOCTOR, PATIENT (own)
GET    /consultations/:consultId/prescription/pdf → DOCTOR, PATIENT (own)
POST   /consultations/:consultId/prescription/send → DOCTOR

Follow-up & Referral:
POST   /consultations/:consultId/follow-up → DOCTOR
POST   /consultations/:consultId/referral  → DOCTOR
GET    /referrals/:referralId              → DOCTOR, PATIENT (own), ADMIN

Payment:
POST   /consultations/:consultId/payment/initiate → PATIENT, ADMIN
POST   /consultations/:consultId/payment/verify   → PATIENT, ADMIN
GET    /consultations/:consultId/payment/status   → PATIENT (own), ADMIN

Doctor Availability:
GET    /doctors/available           → PATIENT, all authenticated
GET    /doctors/:doctorId/online-availability → all authenticated
PUT    /doctors/:doctorId/online-availability → DOCTOR (own)

Dashboard:
GET    /dashboard                   → ADMIN,
Claude Sonnet 4.6
complete this & continue


Thought Process
expand
🏥 Completing All Remaining Prompts — Telemedicine → Reports
📹 7. TELEMEDICINE MODULE (Completing routes + validator)
src/modules/telemedicine/telemedicine.routes.js — COMPLETE
text
You are an API design engineer. Build telemedicine routes for 
a Hospital Management System with secure video consultation access.

Mount under /api/v1/telemedicine

Consultation routes:
POST   /consultations                             → PATIENT, ADMIN, RECEPTIONIST
GET    /consultations                             → ADMIN
GET    /consultations/upcoming                    → PATIENT (own), DOCTOR (own)
GET    /consultations/:consultId                  → DOCTOR, PATIENT (own), ADMIN
PUT    /consultations/:consultId                  → DOCTOR, ADMIN
POST   /consultations/:consultId/cancel           → PATIENT, DOCTOR, ADMIN
POST   /consultations/:consultId/reschedule       → PATIENT, DOCTOR, ADMIN
GET    /consultations/patient/:patientId          → DOCTOR, ADMIN, PATIENT (own)
GET    /consultations/doctor/:doctorId            → ADMIN, DOCTOR (own)

Video Session:
POST   /consultations/:consultId/token            → DOCTOR, PATIENT (own only)
POST   /consultations/:consultId/start            → DOCTOR only
POST   /consultations/:consultId/end              → DOCTOR only
POST   /consultations/:consultId/join             → PATIENT (own)
GET    /consultations/:consultId/status           → DOCTOR, PATIENT (own)

Clinical Documentation:
POST   /consultations/:consultId/notes            → DOCTOR only
PUT    /consultations/:consultId/notes            → DOCTOR only
GET    /consultations/:consultId/notes            → DOCTOR, PATIENT (own)
POST   /consultations/:consultId/symptoms         → PATIENT (own), DOCTOR
GET    /consultations/:consultId/summary          → DOCTOR, PATIENT (own), ADMIN

E-Prescription:
POST   /consultations/:consultId/prescription     → DOCTOR only
GET    /consultations/:consultId/prescription     → DOCTOR, PATIENT (own)
GET    /consultations/:consultId/prescription/pdf → DOCTOR, PATIENT (own)
POST   /consultations/:consultId/prescription/send → DOCTOR

Follow-up & Referral:
POST   /consultations/:consultId/follow-up        → DOCTOR
POST   /consultations/:consultId/referral         → DOCTOR
GET    /referrals/:referralId                     → DOCTOR, PATIENT (own), ADMIN

Payment:
POST   /consultations/:consultId/payment/initiate → PATIENT, ADMIN
POST   /consultations/:consultId/payment/verify   → PATIENT, ADMIN
GET    /consultations/:consultId/payment/status   → PATIENT (own), ADMIN

Webhook (no auth — signature validation instead):
POST   /payments/webhook/razorpay                 → razorpayWebhookValidator middleware

Doctor Online Availability:
GET    /doctors/available                         → all authenticated
GET    /doctors/:doctorId/online-availability     → all authenticated
PUT    /doctors/:doctorId/online-availability     → DOCTOR (own only)

Dashboard & Analytics:
GET    /dashboard                                 → ADMIN, SUPER_ADMIN
GET    /analytics                                 → ADMIN, SUPER_ADMIN
GET    /analytics/doctor/:doctorId                → ADMIN, DOCTOR (own)

Middleware chain on all routes:
authenticate → authorize(permission) → validate(schema) → controller

Special middleware notes:
- /token and /join: apply consultationWindowValidator middleware 
  (checks ±10 min window before issuing token)
- /prescription routes: apply prescriptionOwnershipGuard middleware
- Payment webhook: bypass authenticate, apply razorpaySignatureValidator
- All clinical write routes: apply auditMiddleware
- Video session routes: apply socketRoomValidator middleware
- Apply apiLimiter on all routes
- /token: apply stricter tokenGenerationLimiter 
  (max 5 token requests per consultation)
- Export router with clear section comments per group
src/modules/telemedicine/telemedicine.validator.js
text
You are a digital health data validation specialist. Build 
comprehensive Joi validation schemas for all telemedicine 
module endpoints in a Hospital Management System.

Create and export these schemas:

scheduleConsultationSchema:
- patientId: required uuid
- doctorId: required uuid
- scheduledDate: required date, must be future, 
  min 2 hours from now (to allow payment and preparation)
- scheduledTime: required string HH:MM format, 
  must align with doctor's online availability slots
- duration: required enum [15, 30, 45, 60] (minutes)
- consultationType: required enum [new_consultation, 
  follow_up, second_opinion, specialist_referral, 
  prescription_renewal]
- chiefComplaint: required string min:10 max:500
- symptoms: optional array of strings min:1 max:20
- medicalHistory: optional string max:1000
- currentMedications: optional array of strings
- reportUrls: optional array of valid URLs max:10 
  (patient uploads reports before consultation)
- preferredLanguage: optional enum [english, hindi, 
  tamil, telugu, kannada, bengali, marathi]
- deviceType: optional enum [mobile, tablet, laptop, desktop]

rescheduleConsultationSchema:
- consultId: from params, uuid
- newDate: required date, must be future min 2 hours
- newTime: required string HH:MM format
- reason: required string min:10 max:500
- rescheduledBy: auto from req.user.id

addConsultationNotesSchema:
- consultId: from params, uuid
- chiefComplaint: required string min:5 max:500
- historyOfPresentIllness: required string min:10 max:3000
- pastMedicalHistory: optional string max:1000
- familyHistory: optional string max:500
- socialHistory: optional string max:500
- reviewOfSystems: optional string max:1000
- clinicalAssessment: required string min:10 max:2000
- diagnosis: required array min:1 max:10, each:
  {icd10Code: string optional, description: string required min:3}
- managementPlan: required string min:10 max:2000
- followUpRequired: required boolean
- followUpDays: integer min:1 max:365, required if followUpRequired true
- doctorNotes: optional string max:1000

generateEPrescriptionSchema:
- consultId: from params, uuid
- medicines: required array min:1 max:20, each:
  {
    name: string required min:2 max:200,
    genericName: optional string,
    dosage: string required (e.g. "500mg"),
    form: enum [tablet, capsule, syrup, injection, 
      cream, drops, inhaler] required,
    frequency: required enum [once_daily, twice_daily, 
      thrice_daily, four_times_daily, every_6_hours, 
      every_8_hours, as_needed, before_meals, after_meals],
    duration: required integer min:1 max:365 (days),
    quantity: required integer min:1,
    instructions: optional string max:300
  }
- additionalInstructions: optional string max:1000
- dietaryAdvice: optional string max:500
- activityRestrictions: optional string max:500
- isControlledSubstance: boolean default false,
  if true: requires additional validation and logging

setDoctorAvailabilitySchema:
- doctorId: from params, uuid
- onlineHours: required array min:1 max:7, each:
  {
    dayOfWeek: required enum [monday, tuesday, wednesday, 
      thursday, friday, saturday, sunday],
    startTime: required HH:MM,
    endTime: required HH:MM, must be after startTime,
    slotDuration: required enum [15, 30, 45, 60] (minutes),
    maxConsultations: required integer min:1 max:30,
    isActive: boolean default true
  }
- Validate: no overlapping time slots on same day
- consultationFee: required integer min:0 (paise)

cancelConsultationSchema:
- consultId: from params, uuid
- reason: required string min:10 max:500
- cancelledBy: auto from req.user.id
- refundRequested: boolean default true
- Note: Validate cancellation policy in service 
  (validation hint in schema comments)

videoTokenSchema:
- consultId: from params, uuid
- userType: required enum [doctor, patient]
- deviceInfo: optional object 
  {browser: string, os: string, isMobile: boolean}

addSymptomsSchema:
- consultId: from params, uuid
- symptoms: required array min:1 max:30 of strings
- symptomDuration: required string max:100 
  (e.g., "3 days", "2 weeks")
- severity: required enum [mild, moderate, severe]
- additionalNotes: optional string max:1000
- currentMedications: optional array of strings
- allergies: optional array of strings

Requirements:
- scheduledTime must be in HH:MM 24-hour format 
  with custom error: "Please provide time in HH:MM format (24-hour)"
- Validate consultationType = follow_up requires 
  a previous consultationId reference (previousConsultId optional uuid)
- isControlledSubstance prescriptions: flag for 
  enhanced audit logging in schema meta
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages with patient-friendly language 
  (not technical Joi defaults)
👥 8. STAFF MODULE
src/modules/staff/staff.controller.js
text
You are a healthcare HR backend engineer. Build a comprehensive 
staff management controller for a Hospital Management System 
following the thin controller pattern.

Implement these controller methods:

Staff Profile Management:
1.  onboardStaff(req, res, next)
2.  getStaffById(req, res, next)
3.  updateStaffProfile(req, res, next)
4.  deactivateStaff(req, res, next) — offboarding, admin only
5.  reactivateStaff(req, res, next) — admin only
6.  listStaff(req, res, next) — paginated, filtered by role/dept
7.  getStaffByDepartment(req, res, next)
8.  uploadStaffDocument(req, res, next) — certificates, ID proof
9.  getStaffDocuments(req, res, next)
10. getMyProfile(req, res, next) — authenticated staff own profile
11. updateMyProfile(req, res, next) — limited self-edit fields

Attendance:
12. checkIn(req, res, next) — attendance marking
13. checkOut(req, res, next)
14. getAttendanceByStaff(req, res, next)
15. getAttendanceByDate(req, res, next)
16. correctAttendance(req, res, next) — admin correction with reason
17. getAttendanceSummary(req, res, next) — monthly summary
18. getAbsenteeReport(req, res, next)

Shifts:
19. createShift(req, res, next)
20. getShiftSchedule(req, res, next) — weekly view
21. assignShift(req, res, next)
22. updateShiftAssignment(req, res, next)
23. getMyShifts(req, res, next) — authenticated staff's shifts
24. swapShiftRequest(req, res, next)
25. approveShiftSwap(req, res, next) — manager action

Leave Management:
26. applyLeave(req, res, next)
27. getLeaveById(req, res, next)
28. getMyLeaves(req, res, next)
29. approveLeave(req, res, next) — manager/admin
30. rejectLeave(req, res, next) — manager/admin with reason
31. cancelLeave(req, res, next) — staff cancel own pending leave
32. getLeaveBalance(req, res, next)
33. getLeaveReport(req, res, next) — admin report

Payroll:
34. processPayroll(req, res, next) — admin/accountant action
35. getPayslipById(req, res, next)
36. getMyPayslips(req, res, next)
37. getPayslipPDF(req, res, next) — stream from S3
38. getPayrollReport(req, res, next)

Training & Certification:
39. scheduleTraining(req, res, next)
40. markTrainingAttendance(req, res, next)
41. uploadCertification(req, res, next)
42. getExpiringCertifications(req, res, next)
43. getStaffTrainingReport(req, res, next)

Performance:
44. getStaffPerformanceReport(req, res, next)
45. addPerformanceNote(req, res, next) — manager adds note

Requirements:
- checkIn/checkOut: capture IP address from req.ip 
  and attach to service call for location validation
- getMyPayslips: enforce ownership — only req.user.id's payslips
- processPayroll: admin only, require month and year params, 
  validate not already processed for that period
- getPayslipPDF: validate staff can only download own payslip, 
  admin can download any
- deactivateStaff: require reason body param, 
  auto-revoke all active sessions via service
- All wrapped in try/catch → next(error)
- Use sendSuccess from response.util.js consistently
- Add @description, @access JSDoc on every method
src/modules/staff/staff.routes.js
text
You are an HR API security engineer. Build staff management 
routes for a Hospital Management System with role-based access 
for HR operations.

Mount under /api/v1/staff

Profile routes:
POST   /                              → ADMIN, HR
GET    /                              → ADMIN, HR
GET    /my/profile                    → all authenticated staff
PUT    /my/profile                    → all authenticated staff
GET    /by-department/:deptId         → ADMIN, HR, DEPT_HOD
GET    /:staffId                      → ADMIN, HR, MANAGER
PUT    /:staffId                      → ADMIN, HR
POST   /:staffId/deactivate           → ADMIN only
POST   /:staffId/reactivate           → ADMIN only
POST   /:staffId/documents            → ADMIN, HR (upload middleware)
GET    /:staffId/documents            → ADMIN, HR, STAFF (own)
GET    /:staffId/performance          → ADMIN, HR, STAFF (own)
POST   /:staffId/performance-note     → ADMIN, HR, MANAGER

Attendance:
POST   /attendance/check-in           → all authenticated staff
POST   /attendance/check-out          → all authenticated staff
GET    /attendance/my                 → all authenticated staff
GET    /attendance/date/:date         → ADMIN, HR, MANAGER
GET    /attendance/:staffId           → ADMIN, HR, MANAGER, STAFF (own)
PUT    /attendance/:attendanceId/correct → ADMIN, HR (with reason)
GET    /attendance/:staffId/summary   → ADMIN, HR, STAFF (own)
GET    /attendance/reports/absent     → ADMIN, HR

Shifts:
POST   /shifts                        → ADMIN, HR
GET    /shifts/schedule               → all authenticated
GET    /shifts/my                     → all authenticated staff
POST   /shifts/assign                 → ADMIN, HR, MANAGER
PUT    /shifts/:assignmentId          → ADMIN, HR, MANAGER
POST   /shifts/swap-request           → all authenticated staff
PUT    /shifts/swap/:swapId/approve   → ADMIN, HR, MANAGER
PUT    /shifts/swap/:swapId/reject    → ADMIN, HR, MANAGER

Leave:
POST   /leave/apply                   → all authenticated staff
GET    /leave/my                      → all authenticated staff
GET    /leave/balance                 → all authenticated staff
GET    /leave/:leaveId                → ADMIN, HR, MANAGER, STAFF (own)
PUT    /leave/:leaveId/approve        → ADMIN, HR, MANAGER
PUT    /leave/:leaveId/reject         → ADMIN, HR, MANAGER
DELETE /leave/:leaveId                → STAFF (own, pending only)
GET    /leave/reports/summary         → ADMIN, HR

Payroll:
POST   /payroll/process               → ADMIN, ACCOUNTANT
GET    /payroll/my                    → all authenticated staff
GET    /payroll/my/:payslipId         → all authenticated staff
GET    /payroll/my/:payslipId/pdf     → all authenticated staff
GET    /payroll/:staffId              → ADMIN, ACCOUNTANT
GET    /payroll/:staffId/:payslipId/pdf → ADMIN, ACCOUNTANT
GET    /payroll/reports/monthly       → ADMIN, ACCOUNTANT

Training:
POST   /training                      → ADMIN, HR
POST   /training/:trainingId/attend   → all authenticated staff
POST   /training/:trainingId/certifications → ADMIN, HR (upload middleware)
GET    /training/certifications/expiring → ADMIN, HR
GET    /training/reports              → ADMIN, HR

Middleware chain: authenticate → authorize(permission) → validate → controller
Apply auditMiddleware on: deactivate, payroll process, 
attendance correction, leave approve/reject
Apply uploadMiddleware on document and certification upload routes
Payroll routes: apply additionalAccountantVerify middleware
src/modules/staff/staff.validator.js
text
You are an HR data validation specialist. Build comprehensive 
Joi validation schemas for all staff management endpoints 
in a Hospital Management System.

Create and export these schemas:

onboardStaffSchema:
- firstName: required string, alpha + spaces only, min:2 max:50
- lastName: required string, alpha + spaces only, min:2 max:50
- email: required valid email, unique (validated in service)
- phone: required valid phone with country code
- alternatePhone: optional valid phone
- role: required enum [DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN,
  RECEPTIONIST, ACCOUNTANT, STAFF, HR, MANAGER, SECURITY]
- departmentId: required uuid
- designation: required string min:3 max:100
- employmentType: required enum [permanent, contract, 
  visiting, intern, probation]
- joiningDate: required date, cannot be future more than 7 days
- salary: required integer min:0 (paise per month)
- shiftPreference: optional enum [morning, afternoon, night, any]
- qualification: required array min:1, each:
  {degree: string required, institution: string required, 
   year: integer min:1950 max:currentYear required}
- gender: required enum [male, female, other]
- dateOfBirth: required date, must be at least 18 years ago
- address: required object {street, city, state, pincode, country}
- emergencyContact: required object 
  {name: string required, phone: required, relation: string required}
- aadhaarNumber: optional 12-digit string
- panNumber: optional PAN format validation (AAAAA9999A)
- bankDetails: optional object 
  {accountNumber: string, ifscCode: string pattern /^[A-Z]{4}0[A-Z0-9]{6}$/, 
   bankName: string, accountHolderName: string}
- pfNumber: optional string
- esiNumber: optional string

applyLeaveSchema:
- leaveType: required enum [casual, sick, earned, maternity, 
  paternity, emergency, compensatory, unpaid]
- startDate: required date, min today (cannot apply for past)
- endDate: required date, must be >= startDate
- reason: required string min:10 max:500
- isHalfDay: boolean default false
- halfDaySession: enum [morning, afternoon], 
  required if isHalfDay true, endDate must equal startDate
- medicalCertificate: optional string (S3 URL), 
  required if leaveType is sick and duration > 2 days
- emergencyContactDuringLeave: optional object 
  {name: string, phone: valid phone}
- Validate max leave days per type:
  casual: max 3 consecutive, sick: max 30, earned: max 15 per application

checkInSchema:
- staffId: auto from req.user.id
- checkInTime: optional datetime (if manual entry — 
  otherwise server time used)
- biometricHash: optional string (if biometric system)
- ipAddress: auto from req.ip
- notes: optional string max:200
- locationOverride: boolean default false 
  (allow check-in outside hospital network with reason)

shiftAssignmentSchema:
- staffId: required uuid
- shiftType: required enum [morning, afternoon, night, 
  on_call, split]
- startDate: required date, min today
- endDate: required date, must be after startDate, max 90 days
- weekDays: required array of enum 
  [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
  min:1
- departmentId: required uuid
- wardId: optional uuid (for nurses)
- notes: optional string max:300
- Validate: endDate - startDate max 90 days

processPayrollSchema:
- month: required integer min:1 max:12
- year: required integer min:2020 max:currentYear
- departmentId: optional uuid (if processing per department)
- includeBonus: boolean default false
- bonusAmount: integer min:0, required if includeBonus true
- bonusReason: string min:5, required if includeBonus true
- processedBy: auto from req.user.id
- Validate: cannot process future months

attendanceCorrectionSchema:
- attendanceId: required uuid
- correctedCheckIn: optional datetime
- correctedCheckOut: optional datetime
- reason: required string min:10 max:500
- At least one of correctedCheckIn or correctedCheckOut required
- correctedBy: auto from req.user.id
- supportingDocument: optional string (S3 URL)

scheduleTrainingSchema:
- title: required string min:5 max:200
- description: required string min:10 max:1000
- trainerName: required string min:2 max:100
- trainingType: required enum [induction, safety, clinical, 
  technical, soft_skills, compliance, fire_drill, cpr, hipaa]
- scheduledDate: required datetime, must be future
- durationHours: required number min:0.5 max:40
- venue: required string min:3 max:200
- maxParticipants: required integer min:1 max:500
- targetRoles: required array of role enums min:1
- targetDepartments: optional array of uuid
- isMandatory: boolean default false
- certificationProvided: boolean default false
- expiryMonths: integer min:1 max:60, 
  required if certificationProvided true

Requirements:
- panNumber custom validation: exact regex /^[A-Z]{4}[ABCFGHLJPTF][0-9]{4}[A-Z]$/
- ifscCode custom validation: regex /^[A-Z]{4}0[A-Z0-9]{6}$/
- abortEarly: false, stripUnknown: true on all schemas
- Mask aadhaarNumber and bankDetails in error logs 
  (add stripSensitive: true meta flag)
- Custom messages for all financial fields 
  using clear rupee/paise context
📋 9. DISCHARGE MODULE
src/modules/discharge/discharge.controller.js
text
You are a clinical documentation backend engineer. Build a 
discharge management controller for a Hospital Management System 
handling the complete patient discharge workflow.

Implement these controller methods:

Discharge Initiation:
1.  initiateDischarge(req, res, next)
2.  getDischargeById(req, res, next)
3.  updateDischarge(req, res, next) — only before finalization
4.  cancelDischarge(req, res, next) — patient stays back
5.  getDischargeByAdmission(req, res, next)
6.  listDischarges(req, res, next) — paginated, filtered
7.  getPendingDischarges(req, res, next) — awaiting completion
8.  getDischargeChecklist(req, res, next)
9.  updateDischargeChecklist(req, res, next)

Discharge Summary:
10. createDischargeSummary(req, res, next)
11. updateDischargeSummary(req, res, next) — before 24hr lock
12. getDischargeSummary(req, res, next)
13. getDischargeSummaryPDF(req, res, next) — stream from S3
14. submitSummaryForReview(req, res, next) — doctor submits
15. addSummaryAddendum(req, res, next) — after 24hr lock

Discharge Finalization:
16. finalizeDischarge(req, res, next) — requires checklist 100%
17. confirmDischarge(req, res, next) — double-confirmation step
18. generateDischargeCertificate(req, res, next)
19. getDischargeCertificatePDF(req, res, next) — stream from S3
20. verifyDischargeCertificate(req, res, next) — public endpoint

DAMA (Discharge Against Medical Advice):
21. initiatDAMA(req, res, next)
22. recordDAMAConsent(req, res, next) — upload signed form
23. finalizeDAMA(req, res, next)

Follow-up:
24. scheduleFollowUp(req, res, next)
25. getFollowUpsByPatient(req, res, next)
26. updateFollowUp(req, res, next)
27. sendDischargeInstructions(req, res, next) — email/SMS resend

Analytics:
28. getDischargeAnalytics(req, res, next)
29. getAverageStayReport(req, res, next)
30. getReadmissionReport(req, res, next)
31. getDischargeSummaryComplianceReport(req, res, next)

Requirements:
- finalizeDischarge: validate checklist 100% complete + 
  bill PAID/insurance_approved + summary complete — 
  all in controller before service call, return detailed 
  400 error listing what's pending
- confirmDischarge: require additional body param 
  {confirmed: true, confirmationCode} as double-confirmation gate
- verifyDischargeCertificate: PUBLIC endpoint (no auth), 
  only returns: validity, patientName (masked), hospitalName
- getDischargeSummaryPDF: log access in audit trail 
  (medical-legal document access tracking)
- All DAMA endpoints: apply enhanced auditMiddleware 
  with medico-legal flag
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/discharge/discharge.routes.js
text
You are a clinical API design engineer. Build patient discharge 
management routes for a Hospital Management System with 
medico-legal compliance requirements.

Mount under /api/v1/discharge

Discharge Workflow:
POST   /initiate                         → DOCTOR, ADMIN
GET    /                                 → DOCTOR, NURSE, ADMIN
GET    /pending                          → DOCTOR, NURSE, ADMIN
GET    /:dischargeId                     → DOCTOR, NURSE, ADMIN
PUT    /:dischargeId                     → DOCTOR, ADMIN
DELETE /:dischargeId/cancel              → DOCTOR, ADMIN (with reason)
GET    /admission/:admissionId           → DOCTOR, NURSE, ADMIN
GET    /:dischargeId/checklist           → DOCTOR, NURSE, ADMIN
PUT    /:dischargeId/checklist           → NURSE, DOCTOR, ADMIN

Discharge Summary:
POST   /:dischargeId/summary             → DOCTOR only
PUT    /:dischargeId/summary             → DOCTOR only (before 24hr)
GET    /:dischargeId/summary             → DOCTOR, ADMIN, PATIENT (own)
GET    /:dischargeId/summary/pdf         → DOCTOR, ADMIN, PATIENT (own)
POST   /:dischargeId/summary/submit      → DOCTOR only
POST   /:dischargeId/summary/addendum    → DOCTOR (post-lock)

Finalization:
POST   /:dischargeId/finalize            → DOCTOR, ADMIN
POST   /:dischargeId/confirm             → ADMIN only 
                                           (double-confirmation required)
GET    /:dischargeId/certificate         → ADMIN, DOCTOR, PATIENT (own)
GET    /:dischargeId/certificate/pdf     → ADMIN, DOCTOR, PATIENT (own)

Discharge Certificate Verification (PUBLIC):
GET    /verify/:certificateNumber        → NO AUTH (public verification)

DAMA Routes:
POST   /:dischargeId/dama/initiate       → DOCTOR, ADMIN
POST   /:dischargeId/dama/consent        → DOCTOR, ADMIN 
                                           (upload DAMA form)
POST   /:dischargeId/dama/finalize       → DOCTOR, ADMIN

Follow-up:
POST   /:dischargeId/follow-up           → DOCTOR, ADMIN
GET    /follow-ups/patient/:patientId    → DOCTOR, ADMIN, PATIENT (own)
PUT    /follow-ups/:followUpId           → DOCTOR, ADMIN
POST   /:dischargeId/instructions/resend → DOCTOR, ADMIN, NURSE

Analytics:
GET    /analytics/summary                → ADMIN
GET    /analytics/average-stay           → ADMIN, DOCTOR
GET    /analytics/readmissions           → ADMIN, DOCTOR
GET    /analytics/compliance             → ADMIN

Middleware chain: authenticate → authorize → validate → controller
Apply auditMiddleware on ALL discharge write routes 
  (every action is medico-legal record)
Apply enhanced auditMiddleware on DAMA routes 
  (flag as DAMA_CRITICAL in audit log)
Apply uploadMedicalDocument middleware on /dama/consent route
/verify/:certificateNumber: NO authenticate middleware 
  (public endpoint) but apply strictRateLimiter (10 req/min per IP)
PDF endpoints: log access to audit trail via middleware
src/modules/discharge/discharge.validator.js
text
You are a clinical documentation validation specialist. Build 
Joi validation schemas for all discharge module endpoints 
ensuring medico-legal data completeness.

Create and export these schemas:

initiateDischargeSchema:
- patientId: required uuid
- admissionId: required uuid
- anticipatedDischargeDate: required date, min today
- anticipatedDischargeTime: required HH:MM string
- dischargeType: required enum [regular, against_medical_advice, 
  transfer_to_facility, deceased, absconded]
- primaryDoctorId: required uuid
- estimatedBillAmount: optional integer min:0 (paise)
- insuranceClaimInitiated: boolean default false
- notes: optional string max:500

createDischargeSummarySchema:
- dischargeId: from params, uuid
- admissionDiagnosis: required string min:5 max:500
- finalDiagnosis: required array min:1 max:10, each:
  {icd10Code: optional string, description: required string min:3}
- clinicalCourse: required string min:50 max:5000 
  (narrative of patient's hospital stay)
- proceduresPerformed: optional array max:20, each:
  {procedureName: string required, date: date required, 
   outcome: string required, surgeon: string optional}
- significantLabValues: optional array max:30, each:
  {testName: string required, value: string required, 
   unit: string required, date: date required, 
   isAbnormal: boolean default false}
- medicationsDuringStay: optional array max:50
- dischargeMedications: required array min:0 max:30, each:
  {name: string required, dosage: string required,
   frequency: string required, duration: string required,
   instructions: string optional}
- dietaryInstructions: required string min:5 max:1000
- activityInstructions: required string min:5 max:1000
- woundCareInstructions: optional string max:500
- warningSymptoms: required array min:1 max:20 of strings 
  (symptoms to watch for and return to hospital)
- dischargeCondition: required enum [recovered, improved, 
  same, deteriorated, deceased]
- complications: optional string max:1000
- followUpDate: optional date, must be future
- followUpDepartment: optional string
- referralNotes: optional string max:500
- restrictions: optional object 
  {driving: boolean, alcohol: boolean, smoking: boolean,
   workRestrictionDays: integer min:0}

updateChecklistSchema:
- dischargeId: from params, uuid
- checklist: required object with all boolean values:
  {
    finalDiagnosisConfirmed: boolean,
    dischargeSummaryComplete: boolean,
    dischargeMedicationsPrescribed: boolean,
    allInvestigationsReviewed: boolean,
    billGenerated: boolean,
    billPaidOrInsuranceApproved: boolean,
    insurancePreClearance: boolean,
    followUpScheduled: boolean,
    patientCounselingDone: boolean,
    familyCounselingDone: boolean,
    dischargeInstructionsGiven: boolean,
    valuablesReturned: boolean,
    consentFormsComplete: boolean
  }
- updatedBy: auto from req.user.id

finalizeDischargeSchema:
- dischargeId: from params, uuid
- actualDischargeTime: required datetime, cannot be future
- transportArrangement: required enum [own, ambulance, 
  hospital_vehicle, public]
- escortedBy: optional string
- finalNotes: optional string max:500

confirmDischargeSchema:
- dischargeId: from params, uuid
- confirmed: required boolean, must be exactly true
- confirmationCode: required string 
  (6-digit code generated and shown on finalize response)
- confirmedBy: auto from req.user.id

initiatDAMASchema:
- dischargeId: from params, uuid
- reasonGivenByPatient: required string min:10 max:1000
- doctorRecommendation: required string min:10 max:1000
- risksExplained: required boolean, must be true
- patientUnderstoodRisks: required boolean, must be true
- witnessName: required string min:2 max:100
- witnessRelation: required string min:2 max:50
- legalGuardianRequired: boolean default false

scheduleFollowUpSchema:
- dischargeId: from params, uuid
- followUpDate: required date, must be future
- followUpTime: required HH:MM
- doctorId: required uuid
- departmentId: required uuid
- purpose: required string min:5 max:500
- reminderDays: required array of integers 
  (days before appointment to send reminder, e.g., [7, 2, 1])
- notes: optional string max:500

Requirements:
- admissionDiagnosis vs finalDiagnosis: add validation hint 
  in schema meta if they differ (flag for clinical review)
- dischargeCondition = deceased: trigger special validation 
  requiring timeOfDeath and causeOfDeath fields
- confirmed in confirmDischargeSchema must be boolean true 
  (not truthy string — strict validation)
- abortEarly: false, stripUnknown: true
- Add MEDICO_LEGAL meta flag to DAMA schemas for audit middleware
- Custom messages using clinical language
📦 10. INVENTORY MODULE
src/modules/inventory/inventory.controller.js
text
You are a supply chain backend engineer. Build a comprehensive 
inventory management controller for a Hospital Management System 
handling medical supplies, equipment, and consumables.

Implement these controller methods:

Item Management:
1.  addInventoryItem(req, res, next)
2.  getInventoryItemById(req, res, next)
3.  updateInventoryItem(req, res, next)
4.  deactivateItem(req, res, next) — soft delete
5.  listInventoryItems(req, res, next) — paginated, filtered
6.  searchInventoryItems(req, res, next)
7.  getLowStockAlerts(req, res, next)
8.  getExpiringItems(req, res, next)
9.  getInventoryValuation(req, res, next)
10. uploadItemSpecSheet(req, res, next) — S3 upload

Stock Operations:
11. getStockById(req, res, next)
12. getStockByItem(req, res, next) — all batches
13. issueStock(req, res, next) — issue to department/ward
14. returnStock(req, res, next) — returned from department
15. adjustStock(req, res, next) — manual adjustment with reason
16. conductStockAudit(req, res, next)
17. getStockMovementHistory(req, res, next)
18. getIssuanceHistory(req, res, next)

Purchase Request:
19. raisePurchaseRequest(req, res, next)
20. getPurchaseRequestById(req, res, next)
21. listPurchaseRequests(req, res, next)
22. approvePurchaseRequest(req, res, next) — HOD/Admin
23. rejectPurchaseRequest(req, res, next) — with reason
24. cancelPurchaseRequest(req, res, next)

Purchase Order:
25. createPurchaseOrder(req, res, next)
26. getPurchaseOrderById(req, res, next)
27. listPurchaseOrders(req, res, next)
28. updatePurchaseOrder(req, res, next) — before sending to vendor
29. sendPOToVendor(req, res, next) — email PO PDF to vendor
30. cancelPurchaseOrder(req, res, next)
31. getPurchaseOrderPDF(req, res, next) — stream from S3

GRN (Goods Receipt):
32. receiveInventory(req, res, next) — GRN against PO
33. getGRNById(req, res, next)
34. listGRNs(req, res, next)
35. getGRNDiscrepancyReport(req, res, next)

Reports:
36. getInventoryDashboard(req, res, next)
37. getConsumptionReport(req, res, next)
38. getDeadStockReport(req, res, next)
39. getPurchaseOrderReport(req, res, next)
40. exportInventoryReport(req, res, next) — Excel/PDF

Requirements:
- issueStock: validate requesting department exists 
  and requester belongs to that department
- conductStockAudit: returns diff report immediately 
  but saves audit record for finalization
- approvePurchaseRequest: multi-level approval 
  — controller checks amount threshold and required approver role
- sendPOToVendor: call email service directly from controller 
  after service returns PO data
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
- getLowStockAlerts: cache in Redis 5 min, 
  include cache metadata in response
src/modules/inventory/inventory.routes.js
text
You are a supply chain API engineer. Build inventory management 
routes for a Hospital Management System with procurement workflow.

Mount under /api/v1/inventory

Item Management:
POST   /items                             → ADMIN, INVENTORY_MANAGER
GET    /items                             → all authenticated staff
GET    /items/search                      → all authenticated staff
GET    /items/low-stock                   → ADMIN, INVENTORY_MANAGER
GET    /items/expiring                    → ADMIN, INVENTORY_MANAGER
GET    /items/valuation                   → ADMIN, ACCOUNTANT
GET    /items/:itemId                     → all authenticated staff
PUT    /items/:itemId                     → ADMIN, INVENTORY_MANAGER
DELETE /items/:itemId                     → ADMIN only
POST   /items/:itemId/spec-sheet          → ADMIN, INVENTORY_MANAGER 
                                            (upload middleware)

Stock Operations:
GET    /stock/:itemId                     → ADMIN, INVENTORY_MANAGER
GET    /stock/:itemId/history             → ADMIN, INVENTORY_MANAGER
POST   /stock/issue                       → ADMIN, INVENTORY_MANAGER, DEPT_HOD
POST   /stock/return                      → ADMIN, INVENTORY_MANAGER
POST   /stock/adjust                      → ADMIN only (with reason)
POST   /stock/audit                       → ADMIN, INVENTORY_MANAGER
GET    /stock/issuance-history            → ADMIN, INVENTORY_MANAGER

Purchase Requests:
POST   /purchase-requests                 → all authenticated staff
GET    /purchase-requests                 → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /purchase-requests/:prId           → ADMIN, INVENTORY_MANAGER, 
                                            REQUESTER (own)
PUT    /purchase-requests/:prId/approve   → ADMIN, HOD 
                                            (amount-based role check)
PUT    /purchase-requests/:prId/reject    → ADMIN, HOD
DELETE /purchase-requests/:prId           → REQUESTER (own, pending only)

Purchase Orders:
POST   /purchase-orders                   → ADMIN, INVENTORY_MANAGER
GET    /purchase-orders                   → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /purchase-orders/:poId             → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /purchase-orders/:poId/pdf         → ADMIN, INVENTORY_MANAGER
PUT    /purchase-orders/:poId             → ADMIN, INVENTORY_MANAGER (draft only)
POST   /purchase-orders/:poId/send        → ADMIN, INVENTORY_MANAGER
DELETE /purchase-orders/:poId             → ADMIN only

GRN (Goods Receipt):
POST   /grn                              → ADMIN, INVENTORY_MANAGER
GET    /grn                              → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /grn/:grnId                       → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /grn/:grnId/discrepancy           → ADMIN, INVENTORY_MANAGER

Dashboard & Reports:
GET    /dashboard                        → ADMIN, INVENTORY_MANAGER
GET    /reports/consumption              → ADMIN, INVENTORY_MANAGER
GET    /reports/dead-stock               → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /reports/purchase-orders          → ADMIN, ACCOUNTANT
GET    /reports/export                   → ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on: issue, return, adjust, receive GRN
Apply uploadInventoryDoc middleware on spec-sheet route
Multi-level approval on purchase-requests:
  inject amountThresholdCheck middleware before approve handler
src/modules/inventory/inventory.validator.js
text
You are a supply chain data validation engineer. Build Joi 
validation schemas for all inventory management endpoints 
in a Hospital Management System.

Create and export these schemas:

addInventoryItemSchema:
- itemName: required string min:3 max:200
- itemCode: optional string, auto-generated if not provided
- category: required enum [medical_supply, equipment, 
  surgical, ppe, housekeeping, office, linen, 
  laboratory, pharmacy_consumable, maintenance]
- subCategory: optional string max:100
- unitOfMeasure: required enum [pieces, boxes, strips, 
  vials, bottles, packets, kg, grams, liters, ml, 
  meters, pairs, sets, rolls]
- manufacturer: optional string max:200
- brand: optional string max:100
- specifications: optional string max:1000
- storageLocation: required object 
  {building: optional, floor: optional, room: required, 
   shelf: optional, bin: optional}
- storageTemperature: optional enum 
  [room_temp, refrigerated_2_8, frozen, cold_chain]
- reorderLevel: required integer min:0
- minimumQuantity: required integer min:0
- maximumQuantity: required integer min:1
- Validate: maximumQuantity > reorderLevel > minimumQuantity
- hsnCode: optional 4-8 digit string
- gstPercentage: optional enum [0, 5, 12, 18, 28]
- isControlled: boolean default false
- requiresDualAuthorization: boolean default false
- preferredVendors: optional array of uuids max:5
- notes: optional string max:500

issueStockSchema:
- itemId: required uuid
- quantity: required number min:0.01
- issuedTo: required object 
  {type: enum[ward, department, ot, emergency, lab, 
    pharmacy, staff] required, 
   id: uuid required (wardId/deptId based on type)}
- purpose: required enum [patient_care, maintenance, 
  administrative, research, training, emergency]
- requestedBy: optional uuid
- patientId: optional uuid (if issued for specific patient)
- notes: optional string max:300
- batchPreference: optional string (specific batch number)

adjustStockSchema:
- itemId: required uuid
- adjustmentType: required enum [addition, deduction, 
  damaged, expired, audit_correction, theft, transfer]
- quantity: required number min:0.01
- reason: required string min:10 max:500
- referenceDocument: optional string 
  (audit report number / insurance claim / police report)
- batchNumber: optional string
- approvedBy: auto from req.user.id (admin only)
- supportingDocumentUrl: optional string (S3 URL)

raisePurchaseRequestSchema:
- items: required array min:1 max:50, each:
  {itemId: uuid required,
   quantity: number required min:0.01,
   estimatedUnitCost: optional integer (paise),
   urgency: enum[routine, urgent, emergency] required,
   justification: string min:5 max:300 required}
- departmentId: required uuid
- requiredByDate: required date, min tomorrow
- overallUrgency: required enum [routine, urgent, emergency]
- overallJustification: required string min:10 max:1000
- budgetCode: optional string max:50
- requestedBy: auto from req.user.id

createPurchaseOrderSchema:
- purchaseRequestId: optional uuid 
  (if converting from PR — some POs raised directly)
- vendorId: required uuid
- items: required array min:1 max:100, each:
  {itemId: uuid required,
   quantity: number required min:0.01,
   unitPrice: integer required min:0 (paise),
   gstPercentage: enum[0,5,12,18,28] required,
   discount: number min:0 max:100 default 0,
   deliveryDate: date required, must be future}
- billingAddress: required string min:10 max:500
- deliveryAddress: required string min:10 max:500
- paymentTerms: required enum [advance, net_30, net_60, 
  on_delivery, milestone_based]
- specialInstructions: optional string max:1000
- budgetCode: optional string max:50

receiveInventorySchema (GRN):
- purchaseOrderId: required uuid
- grnDate: required datetime, cannot be future
- deliveryNote: optional string max:100 (vendor delivery note number)
- items: required array min:1, each:
  {itemId: uuid required,
   orderedQuantity: number required,
   receivedQuantity: number required min:0,
   rejectedQuantity: number default 0,
   batchNumber: required string,
   manufacturingDate: optional date,
   expiryDate: optional date, if provided must be future,
   condition: required enum [good, damaged, short_expiry, 
     wrong_item, quantity_mismatch],
   rejectionReason: string, required if rejectedQuantity > 0,
   unitCost: required integer min:0}
- receivedBy: auto from req.user.id
- qualityCheckDone: required boolean
- qualityCheckNotes: optional string max:500
- invoiceNumber: required string max:100
- invoiceDate: required date, cannot be future

Requirements:
- Validate maximumQuantity > reorderLevel > minimumQuantity 
  with descriptive error for each comparison
- issueStockSchema: quantity must not exceed available 
  stock (validation hint — actual check in service)
- grnSchema: sum of receivedQuantity + rejectedQuantity 
  must equal orderedQuantity (with tolerance of ±5%)
- abortEarly: false, stripUnknown: true
- Add custom error for expiryDate: 
  "Expiry date must be at least 30 days from today for new stock"
📡 11. NOTIFICATIONS MODULE
src/modules/notifications/notification.controller.js
text
You are a communication systems backend engineer. Build a 
notification management controller for a Hospital Management 
System handling all multi-channel communications.

Implement these controller methods:

Send Notifications:
1.  sendNotification(req, res, next) — single notification dispatch
2.  sendBulkNotification(req, res, next) — to role/dept group
3.  sendEmergencyBroadcast(req, res, next) — all staff instantly
4.  resendFailedNotification(req, res, next) — retry failed delivery
5.  sendTestNotification(req, res, next) — dev/admin testing

In-App Notifications:
6.  getMyNotifications(req, res, next) — authenticated user's inbox
7.  getNotificationById(req, res, next)
8.  markAsRead(req, res, next)
9.  markAllAsRead(req, res, next)
10. deleteNotification(req, res, next) — soft delete
11. deleteAllRead(req, res, next)
12. getUnreadCount(req, res, next) — for badge display
13. getNotificationHistory(req, res, next) — all sent/received

Templates:
14. getNotificationTemplates(req, res, next)
15. getTemplateById(req, res, next)
16. createTemplate(req, res, next)
17. updateTemplate(req, res, next)
18. deleteTemplate(req, res, next)
19. previewTemplate(req, res, next) — render with sample data

Preferences:
20. getMyPreferences(req, res, next)
21. updateMyPreferences(req, res, next)
22. getPreferencesByUser(req, res, next) — admin view
23. updatePreferencesByUser(req, res, next) — admin override

Device Tokens:
24. registerDeviceToken(req, res, next) — FCM push token
25. updateDeviceToken(req, res, next)
26. removeDeviceToken(req, res, next)
27. getMyDevices(req, res, next)

Delivery Tracking:
28. getDeliveryStatus(req, res, next) — per notification
29. getBulkDeliveryReport(req, res, next) — per bulk send
30. getFailedNotifications(req, res, next) — admin view

Reports:
31. getNotificationStats(req, res, next) — delivery rates
32. getChannelPerformanceReport(req, res, next)

Requirements:
- sendEmergencyBroadcast: synchronous Socket.io broadcast 
  before queuing email/SMS, respond immediately
- getUnreadCount: serve from Redis counter, 
  not DB query (performance critical — called frequently)
- markAsRead: update Redis counter simultaneously 
  with DB update
- registerDeviceToken: validate FCM token format, 
  prevent duplicate tokens across users
- sendBulkNotification: validate recipient list size max 10000, 
  return jobId for tracking
- All notifications containing PHI: validate requester 
  has access permission to that patient data
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/notifications/notification.routes.js
text
You are a communication API engineer. Build notification 
management routes for a Hospital Management System.

Mount under /api/v1/notifications

Send Notifications (Staff/Admin):
POST   /send                        → ADMIN, SUPER_ADMIN
POST   /send/bulk                   → ADMIN, SUPER_ADMIN
POST   /send/emergency              → ADMIN, SUPER_ADMIN, DOCTOR (ER)
POST   /send/test                   → ADMIN, SUPER_ADMIN (dev/staging only)
POST   /:notificationId/resend      → ADMIN

In-App Inbox (all authenticated):
GET    /my                          → all authenticated
GET    /my/unread-count             → all authenticated
GET    /my/:notificationId          → all authenticated (own)
PUT    /my/:notificationId/read     → all authenticated (own)
PUT    /my/read-all                 → all authenticated
DELETE /my/:notificationId          → all authenticated (own)
DELETE /my/read/clear               → all authenticated

Admin - All notifications:
GET    /history                     → ADMIN, SUPER_ADMIN
GET    /failed                      → ADMIN
GET    /:notificationId/delivery    → ADMIN
GET    /bulk/:jobId/report          → ADMIN

Templates:
GET    /templates                   → ADMIN, SUPER_ADMIN
GET    /templates/:templateId       → ADMIN, SUPER_ADMIN
POST   /templates                   → ADMIN, SUPER_ADMIN
PUT    /templates/:templateId       → ADMIN, SUPER_ADMIN
DELETE /templates/:templateId       → SUPER_ADMIN only
POST   /templates/:templateId/preview → ADMIN, SUPER_ADMIN

User Preferences:
GET    /preferences/my              → all authenticated
PUT    /preferences/my              → all authenticated
GET    /preferences/:userId         → ADMIN
PUT    /preferences/:userId         → ADMIN

Device Tokens (Push Notifications):
POST   /devices/register            → all authenticated
PUT    /devices/:tokenId            → all authenticated (own)
DELETE /devices/:tokenId            → all authenticated (own)
GET    /devices/my                  → all authenticated

Delivery Reports:
GET    /reports/stats               → ADMIN, SUPER_ADMIN
GET    /reports/channel-performance → ADMIN, SUPER_ADMIN

Webhook callbacks (no auth — signature validation):
POST   /webhooks/sms-delivery       → SMS gateway delivery callback
POST   /webhooks/email-bounce       → SES bounce/complaint callback
POST   /webhooks/push-delivery      → FCM delivery callback

Middleware:
- All inbox routes: apply lightweight userContextMiddleware 
  (attach userId for filtering)
- /send/emergency: apply emergencyLimiter (no throttle)
- /send/bulk: apply bulkNotificationRateLimiter 
  (max 3 bulk sends per hour per admin)
- Webhook routes: bypass authenticate, 
  apply respective signature validators
- Template routes: apply superAdminOrAdmin check
- All send routes: apply auditMiddleware
src/modules/notifications/notification.validator.js
text
You are a communication systems data validation specialist. 
Build Joi validation schemas for all notification module endpoints.

Create and export these schemas:

sendNotificationSchema:
- recipientId: required uuid (userId)
- type: required enum [info, warning, success, critical, 
  appointment, billing, lab_result, prescription, 
  emergency, shift, leave, system]
- title: required string min:3 max:100
- message: required string min:5 max:500
- channels: required array min:1 of enum 
  [in_app, email, sms, push]
- priority: required enum [low, medium, high, critical]
- templateId: optional uuid (if using template)
- templateData: optional object (key-value for template vars)
- metadata: optional object (additional context data)
- scheduledAt: optional datetime, must be future 
  (if provided, queues for later delivery)
- expiresAt: optional datetime, must be after scheduledAt
- actionUrl: optional valid URL (deep link for push/email)
- Note: If channels includes email, title becomes subject
- Note: If channels includes sms, message must be max 160 chars
  (add warning if exceeded — service will split)

sendBulkNotificationSchema:
- recipientGroup: required object (at least one selector):
  {roleIds: optional array of role enums,
   departmentIds: optional array of uuids,
   wardIds: optional array of uuids,
   userIds: optional array of uuids max:10000,
   all: optional boolean (sends to all active users)}
- type: required enum (same as sendNotification)
- title: required string min:3 max:100
- message: required string min:5 max:500
- channels: required array min:1 of enum
- priority: required enum
- templateId: optional uuid
- templateData: optional object
- Note: Cannot use 'all: true' without SUPER_ADMIN role 
  (enforced in middleware)

sendEmergencyBroadcastSchema:
- message: required string min:10 max:500
- broadcastType: required enum [CODE_BLUE, CODE_RED, 
  CODE_PINK, FIRE_ALERT, EVACUATION, MCI, CUSTOM]
- location: required string min:3 max:200
- targetGroups: optional array of enum [all_staff, doctors, 
  nurses, security, admin, er_team, ot_team]
  default: [all_staff]
- additionalInfo: optional string max:500

createTemplateSchema:
- name: required string min:3 max:100, unique
- type: required enum (same notification types)
- subject: required string min:3 max:200 
  (email subject with Handlebars variables: {{patientName}})
- emailBody: required string min:10 max:50000 
  (HTML with Handlebars)
- smsBody: required string min:5 max:160 
  (plain text with Handlebars)
- pushTitle: required string min:3 max:65
- pushBody: required string min:5 max:240
- availableVariables: required array of strings 
  (list of Handlebars variables this template uses)
- category: required enum [patient, staff, admin, system]
- isActive: boolean default true
- Validate Handlebars syntax in emailBody: 
  check for unclosed tags

updatePreferencesSchema:
- emailEnabled: optional boolean
- smsEnabled: optional boolean
- pushEnabled: optional boolean
- inAppEnabled: optional boolean default true 
  (cannot disable in-app)
- notificationTypes: optional object, each type key maps to:
  {email: boolean, sms: boolean, push: boolean}
- quietHoursEnabled: optional boolean
- quietHoursStart: optional HH:MM string
- quietHoursEnd: optional HH:MM string
- Validate: if quietHoursEnabled true, 
  both quietHoursStart and quietHoursEnd are required
- language: optional enum [english, hindi, tamil, 
  telugu, kannada, bengali, marathi]

registerDeviceTokenSchema:
- token: required string min:100 max:500 
  (FCM device token — long alphanumeric string)
- deviceType: required enum [android, ios, web]
- deviceName: optional string max:100
- appVersion: optional string max:20
- osVersion: optional string max:20
- isActive: boolean default true

Requirements:
- For sms channel: automatically trim message to 160 chars 
  or return warning (not error) if exceeded
- sendEmergencyBroadcastSchema: add URGENT meta flag 
  for audit middleware identification
- templateData must be object
Claude Sonnet 4.6
complete src/modules/notifications/notification.validator.js this & rest modules also


Thought Process
expand
✅ Completing All Remaining Prompts — Notifications Validator + Full Reports Module
📡 11. NOTIFICATIONS MODULE (Completing Validator)
src/modules/notifications/notification.validator.js — COMPLETE
text
You are a communication systems data validation specialist. 
Build Joi validation schemas for all notification module endpoints
in a Hospital Management System.

Create and export these schemas:

sendNotificationSchema:
- recipientId: required uuid (userId)
- type: required enum [info, warning, success, critical,
  appointment, billing, lab_result, prescription,
  emergency, shift, leave, system]
- title: required string min:3 max:100
- message: required string min:5 max:500
- channels: required array min:1 of enum
  [in_app, email, sms, push]
- priority: required enum [low, medium, high, critical]
- templateId: optional uuid (if using template)
- templateData: optional object (key-value for template vars)
- metadata: optional object (additional context data)
- scheduledAt: optional datetime, must be future
  (if provided, queues for later delivery)
- expiresAt: optional datetime, must be after scheduledAt
- actionUrl: optional valid URL (deep link for push/email)
- Validate: if channels includes sms,
  message max 160 chars — return warning not error if exceeded
- Validate: if channels includes email,
  title becomes subject — min 5 chars
- Validate: if priority is critical,
  channels must include at least [sms, in_app]
- Validate: scheduledAt cannot be more than 30 days in future
- Validate: expiresAt must be after scheduledAt minimum 1 hour

sendBulkNotificationSchema:
- recipientGroup: required object — at least one field required:
  {
    roleIds: optional array of role enums min:1
      [SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PHARMACIST,
       LAB_TECHNICIAN, RECEPTIONIST, ACCOUNTANT, STAFF, PATIENT],
    departmentIds: optional array of uuids min:1,
    wardIds: optional array of uuids min:1,
    userIds: optional array of uuids min:1 max:10000,
    all: optional boolean
      (all:true only valid for SUPER_ADMIN — enforced in middleware)
  }
- type: required enum (same as sendNotificationSchema)
- title: required string min:3 max:100
- message: required string min:5 max:500
- channels: required array min:1 of enum [in_app, email, sms, push]
- priority: required enum [low, medium, high, critical]
- templateId: optional uuid
- templateData: optional object
- batchSize: optional integer min:10 max:500 default:100
  (how many notifications to process per queue batch)
- delayBetweenBatchesMs: optional integer min:0 max:5000 default:100
- Validate: recipientGroup — at least one selector field must be provided
- Validate: if all:true is set, no other recipientGroup fields allowed

sendEmergencyBroadcastSchema:
- message: required string min:10 max:500
- broadcastType: required enum
  [CODE_BLUE, CODE_RED, CODE_PINK, CODE_ORANGE,
   FIRE_ALERT, EVACUATION, MCI, LOCKDOWN, CUSTOM]
- location: required string min:3 max:200
- targetGroups: optional array of enum
  [all_staff, doctors, nurses, security, admin,
   er_team, ot_team, pharmacy, lab]
  default: [all_staff]
- additionalInfo: optional string max:500
- activatedBy: auto from req.user.id
- Note: Emergency broadcast always forces
  channels: [in_app, sms, push] — cannot be overridden
- Note: Add EMERGENCY_BROADCAST meta flag
  for enhanced audit logging

createTemplateSchema:
- name: required string min:3 max:100
  (unique — service validates uniqueness)
- type: required enum (all notification types)
- emailSubject: required string min:3 max:200
  (supports Handlebars: {{patientName}}, {{doctorName}}, etc.)
- emailBody: required string min:10 max:50000
  (HTML with Handlebars — validate no unclosed {{ tags)
- smsBody: required string min:5 max:160
  (plain text Handlebars — strict 160 char limit)
- pushTitle: required string min:3 max:65
  (push notification title)
- pushBody: required string min:5 max:240
  (push notification body)
- inAppTitle: required string min:3 max:100
- inAppMessage: required string min:5 max:500
- availableVariables: required array of strings min:1
  (document all Handlebars vars: e.g., ['patientName', 'date'])
- category: required enum [patient, staff, admin, system]
- isActive: boolean default true
- tags: optional array of strings max:10 (for searchability)
- Custom Joi extension: validateHandlebars(value)
  — check emailBody and smsBody for unclosed {{ }} tags
  — return error if malformed template syntax found

updateTemplateSchema:
- All fields from createTemplateSchema optional
- Validate: at least one field provided
- name: cannot be changed if template is in active use
  (service validates, validator adds hint in meta)

previewTemplateSchema:
- templateId: required uuid
- sampleData: required object min:1 key-value pair
  (provide values for all availableVariables)
- channels: required array of enum [email, sms, push, in_app]

updatePreferencesSchema:
- emailEnabled: optional boolean
- smsEnabled: optional boolean
- pushEnabled: optional boolean
- inAppEnabled: optional boolean
  (inApp always defaults true — service ignores false for inApp)
- notificationTypes: optional object
  Each key must be valid notification type enum
  Each value is: {email: boolean, sms: boolean,
    push: boolean, inApp: boolean}
- quietHoursEnabled: optional boolean
- quietHoursStart: optional string HH:MM format
- quietHoursEnd: optional string HH:MM format
- Validate: if quietHoursEnabled true →
  both quietHoursStart and quietHoursEnd required
- Validate: quietHoursStart !== quietHoursEnd
- language: optional enum
  [english, hindi, tamil, telugu, kannada, bengali, marathi]
- doNotDisturb: optional boolean (temporary DND override)
- doNotDisturbUntil: optional datetime, must be future
  required if doNotDisturb is true

registerDeviceTokenSchema:
- token: required string min:100 max:500
  (FCM/APNs device token — long alphanumeric)
- deviceType: required enum [android, ios, web]
- deviceName: optional string max:100
  (e.g., "Samsung Galaxy S21", "iPhone 14")
- appVersion: optional string max:20 pattern /^\d+\.\d+\.\d+$/
- osVersion: optional string max:20
- isActive: boolean default true
- Validate: token must be alphanumeric + hyphens/underscores only
- Custom error: "Invalid device token format"

bulkDeliveryReportQuerySchema (query params):
- jobId: required string
- page: optional integer min:1 default:1
- limit: optional integer min:10 max:100 default:50
- status: optional enum [sent, delivered, failed, pending]
- channel: optional enum [email, sms, push, in_app]

notificationHistoryQuerySchema (query params):
- userId: optional uuid
- type: optional enum (notification types)
- channel: optional enum [email, sms, push, in_app]
- status: optional enum [sent, delivered, read, failed, pending]
- priority: optional enum [low, medium, high, critical]
- startDate: optional valid date
- endDate: optional valid date, must be after startDate
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:100 default:20
- Validate: date range max 90 days

resendNotificationSchema:
- notificationId: required uuid
- channels: optional array of enum [email, sms, push]
  (if not provided, resend on original channels)
- reason: required string min:5 max:200
  (why resending — for audit log)

Requirements:
- All schemas: abortEarly: false, stripUnknown: true
- Custom Joi extension for Handlebars validation:
  create validateHandlebars() that checks for
  unclosed {{, mismatched braces, and empty expressions {{}}
- SMS body: add .custom() that counts chars after
  Handlebars substitution estimation and warns if > 160
- For CRITICAL priority: add meta flag criticalAlert: true
  for audit middleware pickup
- For emergency broadcast: add EMERGENCY meta flag
- Custom error messages in plain, professional English
- Export all schemas as named exports
- Add JSDoc above each schema describing its purpose
  and listing required role for context
📊 12. REPORTS MODULE
src/modules/reports/report.service.js — COMPLETE
text
You are a healthcare business intelligence engineer. Build a
complete reporting and analytics service for a Hospital Management
System with executive dashboards, operational reports, and
data export capabilities.

Implement these service functions with full business logic:

getAdminDashboard():
- Real-time stats (mix of Redis cache + live queries):
  * Today's patient counts: OPD, IPD, Emergency, Discharged
  * Current bed occupancy rate (from ward module)
  * Revenue today, this week, this month
    with % change vs previous period
  * Appointments: scheduled, completed, cancelled, no-show today
  * Active doctors on duty, nurses on duty count
  * Pending lab reports count
  * Scheduled surgeries today: pending, in-progress, completed
  * Active emergency cases by triage level
  * Low stock alerts count (pharmacy + inventory)
  * Expiring medicines count (< 90 days)
  * Pending admin approvals: leave, purchase requests, discounts
  * Active ambulance dispatches
  * Pending insurance claims
- Each stat includes: value, previousValue, changePercent,
  trend (up/down/stable), lastUpdatedAt
- Cache full dashboard in Redis for 2 minutes
- Bust cache on any significant event via Socket.io listener
- Return data structured for frontend card components

getDoctorDashboard(doctorId):
- Today's appointments: scheduled, completed, remaining
- Current in-patients under this doctor
- Pending lab results for doctor's patients
- Today's OT schedule (if surgeon)
- Pending prescription renewals
- Telemedicine consultations today + upcoming
- Patient vitals requiring attention (abnormal flags)
- Monthly consultation count + revenue generated
- Cache per doctorId in Redis 3 minutes

getNurseDashboard(wardId, nurseId):
- Patients in assigned ward: total, critical, stable
- Medication administration pending (MAR — Medication Admin Record)
- Vitals due for recording per patient
- Pending doctor orders to execute
- Discharge checklist items pending
- Incoming patient transfers expected
- Bed availability in ward
- Cache per wardId in Redis 1 minute

generatePatientReport(filters, exportFormat):
- Patient demographics: age distribution chart data
  (0-10, 11-20, 21-30, 31-40, 41-50, 51-60, 61-70, 71+)
- Gender distribution: male/female/other percentages
- Blood group distribution
- New registrations trend: daily/weekly/monthly
- OPD vs IPD vs Emergency ratio
- Top 10 diagnoses (ICD-10 based)
- Top 10 referring doctors
- Geographic distribution by city/state (from address)
- Average age by department
- Repeat patient percentage (more than 1 visit)
- Insurance vs cash patient ratio
- If exportFormat is PDF: generate formatted PDF with charts
- If exportFormat is excel: generate multi-sheet Excel
- If exportFormat is json: return raw data array
- Cache report in Redis 30 minutes (heavy query)

generateRevenueReport(dateRange, groupBy, filters):
- Total revenue breakdown:
  * OPD consultation revenue
  * IPD admission revenue (room + nursing)
  * Pharmacy revenue
  * Lab revenue
  * OT revenue
  * Ambulance revenue
  * Other revenue
- GST collected: CGST, SGST, IGST breakdown
- Insurance vs cash vs UPI vs card payment distribution
- Revenue by department, by doctor, by service type
- Top 10 revenue generating doctors
- Top 10 revenue generating departments
- Average revenue per patient
- Revenue trend: current period vs previous period
- Outstanding payments aging: 0-30, 31-60, 61-90, 90+ days
- Refund amounts
- Net revenue after refunds
- Group data by: day/week/month based on groupBy param
- Export as PDF (formatted financial report) or Excel

generateDoctorPerformanceReport(doctorId, dateRange):
- Consultation count: OPD, IPD, Telemedicine
- Patient satisfaction score (if ratings collected)
- Average consultation duration
- Appointment no-show rate
- Patients treated by diagnosis category
- Prescriptions issued count
- Lab orders count, critical results count
- OT cases: count, average duration, complication rate
- Admission count, average length of stay for admitted patients
- Revenue generated
- Punctuality: on-time start % for appointments and OT
- Compare against department average for each metric
- Export as PDF with doctor details header

generateDepartmentReport(departmentId, dateRange):
- Patient volume: OPD, IPD counts
- Revenue generated
- Staff utilization: doctors, nurses, technicians
- Bed occupancy (if inpatient department)
- Average length of stay
- Top 5 diagnoses treated
- Lab and pharmacy usage
- Equipment utilization (from inventory issuance)
- Readmission rate
- Department expense vs revenue (P&L snapshot)
- Compare vs previous period

generateOccupancyReport(dateRange, wardType):
- Occupancy rate per ward per day (time-series)
- Average occupancy across hospital
- Peak occupancy periods (day of week, time of day)
- Bed turnover rate: admissions per bed per month
- Average length of stay by ward type
- Ward-wise trend comparison
- Forecasted occupancy next 7 days (simple trend)
- Return chart-ready data arrays

generateLabReport(dateRange, filters):
- Total tests ordered vs completed vs pending
- Turnaround time: average, min, max by test category
- Critical value alerts count and response time
- Test volume by category
- Rejection rate by reason
- Top 10 most ordered tests
- Revenue from lab services
- Technician workload distribution
- TAT compliance rate (% within SLA)
- Pending reports aging

generatePharmacyReport(dateRange, filters):
- Total prescriptions: received, dispensed, pending
- Medicine consumption by category and value
- Inventory turnover ratio
- Expired stock removed value
- Dead stock value
- Purchase vs consumption ratio
- Top 20 medicines by quantity and value
- Generic vs branded medicine ratio
- Revenue from pharmacy
- Stock-out incidents count and duration

generateStaffReport(dateRange, departmentId):
- Total staff count by role and department
- Attendance rate by department
- Late arrival trend
- Overtime hours by department
- Leave utilization by type
- Training completion rate
- Certification expiry alerts count
- Turnover rate (if joining/leaving data available)
- Payroll cost by department

getHospitalKPIReport(month, year):
- Key Performance Indicators snapshot:
  * Bed Occupancy Rate (target: 80-85%)
  * Average Length of Stay (target: < 5 days)
  * Bed Turnover Rate (admissions per bed)
  * Patient Satisfaction Score (if available)
  * Revenue per Available Bed (RevPAB)
  * Operating Cost per Patient Day
  * Emergency Response Time (P1: < 5min)
  * Lab TAT Compliance Rate
  * Pharmacy Stock-out Rate
  * Staff Attendance Rate
  * OT Utilization Rate
- Each KPI: actual value, target value, status (met/not met/warning)
- Trend vs last 3 months
- Export as executive PDF summary

generateAuditReport(filters):
- All audit trail entries with:
  user, action, module, resource, timestamp, ip, result
- Filter by: userId, module, action, dateRange, success/failure
- Security events: failed logins, unauthorized access attempts
- High-risk actions: patient data access, billing modifications
- Critical data changes with before/after diff
- Exportable for compliance review
- Paginated with search

Requirements:
- All heavy reports: check Redis cache first (TTL 30 min)
- Cache key format: report:{type}:{md5(filters)}
- Use MySQL aggregate queries with proper indexing hints
- Never load full dataset into memory — use DB aggregation
- PDF generation via pdf.util.js with hospital branding
- Excel generation via exceljs library with formatted sheets
- All exports: upload to S3 and return pre-signed URL
  (do not stream large files directly — S3 link instead)
- Report generation for large date ranges: use Bull queue
  return jobId immediately, notify user via Socket.io when ready
- All financial calculations: use decimal.js
- Log every report generation: who, what filters, duration, size
src/modules/reports/report.controller.js
text
You are a business intelligence backend engineer. Build a 
comprehensive reports controller for a Hospital Management System
handling executive dashboards, operational reports, and data exports.

Implement these controller methods:

Dashboards:
1.  getAdminDashboard(req, res, next)
2.  getDoctorDashboard(req, res, next)
3.  getNurseDashboard(req, res, next)
4.  getPharmacyDashboard(req, res, next)
5.  getLabDashboard(req, res, next)
6.  getBloodBankDashboard(req, res, next)
7.  getERDashboard(req, res, next)
8.  getInventoryDashboard(req, res, next)
9.  getHRDashboard(req, res, next)
10. getAccountsDashboard(req, res, next)

Patient Reports:
11. getPatientReport(req, res, next)
12. getPatientDemographicsReport(req, res, next)
13. getPatientAdmissionTrendReport(req, res, next)
14. getDiagnosisFrequencyReport(req, res, next)
15. getReadmissionReport(req, res, next)

Revenue & Financial Reports:
16. getRevenueReport(req, res, next)
17. getRevenueByDepartmentReport(req, res, next)
18. getRevenueByDoctorReport(req, res, next)
19. getOutstandingPaymentsReport(req, res, next)
20. getInsuranceClaimsReport(req, res, next)
21. getGSTReport(req, res, next)
22. getProfitLossSnapshot(req, res, next)

Clinical Reports:
23. getDoctorPerformanceReport(req, res, next)
24. getDepartmentReport(req, res, next)
25. getOccupancyReport(req, res, next)
26. getBedUtilizationReport(req, res, next)
27. getOTUtilizationReport(req, res, next)
28. getAverageLengthOfStayReport(req, res, next)

Lab & Pharmacy Reports:
29. getLabReport(req, res, next)
30. getLabTATReport(req, res, next)
31. getPharmacyReport(req, res, next)
32. getMedicineConsumptionReport(req, res, next)
33. getInventoryReport(req, res, next)

Staff Reports:
34. getStaffReport(req, res, next)
35. getAttendanceReport(req, res, next)
36. getPayrollSummaryReport(req, res, next)
37. getLeaveReport(req, res, next)

KPI & Executive Reports:
38. getHospitalKPIReport(req, res, next)
39. getExecutiveSummaryReport(req, res, next)
40. getMonthlyMISReport(req, res, next)

Compliance & Audit:
41. getAuditReport(req, res, next)
42. getSecurityReport(req, res, next)
43. getComplianceReport(req, res, next)
44. getDataAccessReport(req, res, next)

Export Management:
45. requestReportExport(req, res, next)
    — accepts report type + filters, returns jobId
    — queues heavy reports via Bull
46. getExportStatus(req, res, next)
    — check export job status by jobId
47. downloadExport(req, res, next)
    — returns pre-signed S3 URL for completed export
48. listMyExports(req, res, next)
    — user's recent exports with download links

Real-time Stats:
49. getLiveHospitalStats(req, res, next)
    — ultra-lightweight endpoint for header stats bar
50. getAlertsSummary(req, res, next)
    — all pending alerts requiring attention

Requirements:
- All dashboard methods:
  extract userId and role from req.user to determine
  which dashboard variant to serve
  (doctor gets own dashboard, admin gets hospital-wide)
- Validate date ranges in controller using dateTime.util.js
  before passing to service
- For large report requests (date range > 30 days):
  automatically route to requestReportExport (async)
  instead of synchronous response — return 202 Accepted
  with jobId
- downloadExport: validate the export belongs to req.user.id
  (admin can download any export)
- getLiveHospitalStats: max 500ms response time target —
  serve from Redis only, never hit DB
- Add X-Report-Generated-At and X-Cache-Status
  response headers on all report endpoints
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently with proper HTTP status codes:
  200 for immediate, 202 for queued exports
- Add @description, @access, @performance JSDoc on each method
src/modules/reports/report.routes.js
text
You are a business intelligence API engineer. Build comprehensive
reporting and analytics routes for a Hospital Management System
with role-based report access control.

Mount under /api/v1/reports

Dashboard Routes:
GET    /dashboards/admin            → ADMIN, SUPER_ADMIN
GET    /dashboards/doctor           → DOCTOR (own data)
GET    /dashboards/nurse            → NURSE (ward-specific)
GET    /dashboards/pharmacy         → PHARMACIST, ADMIN
GET    /dashboards/lab              → LAB_TECHNICIAN, ADMIN
GET    /dashboards/blood-bank       → BLOOD_BANK_OFFICER, ADMIN
GET    /dashboards/emergency        → DOCTOR, NURSE, ADMIN (ER dept)
GET    /dashboards/inventory        → INVENTORY_MANAGER, ADMIN
GET    /dashboards/hr               → HR, ADMIN
GET    /dashboards/accounts         → ACCOUNTANT, ADMIN
GET    /dashboards/live             → all authenticated 
                                      (lightweight stats bar)
GET    /dashboards/alerts           → ADMIN, SUPER_ADMIN

Patient Reports:
GET    /patients/summary            → ADMIN, SUPER_ADMIN
GET    /patients/demographics       → ADMIN, SUPER_ADMIN, DOCTOR
GET    /patients/admission-trend    → ADMIN, SUPER_ADMIN
GET    /patients/diagnosis-frequency → ADMIN, SUPER_ADMIN, DOCTOR
GET    /patients/readmissions       → ADMIN, SUPER_ADMIN, DOCTOR

Financial Reports:
GET    /financial/revenue           → ACCOUNTANT, ADMIN, SUPER_ADMIN
GET    /financial/revenue/department → ACCOUNTANT, ADMIN, SUPER_ADMIN
GET    /financial/revenue/doctor    → ACCOUNTANT, ADMIN, SUPER_ADMIN
GET    /financial/outstanding       → ACCOUNTANT, ADMIN
GET    /financial/insurance-claims  → ACCOUNTANT, ADMIN
GET    /financial/gst               → ACCOUNTANT, ADMIN, SUPER_ADMIN
GET    /financial/pnl               → ADMIN, SUPER_ADMIN

Clinical Reports:
GET    /clinical/doctor-performance → ADMIN, SUPER_ADMIN
GET    /clinical/doctor-performance/:doctorId → ADMIN, DOCTOR (own)
GET    /clinical/department/:deptId → ADMIN, SUPER_ADMIN, DEPT_HOD
GET    /clinical/occupancy          → ADMIN, SUPER_ADMIN
GET    /clinical/bed-utilization    → ADMIN, SUPER_ADMIN, NURSE
GET    /clinical/ot-utilization     → ADMIN, SUPER_ADMIN
GET    /clinical/average-stay       → ADMIN, SUPER_ADMIN, DOCTOR

Lab & Pharmacy Reports:
GET    /lab/summary                 → LAB_TECHNICIAN, ADMIN, SUPER_ADMIN
GET    /lab/tat                     → LAB_TECHNICIAN, ADMIN
GET    /pharmacy/summary            → PHARMACIST, ADMIN, SUPER_ADMIN
GET    /pharmacy/medicine-consumption → PHARMACIST, ADMIN
GET    /inventory/summary           → INVENTORY_MANAGER, ADMIN

Staff Reports:
GET    /staff/summary               → HR, ADMIN, SUPER_ADMIN
GET    /staff/attendance            → HR, ADMIN, MANAGER
GET    /staff/payroll               → ACCOUNTANT, ADMIN
GET    /staff/leave                 → HR, ADMIN

KPI & Executive Reports:
GET    /kpi/hospital                → ADMIN, SUPER_ADMIN
GET    /kpi/executive-summary       → ADMIN, SUPER_ADMIN
GET    /kpi/monthly-mis             → ADMIN, SUPER_ADMIN

Compliance & Audit:
GET    /audit/trail                 → ADMIN, SUPER_ADMIN
GET    /audit/security              → SUPER_ADMIN only
GET    /audit/compliance            → ADMIN, SUPER_ADMIN
GET    /audit/data-access           → ADMIN, SUPER_ADMIN

Export Management:
POST   /exports/request             → role-based (own dept reports)
GET    /exports/:jobId/status       → own exports + ADMIN all
GET    /exports/:jobId/download     → own exports + ADMIN all
GET    /exports/my                  → all authenticated

Middleware chain on ALL routes:
authenticate → authorize(permission) → validate(schema) → controller

Special middleware notes:
- All dashboard routes: inject roleDashboardFilter middleware
  (ensures doctors only see own data, nurses see ward data)
- Financial reports: apply additionalAccountantVerify middleware
- Audit/Security reports: apply superAdminLogger middleware
  (logs every access to security audit trail)
- Large date range detection middleware: applyAsyncReportGate
  (auto-redirects to export queue if dateRange > 90 days)
- All report routes: apply reportRateLimiter
  (max 30 report requests per user per hour)
- Apply cacheHeaders middleware: sets X-Cache-Status header
- Export download: apply exportOwnershipValidator middleware
- /dashboards/live: ultra-high performance path —
  skip validation middleware, only authenticate + Redis serve
src/modules/reports/report.validator.js
text
You are a business intelligence data validation specialist.
Build comprehensive Joi validation schemas for all reporting
and analytics endpoints in a Hospital Management System.

Create and export these schemas:

dateRangeSchema (reusable base schema):
- startDate: required valid ISO date string
- endDate: required valid ISO date string, must be >= startDate
- Validate: endDate cannot be in the future (for historical reports)
- Validate: max date range = 366 days (1 year)
  return error: "Date range cannot exceed 366 days.
  For larger ranges, use the export API"
- Custom Joi extension: .dateRange() method that validates
  startDate <= endDate with human-readable error

revenueReportSchema (extends dateRangeSchema):
- startDate, endDate: required (from dateRangeSchema)
- groupBy: required enum [day, week, month, quarter, year]
  Validate: groupBy compatibility with date range:
  day → max 90 days range
  week → max 180 days range
  month/quarter/year → max 366 days range
- departmentId: optional uuid
- doctorId: optional uuid
- paymentMode: optional enum
  [cash, card, upi, netbanking, insurance, mixed, all]
  default: all
- serviceType: optional enum
  [consultation, room_charge, pharmacy, lab, ot,
   ambulance, procedure, misc, all]
  default: all
- includeRefunds: boolean default true
- includeGST: boolean default true
- exportFormat: optional enum [json, pdf, excel]
  default: json
  Validate: if exportFormat is pdf or excel →
  controller will queue async job (add hint in meta)

patientReportSchema (extends dateRangeSchema):
- startDate, endDate: required
- reportType: required enum
  [summary, demographics, admission_trend,
   diagnosis_frequency, readmission, geographic]
- departmentId: optional uuid
- doctorId: optional uuid
- wardType: optional enum
  [general, icu, nicu, maternity, surgical, all]
  default: all
- ageGroup: optional enum
  [pediatric_0_12, adolescent_13_17,
   adult_18_60, senior_60_plus, all]
  default: all
- gender: optional enum [male, female, other, all]
  default: all
- admissionType: optional enum [opd, ipd, emergency, all]
  default: all
- diagnosisCode: optional string max:10 (ICD-10 code filter)
- exportFormat: optional enum [json, pdf, excel] default: json

doctorPerformanceReportSchema:
- doctorId: optional uuid
  (if not provided and role is ADMIN → all doctors report)
- startDate: required valid date
- endDate: required valid date, max 366 days from startDate
- departmentId: optional uuid
- metrics: optional array of enum
  [consultations, revenue, satisfaction, lab_orders,
   prescriptions, admissions, ot_cases, telemedicine]
  default: all metrics
- compareWithAverage: boolean default true
  (include department average for comparison)
- exportFormat: optional enum [json, pdf] default: json

occupancyReportSchema:
- startDate: required valid date
- endDate: required valid date, max 90 days range
- wardId: optional uuid (specific ward, else hospital-wide)
- wardType: optional enum
  [general, icu, nicu, picu, maternity, surgical,
   orthopedic, pediatric, psychiatric, oncology, all]
  default: all
- groupBy: required enum [day, week, month]
- includeForecasting: boolean default false
  (7-day forecast using linear trend)
- exportFormat: optional enum [json, pdf, excel] default: json

labReportSchema:
- startDate: required valid date
- endDate: required valid date, max 180 days
- reportType: required enum
  [summary, tat_analysis, workload, critical_values,
   rejection_rate, revenue]
- technicianId: optional uuid
- testCategory: optional enum
  [hematology, biochemistry, microbiology, serology,
   immunology, histopathology, all]
  default: all
- urgency: optional enum [routine, urgent, stat, all]
  default: all
- exportFormat: optional enum [json, pdf, excel] default: json

staffReportSchema:
- startDate: required valid date
- endDate: required valid date, max 366 days
- reportType: required enum
  [summary, attendance, payroll, leave, training,
   performance, certification_expiry]
- departmentId: optional uuid
- role: optional enum of all hospital roles
- employmentType: optional enum
  [permanent, contract, visiting, intern, probation, all]
  default: all
- exportFormat: optional enum [json, pdf, excel] default: json

kpiReportSchema:
- month: required integer min:1 max:12
- year: required integer min:2020 max:currentYear
- Validate: month/year combination cannot be future
  (e.g., cannot request KPI for next month)
- compareMonths: optional integer min:1 max:12 default:3
  (how many previous months to compare against)
- kpiCategories: optional array of enum
  [clinical, financial, operational, staff, patient_experience]
  default: all categories
- exportFormat: optional enum [json, pdf] default: json

auditReportSchema:
- startDate: required valid date
- endDate: required valid date, max 90 days range
- userId: optional uuid (filter by specific user)
- module: optional enum
  [auth, patients, doctors, billing, pharmacy, lab,
   wards, ot, emergency, blood_bank, staff, reports, all]
  default: all
- action: optional enum
  [create, read, update, delete, login, logout,
   export, print, critical_access]
- resourceType: optional string max:50
- ipAddress: optional string (filter by IP)
- onlyFailures: boolean default false
- onlyHighRisk: boolean default false
  (only CRITICAL and HIGH risk audit events)
- exportFormat: optional enum [json, pdf, excel] default: json

requestExportSchema:
- reportType: required enum
  [revenue, patients, doctor_performance, department,
   occupancy, lab, pharmacy, inventory, staff, kpi,
   audit, executive_summary, monthly_mis, gst]
- filters: required object
  (passed through to report-specific validation in service)
- exportFormat: required enum [pdf, excel, csv]
- notifyOnCompletion: boolean default true
  (send push + email when export is ready)
- reportTitle: optional string min:3 max:100
  (custom title for the exported report)

exportStatusQuerySchema (query params for listMyExports):
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:50 default:10
- status: optional enum [queued, processing, completed, failed]
- reportType: optional enum (all report types)
- startDate: optional valid date
- endDate: optional valid date

dashboardQuerySchema (query params):
- wardId: optional uuid (for nurse dashboard)
- departmentId: optional uuid (for department-specific views)
- doctorId: optional uuid
  (admin can view specific doctor's dashboard)
- refresh: optional boolean default false
  (if true, bust Redis cache and fetch fresh data)

gstReportSchema:
- month: required integer min:1 max:12
- year: required integer min:2020 max:currentYear
- Validate: month/year cannot be future
- gstType: optional enum [cgst, sgst, igst, all] default: all
- stateCode: optional string max:2 (for inter-state IGST)
- exportFormat: required enum [json, pdf, excel]
  (GST reports are always exported — not just JSON)

Requirements:
- Create reusable dateRangeSchema as a Joi object schema
  that other schemas extend using .concat()
- Auto-detect large date ranges and add meta flag:
  asyncRecommended: true (controller uses this to queue job)
- groupBy compatibility validator: custom Joi extension
  validateGroupByDateRange(groupBy, startDate, endDate)
  that checks if groupBy is appropriate for the date range
- All schemas: abortEarly: false, stripUnknown: true
- Custom error messages with business context:
  e.g., "Revenue report date range cannot exceed 366 days.
  For annual reports please use the Export API."
- Export all schemas as named exports
- Add JSDoc above each schema with:
  @description, @requiredRole, @cacheTTL, @asyncThreshold
- Special validation for financial reports:
  if groupBy=day and dateRange > 30 days →
  add warning in meta: "Consider using weekly grouping
  for better performance"
🔧 UTILITY FILES PROMPTS
src/utils/response.util.js
text
You are a backend API standards engineer. Build a unified HTTP 
response utility for a Hospital Management System Express.js backend
ensuring consistent API response structure across all 150+ endpoints.

Requirements:
- Create and export these response functions:

sendSuccess(res, data, message, statusCode, meta):
- statusCode: default 200
- Response shape:
  {success: true, statusCode, message, data,
   meta: {timestamp, requestId, pagination?, cacheStatus?}}

sendCreated(res, data, message):
- statusCode: 201
- Same shape as sendSuccess

sendAccepted(res, data, message):
- statusCode: 202 (for async/queued operations)
- Include jobId in data for tracking

sendNoContent(res):
- statusCode: 204, no body

sendError(res, message, statusCode, errorCode, details):
- statusCode: default 500
- Response shape:
  {success: false, statusCode, errorCode,
   message, details: [], timestamp, requestId}

sendPaginatedResponse(res, data, pagination, message):
- Include full pagination meta:
  {currentPage, totalPages, totalItems, itemsPerPage,
   hasNextPage, hasPreviousPage, nextPage, previousPage}

sendFileResponse(res, fileBuffer, filename, mimeType):
- Set correct Content-Type and Content-Disposition headers
- Support: pdf, excel, csv, image

createPaginationMeta(page, limit, totalItems):
- Calculate and return pagination object

- All functions extract requestId from res.locals.requestId
  (set by request ID middleware)
- Add response time to all responses:
  X-Response-Time header (ms from req.startTime)
- In development: include stack trace location in meta
- Never include undefined or null fields in response
  (use JSON.parse(JSON.stringify()) or similar cleanup)
- Export all as named exports
src/utils/jwt.util.js
text
You are a security engineer. Build a comprehensive JWT utility 
for a Hospital Management System using RS256 asymmetric signing.

Requirements:
- Load RS256 private key (for signing) and public key 
  (for verification) from environment variables or file paths
- Export these functions:

generateAccessToken(payload):
- Sign with RS256 private key
- Payload: {id, role, email, departmentId, permissions, iat}
- Expiry: 15 minutes
- Include jti (JWT ID — UUID v4) for blacklisting support
- Return signed token string

generateRefreshToken(userId):
- Generate UUID v4 as refresh token (not JWT — opaque token)
- Hash with SHA-256 before storing in DB
- Return: {rawToken, hashedToken, expiresAt (7 days)}

verifyAccessToken(token):
- Verify with RS256 public key
- Return decoded payload or throw specific error:
  TokenExpiredError, JsonWebTokenError, NotBeforeError

generatePasswordResetToken():
- Generate crypto.randomBytes(32).toString('hex')
- Return: {rawToken, hashedToken, expiresAt (1 hour)}

generateOTPToken():
- Generate 6-digit cryptographically secure OTP
- Hash with SHA-256 for storage
- Return: {otp, hashedOtp, expiresAt (10 minutes)}

extractTokenFromHeader(authHeader):
- Parse "Bearer <token>" format
- Throw AuthenticationError if malformed
- Return raw token string

hashToken(token):
- SHA-256 hash using crypto module
- Return hex string

compareHashedToken(rawToken, hashedToken):
- Timing-safe comparison using crypto.timingSafeEqual()
- Return boolean

- Never log raw tokens or private key content
- Private key passphrase support (from env)
- Export all as named exports
src/utils/s3.util.js
text
You are a cloud storage engineer. Build a comprehensive AWS S3 
utility for a Hospital Management System handling all file 
operations with security and reliability.

Requirements:
- Initialize S3Client from config/aws.js
- Export these functions:

uploadFile(fileBuffer, key, bucket, options):
- Upload Buffer to S3 using PutObjectCommand
- Set ContentType from options
- Set metadata: uploadedBy, module, uploadedAt, environment
- Apply server-side encryption: AES256
- Return: {key, bucket, url, etag, versionId}
- Retry up to 3 times with exponential backoff on failure

getSignedUrl(key, bucket, expiresIn):
- Generate pre-signed GET URL using getSignedUrl from @aws-sdk
- Default expiry: 900 seconds (15 minutes)
- Medical documents: max expiry 3600 seconds (1 hour)
- Return signed URL string

deleteFile(key, bucket):
- Delete object using DeleteObjectCommand
- Log deletion: who deleted, what, when
- Return success boolean
- Soft approach: move to archive bucket instead of hard delete
  for medical documents (configurable via env SOFT_DELETE_S3)

copyFile(sourceKey, sourceBucket, destKey, destBucket):
- Copy S3 object using CopyObjectCommand
- Preserve metadata
- Return new object details

generateUploadPresignedUrl(key, bucket, contentType, expiresIn):
- Generate pre-signed PUT URL for direct frontend uploads
- Validate contentType against allowed MIME types whitelist
- Set conditions: content-type, max file size
- Return: {uploadUrl, key, expiresAt}

listFiles(prefix, bucket, maxKeys):
- List objects by prefix using ListObjectsV2Command
- Support pagination with continuationToken
- Return: [{key, size, lastModified, etag}]

getFileMetadata(key, bucket):
- Get object metadata using HeadObjectCommand
- Return: {contentType, size, lastModified, metadata, etag}

moveFile(sourceKey, sourceBucket, destKey, destBucket):
- copyFile then deleteFile (atomic-ish)
- Log movement event

- All functions log to winston logger with: 
  operation, key, bucket, userId (from context), duration
- Never expose bucket names in error responses
- Export all as named exports
src/utils/pdf.util.js
text
You are a document generation engineer. Build a comprehensive 
PDF generation utility for a Hospital Management System using 
Puppeteer or PDFKit with hospital branding.

Requirements:
- Use puppeteer for HTML-to-PDF (complex layouts) and
  pdfkit for programmatic PDFs (simple documents)
- Load hospital branding from env: HOSPITAL_NAME,
  HOSPITAL_LOGO_URL, HOSPITAL_ADDRESS, HOSPITAL_PHONE,
  HOSPITAL_REG_NUMBER

Export these functions:

generatePDF(htmlContent, options):
- Puppeteer: render HTML to PDF
- options: {format: 'A4', margin, landscape, headerTemplate,
  footerTemplate}
- Add hospital header/footer on every page
- Return Buffer

generateInvoicePDF(billData):
- Structured invoice with: hospital header, patient details,
  line items table, tax breakdown, totals,
  payment details, footer with T&C
- Use PDFKit for precise layout control
- Return Buffer

generateLabReportPDF(labData):
- Lab report with: hospital header, patient info,
  doctor info, test results table with reference ranges,
  flagged abnormal values highlighted in color,
  pathologist signature section
- Return Buffer

generateDischargeSummaryPDF(dischargeData):
- Multi-section document: admission details,
  clinical course, diagnoses, medications,
  discharge instructions, follow-up section
- Legal disclaimer footer
- Return Buffer

generatePayslipPDF(payrollData):
- Payslip with: employee details, earnings breakdown,
  deductions breakdown, net pay, YTD totals,
  company seal placeholder
- Password protect with employee's last 4 digits of phone
- Return Buffer

generatePrescriptionPDF(prescriptionData):
- Doctor's prescription pad layout: doctor info with reg number,
  patient info, date, medicine table with dosage/frequency/duration,
  digital signature area, validity period
- Return Buffer

generateReportPDF(reportData, reportType):
- Generic report generator with:
  title page, hospital branding, charts as images
  (pass chart images as base64),
  data tables, summary section
- Return Buffer

addWatermark(pdfBuffer, watermarkText):
- Add diagonal watermark (e.g., "CONFIDENTIAL", "COPY")
- Return modified Buffer

mergePDFs(pdfBuffers):
- Merge multiple PDF buffers into single PDF
- Return merged Buffer

- All PDFs include: generation timestamp, unique document ID,
  "Generated by Hospital Management System" footer
- Compress PDFs: use compression option in puppeteer
- Log PDF generation: type, pages, size, duration
- Export all as named exports
src/utils/email.util.js
text
You are a transactional email engineer. Build an email utility
for a Hospital Management System using Nodemailer with AWS SES,
Handlebars templates, and Bull queue.

Requirements:
- Initialize SES transport from config/mailer.js
- Load Handlebars templates from /src/templates/email/ folder
- Use Bull queue for async email sending with retry logic

Export these functions:

compileTemplate(templateName, data):
- Load .hbs template from templates/email/{templateName}.hbs
- Compile with Handlebars using provided data object
- Cache compiled templates in memory (reload on file change in dev)
- Return HTML string

sendEmail(to, subject, htmlContent, options):
- options: {cc, bcc, attachments, replyTo, tags}
- attachments: [{filename, content: Buffer, contentType}]
- Add to Bull email queue with priority based on options.priority
- Return: {messageId, queued: true}

sendImmediateEmail(to, subject, htmlContent, options):
- Bypass queue — send directly (for critical: OTP, password reset)
- Retry 3 times with 1 second delay on failure
- Return: {messageId, sent: true}

Hospital-specific email functions:
sendAppointmentConfirmation(patient, appointment, doctor)
sendAppointmentReminder(patient, appointment, doctor)
sendLabResultReady(patient, labOrder, resultUrl)
sendPrescriptionReady(patient, prescription, prescriptionUrl)
sendBillGenerated(patient, bill, billUrl)
sendPaymentConfirmation(patient, payment, receiptUrl)
sendDischargeInstructions(patient, discharge, summaryUrl)
sendPasswordReset(user, resetUrl)
sendOTPEmail(user, otp)
sendWelcomeEmail(user, temporaryPassword)
sendPayslipEmail(staff, payslip, payslipBuffer)
sendEmergencyStaffAlert(staffList, alertDetails)
sendLowStockAlert(managers, stockList)

- Each specific function: compile correct template, call sendEmail
- All patient emails: include patient ID in email footer
- All emails: include unsubscribe footer (except OTP/password reset)
- Track: messageId, recipient, template, status, timestamp in DB
- Handle SES bounce: mark email as bounced in user profile
- Log every email: to, template, status, messageId, duration
- Export all as named exports
src/utils/sms.util.js
text
You are a mobile messaging systems engineer. Build an SMS utility 
for a Hospital Management System using Twilio or MSG91 
with queue-based delivery.

Requirements:
- Support multiple SMS providers via env: SMS_PROVIDER=twilio|msg91
- Initialize correct provider client based on env variable
- Use Bull queue for async SMS with retry logic
- DND (Do Not Disturb) compliance check before sending

Export these functions:

sendSMS(to, message, options):
- options: {priority, senderId, type: transactional|promotional}
- Validate phone number format (E.164 with country code)
- Check message length: warn if > 160 chars (will split into multiple SMS)
- DND check for promotional messages
- Add to SMS Bull queue
- Return: {queued: true, estimatedSegments}

sendImmediateSMS(to, message, options):
- Bypass queue for critical SMS (OTP, emergency alerts)
- Direct API call with 3 retries
- Return: {sent: true, messageId, segments}

Hospital-specific SMS functions:
sendOTPSMS(phone, otp):
- Template: "Your OTP for Hospital Management is {otp}. 
  Valid for 10 minutes. Do not share."
- Transactional route (no DND block)
- 1 minute TTL on delivery attempt

sendAppointmentReminderSMS(patient, appointment):
sendAppointmentConfirmationSMS(patient, appointment):
sendLabResultSMS(patient, labOrderId):
sendPaymentConfirmationSMS(patient, amount, receiptId):
sendDischargeSMS(patient, followUpDate):
sendEmergencyAlertSMS(staffPhone, message):
sendAmbulanceDispatchSMS(driverPhone, pickupDetails):
sendLowStockAlertSMS(managerPhone, itemCount):
sendShiftReminderSMS(staffPhone, shiftDetails):

validatePhoneNumber(phone):
- E.164 format validation
- Return: {isValid, formatted, countryCode}

maskPhoneNumber(phone):
- Return masked: +91XXXXX54321 format for logging

getDeliveryStatus(messageId):
- Query provider API for delivery status
- Return: {status, deliveredAt, errorCode}

- Never log full phone numbers — always masked in logs
- Sanitize message content: remove HTML tags, special chars
- Add SMS delivery callback URL for status tracking
- Log every SMS: masked_phone, template, status, 
  messageId, provider, duration
- Export all as named exports
src/utils/pagination.util.js
text
You are a backend API utility engineer. Build a robust pagination 
utility for a Hospital Management System handling all list 
endpoints consistently.

Requirements:
- Export these functions:

extractPaginationParams(query):
- Extract from req.query: page, limit, sortBy, sortOrder, search
- page: integer min:1 default:1
- limit: integer min:1 max:100 default:20
- sortOrder: enum [ASC, DESC] default: DESC
- search: optional string, trimmed, max 100 chars
- Return: {page, limit, offset, sortBy, sortOrder, search}

buildPaginationMeta(page, limit, totalItems):
- Calculate: totalPages, hasNextPage, hasPreviousPage,
  nextPage, previousPage, currentPage, totalItems, itemsPerPage
- Return pagination meta object

buildSequelizeQueryOptions(paginationParams, allowedSortFields):
- Build Sequelize findAndCountAll options:
  {limit, offset, order: [[sortBy, sortOrder]]}
- Validate sortBy against allowedSortFields whitelist
  (prevent SQL injection through sort field)
- Default sortBy to 'createdAt' if invalid field provided
- Return Sequelize query options object

buildSearchCondition(search, searchFields):
- Build Sequelize WHERE condition for full-text search
- searchFields: array of column names to search in
- Use Op.like with %search% for each field
- Combine with Op.or
- Return Sequelize where condition object

buildDateRangeCondition(startDate, endDate, dateField):
- Build Sequelize WHERE condition for date range
- Handle timezone conversion to UTC
- Return: {[dateField]: {[Op.between]: [start, end]}}

formatListResponse(rows, count, paginationParams):
- Combine data rows and pagination meta
- Return: {items: rows, pagination: meta}

extractFilters(query, allowedFilters):
- Extract and validate filter params from query
- allowedFilters: [{key, type: 'string'|'uuid'|'boolean'|
  'enum'|'date', enumValues?, required?}]
- Strip unknown filter keys
- Type-cast values (string '1' → integer 1, 'true' → boolean)
- Return cleaned filter object

- All functions handle edge cases: NaN page → default 1,
  negative limit → default 20, limit > 100 → cap at 100
- Export all as named exports
src/utils/encryption.util.js
text
You are a cryptography and security engineer. Build an encryption 
utility for a Hospital Management System protecting sensitive 
patient and financial data.

Requirements:
- Use Node.js crypto module (no external crypto packages)
- AES-256-GCM for symmetric encryption (authenticated encryption)
- bcrypt for password hashing
- SHA-256 for token hashing

Export these functions:

encrypt(text, secretKey):
- AES-256-GCM encryption
- Generate random 12-byte IV per encryption
- Generate random 16-byte salt
- Derive encryption key using scrypt(secretKey, salt, 32)
- Encrypt data, get authTag for integrity
- Return: {encrypted, iv, salt, authTag} as Base64 encoded object
- Use for: aadhaar numbers, bank details, sensitive fields

decrypt(encryptedData, secretKey):
- Reverse of encrypt()
- Verify authTag integrity (throws if tampered)
- Return decrypted plain text
- Throws: DecryptionError with safe message (no key exposure)

hashPassword(password):
- bcrypt hash with saltRounds: 12
- Return hashed string

verifyPassword(password, hash):
- bcrypt.compare with timing-safe comparison
- Return boolean

hashToken(token):
- SHA-256 hash using crypto.createHash
- Return hex string

generateSecureToken(bytes):
- crypto.randomBytes(bytes).toString('hex')
- Default bytes: 32 (256-bit)
- Return hex string

generateNumericOTP(digits):
- Cryptographically secure numeric OTP
- Use crypto.randomInt() (not Math.random())
- Default digits: 6
- Return string (preserve leading zeros)

maskSensitiveData(data, type):
- type: 'phone' → +91XXXXX54321
- type: 'email' → a***@gmail.com
- type: 'aadhaar' → XXXX-XXXX-4321
- type: 'card' → **** **** **** 4321
- type: 'pan' → AXXXXX9999X
- Return masked string

timingSafeEqual(a, b):
- crypto.timingSafeEqual for constant-time comparison
- Prevents timing attack on token comparison
- Return boolean

encryptField(value):
- Shorthand encrypt using process.env.FIELD_ENCRYPTION_KEY
- For Sequelize model use (beforeSave hook)

decryptField(encryptedValue):
- Shorthand decrypt using process.env.FIELD_ENCRYPTION_KEY
- For Sequelize model use (afterFind hook)

- Never log encryption keys, salts, or IVs
- All encryption keys loaded from environment variables only
- Export all as named exports
src/utils/logger.util.js
text
You are a backend observability engineer. Build a production-grade 
Winston logger utility for a Hospital Management System with 
structured logging, multiple transports, and sensitive data masking.

Requirements:
- Configure Winston with daily-rotate-file transport

Create and export:

Main logger instance with:
- Transports:
  * Console (colorized in dev, JSON in production)
  * DailyRotateFile: combined-%DATE%.log (all levels, 30 day retention)
  * DailyRotateFile: error-%DATE%.log (error only, 90 day retention)
  * DailyRotateFile: audit-%DATE%.log (audit level only, 365 day retention)
- Format: timestamp + level + requestId + userId + message + meta
- Custom level: 'audit' (between warn and info, numeric level: 3)
- Gzip compress rotated files
- Never throw on logger errors (silent: false but handle internally)

Sensitive data masking:
- Create maskSensitiveData(obj) function
- Mask these fields wherever found in log meta:
  password, token, refreshToken, otp, aadhaarNumber,
  cardNumber, cvv, pin, secretKey, privateKey,
  accountNumber, panNumber
- Replace values with: '***REDACTED***'
- Deep-scan nested objects
- Apply to all log calls automatically via format transform

Export these logging functions:
logInfo(message, meta, module):
logError(message, error, meta, module):
logWarn(message, meta, module):
logDebug(message, meta, module):
logAudit(action, userId, module, resourceId, meta):
logSecurity(event, userId, ip, details):
logPerformance(operation, durationMs, meta):

Each function:
- Includes module name as child logger label
- Includes requestId from AsyncLocalStorage context
  (set per request by request ID middleware)
- Masks sensitive fields before logging
- logError: includes error.stack in development,
  only error.message in production

createChildLogger(module):
- Returns child logger with module label
- Used in each module: const logger = createChildLogger('billing')

Morgan stream:
- Export morganStream object for Morgan HTTP logger integration
- write(message) → logger.http(message.trim())

Performance monitoring:
- Export measureAsync(fn, operationName) wrapper
  that logs execution time automatically

- Export main logger as default export
- Export all functions as named exports
src/utils/scheduler.util.js
text
You are a job scheduling engineer. Build a task scheduler utility
for a Hospital Management System using node-cron and Bull queues
for background jobs.

Requirements:
- Initialize Bull queues connected to Redis from config/redis.js
- Create node-cron scheduled jobs
- Handle job failures with dead letter queue pattern

Create and export these Bull queues:

emailQueue:
- concurrency: 10
- attempts: 3, backoff: exponential 1000ms
- removeOnComplete: 100 (keep last 100 completed)
- removeOnFail: 500

smsQueue:
- concurrency: 5
- attempts: 3, backoff: exponential 2000ms

notificationQueue:
- concurrency: 20
- priority support (1-10, lower is higher priority)

reportExportQueue:
- concurrency: 3 (heavy jobs)
- attempts: 2, timeout: 300000 (5 min timeout per job)

pdfGenerationQueue:
- concurrency: 5
- attempts: 2, timeout: 60000

Create and export scheduledJobs object with node-cron jobs:

scheduledJobs.pharmacyExpiryCheck:
- Schedule: every day at 8:00 AM
- Job: check medicines expiring in 90 days, send alerts

scheduledJobs.lowStockCheck:
- Schedule: every 6 hours
- Job: check low stock items, create alerts

scheduledJobs.appointmentReminders:
- Schedule: every hour
- Job: send 24hr and 1hr reminders for upcoming appointments

scheduledJobs.inventoryExpiryCheck:
- Schedule: every day at 9:00 AM
- Job: check expiring inventory items

scheduledJobs.bloodBankExpiryCheck:
- Schedule: every hour (platelets expire in 5 days)
- Job: check expiring blood units, alert blood bank officer

scheduledJobs.certificationExpiryAlert:
- Schedule: every day at 10:00 AM
- Job: check staff certifications expiring in 30 days

scheduledJobs.unpaidBillsAlert:
- Schedule: every day at 11:00 AM
- Job: flag bills unpaid > 30 days, send reminder

scheduledJobs.bedCleaningCheck:
- Schedule: every 15 minutes
- Job: check beds pending cleaning past estimated time,
  send reminder to housekeeping

scheduledJobs.sessionCleanup:
- Schedule: every hour
- Job: clean expired refresh tokens from DB

scheduledJobs.auditLogArchive:
- Schedule: first day of each month at 2:00 AM
- Job: archive audit logs older than 1 year to S3 cold storage

initScheduler():
- Start all cron jobs
- Register all Bull queue processors
- Log each job start with cron expression
- Return { queues, jobs }

stopScheduler():
- Gracefully stop all cron jobs
- Drain Bull queues before shutdown

- All jobs: log start, completion, duration, errors
- Failed jobs: send alert to admin via notification service
- No job should run more than 1 concurrent instance
  (use Redis-based distributed lock)
- Export all queues and initScheduler as named exports
src/utils/dateTime.util.js
text
You are a time and calendar systems engineer. Build a comprehensive 
date and time utility for a Hospital Management System handling 
all date operations, timezone conversions, and time-slot logic.

Requirements:
- Use date-fns library (NOT moment.js — deprecated)
- Hospital timezone from env: HOSPITAL_TIMEZONE 
  (default: 'Asia/Kolkata')
- All dates stored in DB as UTC, displayed in hospital timezone

Export these functions:

toUTC(dateString, fromTimezone):
- Convert local datetime to UTC for DB storage
- Return Date object in UTC

toHospitalTime(utcDate):
- Convert UTC DB date to hospital timezone
- Return formatted string: 'DD MMM YYYY HH:mm'

formatDate(date, format):
- Format date using date-fns format()
- Common formats exported as constants:
  DATE_FORMAT = 'dd/MM/yyyy'
  TIME_FORMAT = 'HH:mm'
  DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'
  ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"

calculateAge(dateOfBirth):
- Return: {years, months, days}
- For patient records: {totalYears, ageGroup: pediatric|adult|senior}

isDateInFuture(date):
isDateInPast(date):
isDateToday(date):
isBetween(date, start, end):
- Utility boolean checks

addDays(date, days):
addHours(date, hours):
addMinutes(date, minutes):
subtractDays(date, days):
- Date arithmetic functions

getDayOfWeek(date):
- Return: 'monday'|'tuesday'|... (lowercase)

generateTimeSlots(startTime, endTime, slotDurationMinutes):
- Generate array of time slot strings: ['09:00', '09:15', '09:30']
- startTime, endTime: 'HH:MM' strings
- Returns array of slot start times

isSlotAvailable(slot, bookedSlots):
- Check if slot string is NOT in bookedSlots array
- Return boolean

getDateRange(startDate, endDate):
- Return array of Date objects for each day in range
- Max 366 days (throws if exceeded)

getStartOfDay(date):
getEndOfDay(date):
getStartOfMonth(date):
getEndOfMonth(date):
getStartOfWeek(date):
getEndOfWeek(date):
- Date boundary helpers

calculateDuration(startDate, endDate):
- Return: {days, hours, minutes, totalMinutes, humanReadable}
- humanReadable: '3 days 4 hours 30 minutes'

calculateLengthOfStay(admissionDate, dischargeDate):
- Return: {days, hours, billableDays (ceiling)}
- billableDays: rounds up partial days for billing

isWithinBusinessHours(dateTime, businessHours):
- businessHours: {start: 'HH:MM', end: 'HH:MM', 
Claude Sonnet 4.6
users,suppliers,rooms,nurses,medical-records,insurance,departments,appointments, the 8 modules files are missing ( 8X4 = 32 files are missing)


Thought Process
expand
🏥 All 32 Missing Module Prompts — 8 Modules × 4 Files
👤 1. USERS MODULE
src/modules/users/user.service.js
text
You are a senior backend engineer specializing in identity and 
access management. Build a complete user management service for 
a Hospital Management System handling all user lifecycle operations.

Implement these service functions with full business logic:

createUser(userData, createdBy):
- Validate email uniqueness across entire users table
- Validate phone uniqueness across entire users table
- Hash password with bcrypt cost factor 12
- Auto-generate employeeId based on role prefix:
  SUPER_ADMIN: SA-XXXX, ADMIN: AD-XXXX, DOCTOR: DR-XXXX,
  NURSE: NR-XXXX, PHARMACIST: PH-XXXX, LAB_TECHNICIAN: LT-XXXX,
  RECEPTIONIST: RC-XXXX, ACCOUNTANT: AC-XXXX, STAFF: ST-XXXX,
  PATIENT: PT-YYYY-XXXXXX (year-based for patients)
- Generate sequential ID per role: query last ID, increment by 1
- Assign default permissions based on role from permission matrix
- Upload profile photo to S3 if provided
- Create audit log entry: createdBy, timestamp, ip
- Send welcome email with temporary password via email.util.js
- Never return password hash in response
- Wrap full operation in DB transaction

getUserById(userId, requestingUser):
- Role-based field filtering:
  SUPER_ADMIN/ADMIN → full user record including sensitive fields
  MANAGER/HR → professional fields only, no financial
  STAFF → own record only → all fields
  PATIENT → own record → patient-relevant fields
- Cache user profile in Redis: key hms:users:{userId} TTL 5 min
- Log data access for ADMIN viewing other user profiles
- Return sanitized user object (no password hash ever)

updateUser(userId, updateData, updatedBy):
- Strict field whitelist per role:
  ADMIN can update: role, department, isActive, permissions
  HR can update: designation, salary, shift, department
  SELF can update: name, phone, address, profilePhoto, password
- Track every changed field: {field, oldValue, newValue}
- If role changes: invalidate all sessions for that user
- If email/phone changes: require OTP verification (flag in response)
- If isActive set to false: revoke all refresh tokens immediately
- Invalidate Redis cache on any update
- Create detailed audit entry with diff
- Return updated sanitized user object

getAllUsers(filters, pagination, requestingUser):
- SUPER_ADMIN: all users
- ADMIN: all users except SUPER_ADMIN
- HR: staff only (not doctors, not patients, not admins)
- MANAGER: only their department staff
- Apply filters: role, department, isActive, joinedAfter, joinedBefore
- Apply search: name, email, phone, employeeId
- Paginated and sorted response
- Cache list queries in Redis TTL 2 min with filter-based key
- Never include password hashes in list response

changeUserRole(userId, newRole, changedBy):
- Validate changedBy has permission to assign newRole
  (SUPER_ADMIN can assign any role, ADMIN cannot create SUPER_ADMIN)
- Log old role and new role
- Update permissions to match new role default
- Invalidate all user sessions (force re-login with new role)
- Send email notification to user about role change
- Create audit entry

deactivateUser(userId, reason, deactivatedBy):
- Soft delete: set isActive = false, deactivatedAt, deactivatedBy
- Revoke all active refresh tokens in DB
- Blacklist all active access tokens in Redis
- Record deactivation reason in audit log
- Send account deactivation email to user
- Never hard delete users (data integrity + audit trail)

reactivateUser(userId, reactivatedBy):
- Set isActive = true, clear deactivatedAt/deactivatedBy
- Send reactivation email with password reset link
- Create audit entry

updateUserPermissions(userId, permissions, updatedBy):
- SUPER_ADMIN only function
- Override default role permissions with custom set
- Validate all permission strings against master permission list
- Invalidate user's cached token/permissions in Redis
- Log every permission change with before/after state

getUserActivityLog(userId, filters, pagination):
- Return paginated audit log entries for this user
- Filter by: action type, module, date range
- SUPER_ADMIN/ADMIN only

getUserSessions(userId):
- Return all active sessions (non-expired refresh tokens)
- Include: deviceInfo, lastUsed, ip, expiresAt
- User can view own sessions, Admin can view any user's sessions

revokeUserSession(userId, sessionId, revokedBy):
- Invalidate specific refresh token
- Add corresponding access token to Redis blacklist
- Log session revocation

revokeAllUserSessions(userId, exceptCurrentSession, revokedBy):
- Revoke all refresh tokens for user
- Blacklist all active JTIs in Redis
- Log mass session revocation

getUserStats(dateRange):
- ADMIN only
- Total users by role
- New users this month vs last month
- Active vs inactive count
- Login frequency distribution

Requirements:
- All DB writes in transactions where multiple tables involved
- All password operations use bcrypt with cost 12
- Never log raw passwords, tokens, or sensitive PII
- Redis cache invalidation on every user update
- Permission changes trigger immediate session invalidation
- Soft delete only — never hard delete any user record
- All functions throw typed AppError subclasses on failure
src/modules/users/user.controller.js
text
You are a backend API engineer. Build a clean, thin user management 
controller for a Hospital Management System following strict 
separation of concerns.

Implement these controller methods:

User CRUD:
1.  createUser(req, res, next)
2.  getUserById(req, res, next)
3.  updateUser(req, res, next)
4.  deactivateUser(req, res, next) — soft delete with reason
5.  reactivateUser(req, res, next)
6.  listUsers(req, res, next) — paginated, role-filtered
7.  searchUsers(req, res, next)

Profile:
8.  getMyProfile(req, res, next) — req.user.id
9.  updateMyProfile(req, res, next) — limited self-edit
10. uploadProfilePhoto(req, res, next) — S3 upload middleware
11. deleteProfilePhoto(req, res, next)
12. changeMyPassword(req, res, next)

Role & Permissions:
13. changeUserRole(req, res, next) — SUPER_ADMIN only
14. updateUserPermissions(req, res, next) — SUPER_ADMIN only
15. getUserPermissions(req, res, next)
16. getRolePermissionMatrix(req, res, next)

Sessions:
17. getUserSessions(req, res, next)
18. revokeSession(req, res, next)
19. revokeAllSessions(req, res, next)
20. getMyActiveSessions(req, res, next)

Activity:
21. getUserActivityLog(req, res, next)
22. getMyActivityLog(req, res, next)

Admin Bulk Operations:
23. bulkDeactivateUsers(req, res, next) — array of userIds
24. bulkUpdateDepartment(req, res, next)
25. getUserStats(req, res, next)
26. exportUsers(req, res, next) — CSV/Excel with role filter

Requirements:
- getMyProfile: always use req.user.id, never trust userId param 
  for own profile (security: prevents IDOR)
- uploadProfilePhoto: validate file via upload.middleware.js 
  before controller executes
- changeUserRole: extract changedBy from req.user.id 
  and pass to service
- bulkDeactivateUsers: validate array max 50 items in controller
- listUsers: extract pagination via pagination.util.js
- getUserStats: SUPER_ADMIN and ADMIN only — inline role check
- exportUsers: queue via Bull if > 1000 records, 
  return 202 with jobId, else return 200 with CSV buffer
- All wrapped in try/catch → next(error)
- Use sendSuccess from response.util.js consistently
- Add @description, @access, @security JSDoc on every method
src/modules/users/user.routes.js
text
You are an API security architect. Build comprehensive user 
management routes for a Hospital Management System with 
strict identity and access control.

Mount under /api/v1/users

Self-service routes (any authenticated user):
GET    /me                          → all authenticated
PUT    /me                          → all authenticated
POST   /me/photo                    → all authenticated (uploadProfilePhoto middleware)
DELETE /me/photo                    → all authenticated
PUT    /me/password                 → all authenticated
GET    /me/sessions                 → all authenticated
DELETE /me/sessions/:sessionId      → all authenticated (own session)
DELETE /me/sessions                 → all authenticated (revoke all own)
GET    /me/activity                 → all authenticated

Admin user management:
POST   /                            → SUPER_ADMIN, ADMIN
GET    /                            → SUPER_ADMIN, ADMIN, HR
GET    /search                      → SUPER_ADMIN, ADMIN, HR
GET    /stats                       → SUPER_ADMIN, ADMIN
GET    /export                      → SUPER_ADMIN, ADMIN
POST   /bulk/deactivate             → SUPER_ADMIN, ADMIN
POST   /bulk/update-department      → SUPER_ADMIN, ADMIN

Individual user management:
GET    /:userId                     → SUPER_ADMIN, ADMIN, HR, MANAGER
PUT    /:userId                     → SUPER_ADMIN, ADMIN
POST   /:userId/deactivate          → SUPER_ADMIN, ADMIN
POST   /:userId/reactivate          → SUPER_ADMIN, ADMIN

Role & Permissions:
PUT    /:userId/role                → SUPER_ADMIN only
GET    /:userId/permissions         → SUPER_ADMIN, ADMIN
PUT    /:userId/permissions         → SUPER_ADMIN only
GET    /permissions/matrix          → SUPER_ADMIN, ADMIN

Session management (admin):
GET    /:userId/sessions            → SUPER_ADMIN, ADMIN
DELETE /:userId/sessions/:sessionId → SUPER_ADMIN, ADMIN
DELETE /:userId/sessions            → SUPER_ADMIN, ADMIN

Activity:
GET    /:userId/activity            → SUPER_ADMIN, ADMIN

Middleware chain: authenticate → authorize(permission) → validate → controller
Apply uploadProfilePhoto middleware on photo upload routes
Apply auditMiddleware on all write routes
Apply rateLimiter on password change and photo upload routes
Apply enhanced auditMiddleware on role/permission change routes
  (flag as PERMISSION_CHANGE in audit log)
Export router with clear section comment groups
src/modules/users/user.validator.js
text
You are an identity management data validation specialist. Build 
comprehensive Joi validation schemas for all user management 
endpoints in a Hospital Management System.

Create and export these schemas:

createUserSchema:
- firstName: required string, alpha + spaces, min:2 max:50
- lastName: required string, alpha + spaces, min:2 max:50
- email: required valid email, lowercase, trim
- phone: required custom phone validator 
  (E.164 format: +91XXXXXXXXXX), unique enforced in service
- password: required string min:8 max:72,
  must contain: 1 uppercase, 1 lowercase, 1 number, 1 special char
  Regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/
- confirmPassword: required, must match password field exactly
  using Joi.ref('password')
- role: required enum [SUPER_ADMIN, ADMIN, DOCTOR, NURSE, 
  PHARMACIST, LAB_TECHNICIAN, RECEPTIONIST, ACCOUNTANT, 
  STAFF, HR, MANAGER, PATIENT]
- departmentId: uuid, required for clinical roles 
  (DOCTOR, NURSE, LAB_TECHNICIAN), optional for others
- gender: required enum [male, female, other, prefer_not_to_say]
- dateOfBirth: required date, 
  must be at least 18 years ago for all non-PATIENT roles,
  no age restriction for PATIENT role
- designation: string min:3 max:100,
  required for non-PATIENT roles
- employmentType: enum [permanent, contract, visiting, 
  intern, probation, not_applicable] default: not_applicable,
  required for staff roles
- address: optional object 
  {street: string, city: string required, 
   state: string required, pincode: string 6-digits required, 
   country: string default 'India'}
- emergencyContact: optional object
  {name: string required min:2, 
   phone: valid phone required, 
   relation: string required min:2}

updateUserSchema:
- firstName: optional, same rules as create
- lastName: optional, same rules
- email: optional, valid email
  (if changed: flag requiresOTPVerification: true in meta)
- phone: optional, valid phone
  (if changed: flag requiresOTPVerification: true in meta)
- departmentId: optional uuid
- designation: optional string min:3 max:100
- address: optional address object
- emergencyContact: optional contact object
- employmentType: optional enum
- isActive: optional boolean (ADMIN only field — 
  enforced in service layer)
- Validate: at least one field must be provided

updateMyProfileSchema:
- firstName: optional string
- lastName: optional string
- phone: optional valid phone
- address: optional address object
- emergencyContact: optional contact object
- profilePhotoUrl: optional valid URL
- preferredLanguage: optional enum 
  [english, hindi, tamil, telugu, kannada, bengali, marathi]
- Validate: at least one field must be provided
- Explicitly EXCLUDE: email, role, departmentId, isActive, password
  (these cannot be self-updated via this endpoint)

changeMyPasswordSchema:
- currentPassword: required string
- newPassword: required string min:8 max:72,
  strong password regex, cannot equal currentPassword
- confirmPassword: required, must match newPassword
- Custom error: "New password cannot be the same as current password"

changeUserRoleSchema:
- userId: from params, uuid
- newRole: required enum (all roles)
- reason: required string min:10 max:500
- effectiveDate: optional datetime 
  (if future: schedule role change, else immediate)

updateUserPermissionsSchema:
- userId: from params, uuid
- permissions: required array min:1 max:100 of strings
  Each permission format: 'module:action'
  e.g., 'patients:read', 'billing:create', 'reports:export'
- permissionMode: required enum [replace, merge, revoke]
  replace: overwrite all custom permissions
  merge: add to existing
  revoke: remove specified permissions
- reason: required string min:10 max:500

bulkDeactivateSchema:
- userIds: required array min:1 max:50 of uuids
- reason: required string min:10 max:500
- sendNotification: boolean default true

bulkUpdateDepartmentSchema:
- userIds: required array min:1 max:50 of uuids
- departmentId: required uuid
- effectiveDate: optional date, cannot be past more than 1 day

searchUsersSchema (query params):
- q: optional string min:2 max:100 (search term)
- role: optional enum or array of role enums
- departmentId: optional uuid
- isActive: optional boolean
- employmentType: optional enum
- joinedAfter: optional valid date
- joinedBefore: optional valid date, must be after joinedAfter
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:100 default:20
- sortBy: optional enum [name, email, joinedAt, role, department]
- sortOrder: optional enum [ASC, DESC] default DESC

Requirements:
- Password validation: create reusable strongPassword Joi extension
  usable across auth and user validator files
- Phone validation: create reusable e164Phone Joi extension
- Role-conditional validation using Joi.when():
  departmentId required WHEN role IN [DOCTOR, NURSE, LAB_TECHNICIAN]
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages using professional HR language
- Export all schemas as named exports with JSDoc
🏢 2. SUPPLIERS MODULE
src/modules/suppliers/supplier.service.js
text
You are a procurement and vendor management engineer. Build a 
complete supplier management service for a Hospital Management 
System handling vendor relationships and procurement workflows.

Implement these service functions:

createSupplier(supplierData, createdBy):
- Create supplier profile:
  companyName, contactPerson, email, phone, alternatePhone,
  address (billing + shipping separately), 
  GSTNumber (validate format: 15-character GSTIN),
  PAN number, bank details (account, IFSC, bank name),
  supplierType (pharmaceutical, medical_supply, equipment,
  laboratory, food, linen, maintenance, other),
  paymentTerms (net_30, net_60, advance, on_delivery),
  creditLimit (paise), certifications array
- Auto-generate Supplier Code: SUP-TYPE-XXXX 
  (e.g., SUP-PH-0001 for pharmaceutical)
- Validate GSTIN format with state code check
- Validate IFSC code format
- Upload documents (GST certificate, trade license) to S3
- Send welcome email to supplier with portal access info
- Create audit log entry
- Cache supplier in Redis: hms:suppliers:{supplierId} TTL 1hr

updateSupplier(supplierId, updateData, updatedBy):
- Allow partial updates with field whitelist
- If bank details change: flag for re-verification
- If GSTIN changes: validate new GSTIN
- Track changed fields for audit trail
- Invalidate Redis cache

getSupplierById(supplierId):
- Return full supplier profile with:
  active purchase orders count,
  pending payments total,
  last order date,
  total business value (sum of all PO amounts)
- Cache in Redis TTL 30 min

getSupplierPerformance(supplierId, dateRange):
- On-time delivery rate: delivered_on_time / total_orders × 100
- Order fulfillment rate: fully_fulfilled / total_orders × 100
- Return/rejection rate: rejected_items / total_items × 100
- Average delivery time (days from PO to GRN)
- Quality complaint count
- Price variance: avg(actual_price - quoted_price) per item
- Total business volume in date range
- Payment history: on-time payments / total payments
- Generate supplier scorecard (A/B/C/D grade)

getApprovedSupplierList(itemId):
- Return all suppliers who supply a specific inventory item
- Include: item-specific price (from supplier catalog),
  last quoted price, last supplied date, lead time days
- Sort by: performance score, price, lead time

addSupplierCatalog(supplierId, catalogItems, addedBy):
- Add items this supplier can supply with:
  itemId, supplierItemCode, unitPrice, minimumOrderQuantity,
  leadTimeDays, packagingDetails
- Validate items exist in inventory master
- Check for duplicate item entries per supplier

getSupplierPayables(supplierId, filters):
- All purchase orders with payment status
- Outstanding amount, due date, overdue flag
- Aging: 0-30, 31-60, 61-90, 90+ days overdue
- Total payable amount

blacklistSupplier(supplierId, reason, blacklistedBy):
- Mark supplier as blacklisted with reason and date
- Prevent new POs from being raised for this supplier
- Notify procurement team
- Create audit entry

getAllSuppliers(filters, pagination):
- Filter by: supplierType, isActive, isBlacklisted, state
- Search by: companyName, supplierCode, email, phone, GSTIN
- Include performance metrics in list response
- Paginated and sorted

getSupplierTransactionHistory(supplierId, filters, pagination):
- All purchase orders, GRNs, payments for this supplier
- Chronological with status for each

Requirements:
- GSTIN validation: regex + checksum algorithm
- IFSC validation: regex /^[A-Z]{4}0[A-Z0-9]{6}$/
- Bank details encrypted using encryption.util.js
- Supplier scorecard cached in Redis, recalculated weekly via scheduler
- Blacklisted supplier check in inventory.service.js before PO creation
- All financial amounts in paise (integer storage)
src/modules/suppliers/supplier.controller.js
text
You are a backend API engineer. Build a supplier management 
controller for a Hospital Management System following the 
thin controller pattern.

Implement these controller methods:

Supplier CRUD:
1.  createSupplier(req, res, next)
2.  getSupplierById(req, res, next)
3.  updateSupplier(req, res, next)
4.  deactivateSupplier(req, res, next) — soft delete
5.  reactivateSupplier(req, res, next)
6.  listSuppliers(req, res, next) — paginated, filtered
7.  searchSuppliers(req, res, next)
8.  blacklistSupplier(req, res, next) — admin only
9.  removeFromBlacklist(req, res, next) — admin only

Documents:
10. uploadSupplierDocument(req, res, next) — S3 upload
11. getSupplierDocuments(req, res, next)
12. deleteSupplierDocument(req, res, next)

Catalog Management:
13. addSupplierCatalog(req, res, next)
14. updateCatalogItem(req, res, next)
15. removeCatalogItem(req, res, next)
16. getSupplierCatalog(req, res, next)
17. getApprovedSuppliersForItem(req, res, next)

Performance & Analytics:
18. getSupplierPerformance(req, res, next)
19. getSupplierScorecard(req, res, next)
20. getSupplierTransactionHistory(req, res, next)
21. getSupplierPayables(req, res, next)
22. getAllSupplierPayablesSummary(req, res, next) — admin view
23. getTopSuppliersByVolume(req, res, next)

Payments:
24. recordSupplierPayment(req, res, next)
25. getPaymentHistory(req, res, next)
26. getOverduePayments(req, res, next)

Reports:
27. getSupplierReport(req, res, next)
28. exportSupplierList(req, res, next) — CSV/Excel

Requirements:
- blacklistSupplier: require admin role inline check + 
  mandatory reason in body
- getApprovedSuppliersForItem: extract itemId from query, 
  validate uuid before service call
- getAllSupplierPayablesSummary: apply ACCOUNTANT/ADMIN role check
- uploadSupplierDocument: use uploadMedicalDocument 
  middleware (reuse for supplier docs)
- getSupplierPerformance: validate dateRange in controller
  using dateTime.util.js before passing to service
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/suppliers/supplier.routes.js
text
You are an API design engineer. Build supplier management 
routes for a Hospital Management System with procurement 
workflow access control.

Mount under /api/v1/suppliers

Supplier Management:
POST   /                             → ADMIN, INVENTORY_MANAGER
GET    /                             → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /search                       → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /top-by-volume                → ADMIN, ACCOUNTANT
GET    /payables/overdue             → ADMIN, ACCOUNTANT
GET    /payables/summary             → ADMIN, ACCOUNTANT
GET    /:supplierId                  → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
PUT    /:supplierId                  → ADMIN, INVENTORY_MANAGER
POST   /:supplierId/deactivate       → ADMIN only
POST   /:supplierId/reactivate       → ADMIN only
POST   /:supplierId/blacklist        → ADMIN only
POST   /:supplierId/remove-blacklist → ADMIN only

Documents:
POST   /:supplierId/documents        → ADMIN, INVENTORY_MANAGER 
                                       (upload middleware)
GET    /:supplierId/documents        → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
DELETE /:supplierId/documents/:docId → ADMIN only

Catalog:
POST   /:supplierId/catalog          → ADMIN, INVENTORY_MANAGER
PUT    /:supplierId/catalog/:itemId  → ADMIN, INVENTORY_MANAGER
DELETE /:supplierId/catalog/:itemId  → ADMIN, INVENTORY_MANAGER
GET    /:supplierId/catalog          → ADMIN, INVENTORY_MANAGER
GET    /catalog/item/:itemId         → ADMIN, INVENTORY_MANAGER 
                                       (approved suppliers for item)

Performance:
GET    /:supplierId/performance      → ADMIN, INVENTORY_MANAGER
GET    /:supplierId/scorecard        → ADMIN, INVENTORY_MANAGER, ACCOUNTANT

Transactions:
GET    /:supplierId/transactions     → ADMIN, INVENTORY_MANAGER, ACCOUNTANT
GET    /:supplierId/payables         → ADMIN, ACCOUNTANT

Payments:
POST   /:supplierId/payments         → ADMIN, ACCOUNTANT
GET    /:supplierId/payments         → ADMIN, ACCOUNTANT

Reports:
GET    /reports/summary              → ADMIN, ACCOUNTANT
GET    /reports/export               → ADMIN, ACCOUNTANT

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on: blacklist, payment, create, update
Apply uploadInventoryDoc middleware on document upload routes
src/modules/suppliers/supplier.validator.js
text
You are a procurement data validation specialist. Build Joi 
validation schemas for all supplier management endpoints.

Create and export these schemas:

createSupplierSchema:
- companyName: required string min:3 max:200
- contactPerson: required string min:2 max:100
- email: required valid email, lowercase
- phone: required valid phone with country code
- alternatePhone: optional valid phone
- supplierType: required enum [pharmaceutical, medical_supply,
  equipment, laboratory, food_and_beverages, linen_and_laundry,
  maintenance, it_and_software, construction, other]
- gstinNumber: required string, 
  custom validator: exact 15 chars, 
  regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  Custom error: "Invalid GSTIN format. 
  Example: 27AAPFU0939F1ZV"
- panNumber: required string, 
  regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
- billingAddress: required object:
  {street: string required min:5,
   city: string required, state: string required,
   pincode: string required pattern /^[1-9][0-9]{5}$/,
   country: string default 'India'}
- shippingAddress: optional object (same structure as billing),
  if not provided: same as billing (note in JSDoc)
- bankDetails: optional object:
  {accountNumber: string required min:8 max:20,
   ifscCode: string required pattern /^[A-Z]{4}0[A-Z0-9]{6}$/,
   bankName: string required,
   accountHolderName: string required,
   accountType: enum [savings, current] required}
- paymentTerms: required enum 
  [advance, net_15, net_30, net_45, net_60, on_delivery]
- creditLimit: optional integer min:0 (paise), default: 0
- certifications: optional array of strings max:10
- notes: optional string max:500

updateSupplierSchema:
- All fields from createSupplierSchema optional
- Validate: at least one field provided
- gstinNumber: if provided, full regex validation
- bankDetails: if provided, all bank fields required 
  (partial bank details not allowed)

addCatalogItemSchema:
- supplierId: from params, uuid
- items: required array min:1 max:200, each:
  {
    itemId: required uuid,
    supplierItemCode: optional string max:50,
    unitPrice: required integer min:0 (paise),
    minimumOrderQuantity: required number min:0.01,
    packagingUnit: required string max:50 
      (e.g., "box of 100", "per piece", "per litre"),
    leadTimeDays: required integer min:1 max:180,
    lastQuotedDate: optional date, cannot be future,
    notes: optional string max:200
  }

recordPaymentSchema:
- supplierId: from params, uuid
- purchaseOrderId: optional uuid
- amount: required integer min:1 (paise)
- paymentDate: required date, cannot be future
- paymentMode: required enum 
  [bank_transfer, cheque, upi, cash, demand_draft]
- referenceNumber: required string min:3 max:100
  (UTR number, cheque number, etc.)
- bankDetails: optional object (for cheque: bank name, branch)
- notes: optional string max:300
- paidBy: auto from req.user.id

blacklistSupplierSchema:
- supplierId: from params, uuid
- reason: required string min:20 max:1000
- incidentDate: optional date, cannot be future
- evidenceUrls: optional array of valid S3 URLs max:5
- blacklistedBy: auto from req.user.id

performanceQuerySchema (query params):
- startDate: required valid date
- endDate: required valid date, max 366 days range
- includeScorecard: optional boolean default true

Requirements:
- GSTIN custom validator: validate checksum algorithm
  (digit sum validation as per GST council spec)
- IFSC validator: first 4 chars must be letters, 
  5th char must be 0, last 6 alphanumeric
- All monetary amounts in paise (integer)
- abortEarly: false, stripUnknown: true
- Bank details: add stripSensitive meta flag for audit
- Custom error messages with business procurement language
🏠 3. ROOMS MODULE
src/modules/rooms/room.service.js
text
You are a hospital facilities management engineer. Build a complete 
room management service for a Hospital Management System handling 
all room types, booking, and facility operations.

Implement these service functions:

createRoom(roomData, createdBy):
- Create room with: roomNumber, wardId, floor, building,
  roomType (single_private, double_sharing, triple_sharing,
  general_ward, icu, ot, lab, consultation, pharmacy,
  reception, administration, storage, utility),
  capacity (max occupants), amenities array,
  chargePerDay (for patient rooms), isAvailable
- Auto-generate room code: {WARD_CODE}-{FLOOR}-{ROOM_NUM}
  e.g., ICU-2-101
- Validate wardId exists and floor matches ward's floor range
- Create bed records automatically for patient room types
  based on capacity (call ward service)
- Cache room in Redis: hms:rooms:{roomId} TTL 30 min

getRoomById(roomId):
- Return room with: current occupancy status, bed details,
  current patients (if occupied), amenities, charge per day
- Include real-time availability from ward service
- Cache TTL: 1 min (frequently accessed)

getRoomAvailability(filters):
- filters: {wardId, roomType, capacity, dateTime, amenities}
- Return all matching rooms with status: available/occupied/
  reserved/maintenance/cleaning
- Optimized single query with LEFT JOINs for bed allocations
- Sort: available rooms first, then by room number
- Cache with very short TTL: 30 seconds

allocateRoom(patientId, roomId, bedId, admissionId, allocatedBy):
- Check room/bed is available (Redis lock to prevent race)
- Validate room capacity not exceeded
- Create room allocation record
- Update bed status to occupied
- Update room occupancy count
- Calculate daily charges based on room type/amenities
- Notify ward nurse via Socket.io
- Release Redis lock

releaseRoom(roomId, bedId, releasedBy, reason):
- Validate patient is discharged or transferred
- Mark bed as CLEANING
- Schedule auto-available after cleaning duration
  (use Bull delayed job: Bull addJob with delay)
- Decrement room occupancy count
- Notify housekeeping team
- Update room availability cache

updateRoomAmenities(roomId, amenities, updatedBy):
- Update amenities list
- Recalculate charge per day if amenities affect pricing
- Log amenity changes for billing accuracy

getRoomsByWard(wardId, filters):
- Return all rooms in a ward grouped by: available, occupied, 
  maintenance, cleaning
- Include occupancy percentage per room type
- Include patient details for occupied rooms (ward staff only)

markRoomMaintenance(roomId, maintenanceData, markedBy):
- Set room status to maintenance
- If occupied: cannot mark maintenance (return error)
- Set expected return date
- Notify housekeeping and ward admin

getRoomOccupancyHistory(roomId, dateRange):
- Historical occupancy: which patient, from when to when,
  charges generated
- Occupancy rate for the period
- Revenue generated from room

getHospitalRoomDashboard():
- All room types: count, occupied, available, maintenance
- Occupancy rate by room type
- Revenue per room type (today, this month)
- Rooms with longest current stays
- Cache 5 minutes, Socket.io bust on any room change

transferPatientRoom(patientId, fromRoomId, toBedId, reason, transferredBy):
- Atomic: release old room/bed + allocate new in transaction
- Handle billing: prorate old room charges, start new room charges
- Notify nurses of both wards
- Update patient's medical record with transfer note

Requirements:
- Redis lock timeout: 10 seconds for room allocation
- OT rooms and ICU: additional equipment check before booking
- Consultation rooms: time-slot based booking (not full-day)
- All patient room charges auto-calculated and pushed to billing
- Real-time status broadcast via Socket.io 
  to ward display screens
src/modules/rooms/room.controller.js
text
You are a backend API engineer. Build a room management controller 
for a Hospital Management System with real-time availability handling.

Implement these controller methods:

Room CRUD:
1.  createRoom(req, res, next)
2.  getRoomById(req, res, next)
3.  updateRoom(req, res, next)
4.  deactivateRoom(req, res, next) — soft delete
5.  listRooms(req, res, next) — paginated, filtered
6.  getRoomsByWard(req, res, next)
7.  searchRooms(req, res, next)

Availability:
8.  getRoomAvailability(req, res, next) — real-time
9.  getRoomCalendar(req, res, next) — for consultation rooms
10. checkRoomAvailability(req, res, next) — single room check

Allocation:
11. allocateRoom(req, res, next)
12. releaseRoom(req, res, next)
13. transferPatientRoom(req, res, next)
14. getCurrentRoomOccupancy(req, res, next)

Maintenance:
15. markRoomMaintenance(req, res, next)
16. completeMaintenance(req, res, next)
17. markRoomCleaning(req, res, next)
18. markCleaningComplete(req, res, next)

Amenities & Config:
19. updateRoomAmenities(req, res, next)
20. updateRoomCharges(req, res, next) — admin only
21. getRoomAmenities(req, res, next)

History & Analytics:
22. getRoomOccupancyHistory(req, res, next)
23. getRoomRevenue(req, res, next)
24. getHospitalRoomDashboard(req, res, next)
25. getRoomUtilizationReport(req, res, next)

Requirements:
- getRoomAvailability: set Cache-Control: no-store header
- getHospitalRoomDashboard: include X-Cache-Status header
- allocateRoom: validate wardId matches roomId.wardId 
  in controller before service call
- markRoomMaintenance: validate room has no current patients
  before calling service
- getRoomCalendar: extract date range from query params,
  default to current week
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/rooms/room.routes.js
text
You are an API design engineer. Build room management routes 
for a Hospital Management System.

Mount under /api/v1/rooms

Room Management:
POST   /                             → ADMIN
GET    /                             → all authenticated staff
GET    /search                       → all authenticated staff
GET    /availability                 → all authenticated staff
GET    /dashboard                    → ADMIN, NURSE
GET    /by-ward/:wardId              → all authenticated staff
GET    /:roomId                      → all authenticated staff
PUT    /:roomId                      → ADMIN
DELETE /:roomId                      → ADMIN
GET    /:roomId/availability         → all authenticated staff
GET    /:roomId/calendar             → DOCTOR, RECEPTIONIST, ADMIN
GET    /:roomId/occupancy-history    → ADMIN, NURSE
GET    /:roomId/revenue              → ADMIN, ACCOUNTANT

Allocation:
POST   /:roomId/allocate             → DOCTOR, ADMIN, RECEPTIONIST
POST   /:roomId/release              → DOCTOR, NURSE, ADMIN
POST   /:roomId/transfer             → DOCTOR, ADMIN

Maintenance:
POST   /:roomId/maintenance          → ADMIN
POST   /:roomId/maintenance/complete → ADMIN, NURSE
POST   /:roomId/cleaning             → NURSE, ADMIN
POST   /:roomId/cleaning/complete    → NURSE, ADMIN

Amenities:
PUT    /:roomId/amenities            → ADMIN
GET    /:roomId/amenities            → all authenticated
PUT    /:roomId/charges              → ADMIN only

Reports:
GET    /reports/utilization          → ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on allocation, release, maintenance routes
Availability endpoints: no-store cache headers via middleware
Socket.io broadcast on status change: 
  handled in service, not route level
src/modules/rooms/room.validator.js
text
You are a facilities management data validation specialist. 
Build Joi validation schemas for all room management endpoints.

Create and export these schemas:

createRoomSchema:
- roomNumber: required string min:1 max:20, 
  alphanumeric with hyphens only
- wardId: required uuid
- floor: required integer min:0 max:50
- building: optional string max:50 default: 'Main'
- roomType: required enum [single_private, double_sharing,
  triple_sharing, general_ward, icu, nicu, ot, picu,
  recovery, isolation, consultation, procedure_room,
  pharmacy, laboratory, reception, administration,
  storage, utility, cafeteria]
- capacity: required integer min:1 max:50
  (for patient rooms: min:1 max:10,
   for OT: min:1 max:3,
   for general_ward: min:4 max:50)
- chargePerDay: required integer min:0 (paise),
  0 for non-patient rooms (admin, storage etc)
- amenities: optional array of enum
  [ac, tv, wifi, attached_bathroom, private_bathroom,
   refrigerator, visitor_couch, nursing_call_button,
   oxygen_port, suction_port, cardiac_monitor,
   ventilator_port, wardrobe, safe]
- isActive: boolean default true
- maintenanceNotes: optional string max:500

allocateRoomSchema:
- patientId: required uuid
- roomId: from params, uuid
- bedId: required uuid
- admissionId: required uuid
- expectedDurationDays: optional integer min:1 max:365
- specialRequirements: optional array of strings
- notes: optional string max:300

releaseRoomSchema:
- roomId: from params, uuid
- bedId: required uuid
- releaseReason: required enum 
  [patient_discharged, patient_transferred, 
   patient_deceased, admin_release]
- cleaningRequired: boolean default true
- cleaningDurationMinutes: integer min:30 max:480 default: 120
- notes: optional string max:300

roomMaintenanceSchema:
- roomId: from params, uuid
- maintenanceType: required enum 
  [electrical, plumbing, hvac, furniture,
   equipment, painting, deep_cleaning, inspection]
- scheduledStartDate: required datetime, cannot be past
- estimatedEndDate: required datetime, must be after start
- technicianName: optional string max:100
- maintenanceCompany: optional string max:100
- notes: required string min:10 max:500

updateChargesSchema:
- roomId: from params, uuid
- chargePerDay: required integer min:0 (paise)
- effectiveFrom: required date, cannot be past more than 1 day
- reason: required string min:5 max:200
  (required for audit trail)

roomAvailabilityQuerySchema (query params):
- wardId: optional uuid
- roomType: optional enum
- minCapacity: optional integer min:1
- amenities: optional array of enum amenity values
- dateTime: optional datetime (check availability at specific time)
- availableOnly: optional boolean default true

Requirements:
- capacity validation: use Joi.when() on roomType
  to apply appropriate min/max capacity constraints
- chargePerDay: must be 0 for non-patient roomTypes
  (admin, storage, utility etc) — validate with Joi.when()
- abortEarly: false, stripUnknown: true
- Custom error: "Room capacity for ICU must be between 1-3 beds"
- All uuid params validated with Joi.string().uuid()
👩‍⚕️ 4. NURSES MODULE
src/modules/nurses/nurse.service.js
text
You are a nursing workflow systems engineer. Build a complete 
nurse management service for a Hospital Management System 
handling nursing assignments, patient care, and ward duties.

Implement these service functions:

createNurseProfile(nurseData, createdBy):
- Extend user account (NURSE role) with nursing-specific profile:
  nursingLicense (registration number + council name),
  nursingSpecialization (general, icu, pediatric, maternity,
  oncology, psychiatric, emergency, OT scrub),
  yearsOfExperience, qualifications array,
  skills (IV cannulation, ventilator management, etc.),
  preferredShift, assignedWardId
- Validate nursing license number format
- Generate Nurse ID: NR-SPEC-XXXX
- Upload license certificate to S3
- Assign to ward if wardId provided
- Notify ward head nurse via notification service

assignNurseToWard(nurseId, wardId, assignedBy):
- Validate nurse is not already assigned to another ward
  (or handle transfer scenario)
- Check ward staffing ratio: 
  ICU: max 2 patients per nurse,
  General: max 8 patients per nurse,
  alert if ratio exceeded after assignment
- Create ward assignment record with start date
- Notify ward head nurse and the assigned nurse
- Update nurse availability status

getNurseWorkload(nurseId, date):
- Current patients assigned to nurse
- Tasks pending: vitals due, medications due, 
  wound dressing, patient education
- Completed tasks today
- Patient acuity scores (calculate simple acuity 
  from diagnosis and vitals trend)
- Shift hours remaining
- Alert: overloaded flag if > recommended patient ratio

assignPatientToNurse(nurseId, patientId, assignedBy):
- Check nurse's current patient load vs capacity
- Check nurse's ward matches patient's ward
- Create nursing assignment record
- Add to nurse's active patient list
- Notify assigned nurse via Socket.io
- Auto-unassign when patient is discharged

recordNursingNote(patientId, nurseId, noteData):
- Record nursing observation note with:
  noteType (assessment, intervention, education, 
  evaluation, handover, SBAR), content, vitalsTaken flag
- Push note to patient's medical record
- If SBAR type: structured fields for handover
- Flag urgent notes: immediately notify on-duty doctor
- Store with timestamp to millisecond

recordVitals(patientId, nurseId, vitalsData):
- Record: BP systolic/diastolic, pulse, temperature,
  respiratory rate, SpO2, blood glucose, weight, GCS (if ICU),
  pain score (0-10), pupil reaction (ICU),
  urinary output (ICU), fluid balance
- Auto-flag abnormal values against reference ranges
- Critical vitals: immediate alert to doctor via Socket.io + SMS
- Calculate NEWS2 score, trigger escalation if ≥ 7
- Store in time-series format for trend charts

performMedicationAdministration(patientId, nurseId, medicationData):
- Verify 5 rights: right patient, right drug, right dose, 
  right route, right time
- Scan patient wristband ID and medication barcode 
  (accept as string inputs)
- Record administration: time, dose given, route, site (for injections),
  patient reaction, nurse signature
- Update Medication Administration Record (MAR)
- If medication withheld: record reason and notify doctor
- Calculate next due time and set reminder

shiftHandover(fromNurseId, toNurseId, wardId, handoverData):
- Structured SBAR handover for each patient:
  Situation, Background, Assessment, Recommendation
- Pending tasks list carried forward
- Critical patient flags
- Medication changes since last shift
- Doctor orders pending execution
- Generate handover PDF report
- Both nurses digitally acknowledge handover
- Timestamp handover completion

getWardNursingStatus(wardId, shift):
- All patients in ward with nursing assignments
- Overdue vitals (> scheduled frequency)
- Pending medication administrations (due in next 1hr)
- Pending doctor orders to execute
- Nurses on duty and their patient assignments
- Alert: patients with no nursing assessment in > 4 hours

getNursePerformanceMetrics(nurseId, dateRange):
- Tasks completed on time vs delayed
- Patient satisfaction (if collected)
- Documentation completeness score
- Medication error incidents (from incident reports)
- Attendance and punctuality
- Training compliance

getPatientNursingCareHistory(patientId, dateRange):
- All nursing notes chronological
- Vitals trend data
- Medication administration history
- Interventions performed
- Nursing care plans

Requirements:
- Vital recording: auto-calculate NEWS2, 
  trigger escalation protocol if score ≥ 7
- Medication administration: 5-rights check mandatory
- Critical vitals: guaranteed delivery of alert 
  (retry if doctor notification fails)
- All nursing notes timestamped to millisecond (legal records)
- Handover must be formally acknowledged by both nurses
- Nursing ratios enforced: alert (not block) if exceeded
src/modules/nurses/nurse.controller.js
text
You are a backend API engineer. Build a nursing management 
controller for a Hospital Management System handling all 
nursing workflow operations.

Implement these controller methods:

Nurse Profile:
1.  createNurseProfile(req, res, next)
2.  getNurseById(req, res, next)
3.  updateNurseProfile(req, res, next)
4.  getNursesByWard(req, res, next)
5.  listNurses(req, res, next) — paginated, filtered
6.  searchNurses(req, res, next)
7.  uploadLicenseCertificate(req, res, next)
8.  getNurseLicense(req, res, next)

Ward Assignment:
9.  assignNurseToWard(req, res, next)
10. removeNurseFromWard(req, res, next)
11. transferNurse(req, res, next)
12. getWardAssignmentHistory(req, res, next)

Patient Assignment:
13. assignPatientToNurse(req, res, next)
14. unassignPatient(req, res, next)
15. getMyPatients(req, res, next) — nurse's own patients
16. getNurseWorkload(req, res, next)
17. getWardNursingStatus(req, res, next)

Clinical:
18. recordVitals(req, res, next)
19. getPatientVitalsHistory(req, res, next)
20. addNursingNote(req, res, next)
21. getNursingNotes(req, res, next)
22. performMedicationAdministration(req, res, next)
23. getMedicationAdministrationRecord(req, res, next)
24. withholdMedication(req, res, next) — with reason

Handover:
25. initiateShiftHandover(req, res, next)
26. completeShiftHandover(req, res, next)
27. acknowledgeHandover(req, res, next)
28. getHandoverHistory(req, res, next)
29. getHandoverPDF(req, res, next)

Care Plan:
30. createNursingCarePlan(req, res, next)
31. updateCarePlan(req, res, next)
32. getPatientCarePlan(req, res, next)

Performance & Reports:
33. getNursePerformanceMetrics(req, res, next)
34. getNursingDashboard(req, res, next)
35. getPatientNursingHistory(req, res, next)

Requirements:
- recordVitals: if critical flags returned from service,
  add X-Critical-Alert: true response header
- performMedicationAdministration: validate all 5 rights 
  data present in request body before service call
- getMyPatients: always use req.user.id for nurse,
  admin can query with nurseId param
- getWardNursingStatus: pass wardId from 
  req.user.assignedWardId if nurse, else from params if admin
- acknowledgeHandover: validate req.user.id matches 
  receiving nurse before service call
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
src/modules/nurses/nurse.routes.js
text
You are a clinical API design engineer. Build nursing module 
routes for a Hospital Management System with nursing workflow 
access control.

Mount under /api/v1/nurses

Profile routes:
POST   /                              → ADMIN, HR
GET    /                              → ADMIN, HR, HEAD_NURSE
GET    /search                        → ADMIN, HR, DOCTOR
GET    /by-ward/:wardId               → ADMIN, DOCTOR, HEAD_NURSE
GET    /:nurseId                      → ADMIN, DOCTOR, NURSE (own)
PUT    /:nurseId                      → ADMIN, HR, NURSE (own)
POST   /:nurseId/license              → ADMIN, NURSE (own) 
                                        (upload middleware)
GET    /:nurseId/license              → ADMIN

Ward Assignment:
POST   /:nurseId/ward/assign          → ADMIN, HEAD_NURSE
POST   /:nurseId/ward/remove          → ADMIN, HEAD_NURSE
POST   /:nurseId/ward/transfer        → ADMIN
GET    /:nurseId/ward/history         → ADMIN, HEAD_NURSE, NURSE (own)

Patient Assignment:
POST   /:nurseId/patients/assign      → ADMIN, HEAD_NURSE, NURSE
POST   /:nurseId/patients/unassign    → ADMIN, HEAD_NURSE, NURSE
GET    /my/patients                   → NURSE (own ward patients)
GET    /:nurseId/patients             → ADMIN, HEAD_NURSE
GET    /:nurseId/workload             → ADMIN, HEAD_NURSE, NURSE (own)
GET    /ward/:wardId/status           → NURSE, HEAD_NURSE, DOCTOR, ADMIN

Clinical routes:
POST   /vitals/:patientId             → NURSE, DOCTOR
GET    /vitals/:patientId             → NURSE, DOCTOR, ADMIN
POST   /notes/:patientId              → NURSE
GET    /notes/:patientId              → NURSE, DOCTOR, ADMIN
POST   /medication/:patientId/administer → NURSE
GET    /medication/:patientId/mar     → NURSE, DOCTOR, ADMIN
POST   /medication/:patientId/withhold   → NURSE (with reason)

Handover:
POST   /handover/initiate             → NURSE
POST   /handover/:handoverId/complete → NURSE
POST   /handover/:handoverId/acknowledge → NURSE (receiving)
GET    /handover/ward/:wardId         → NURSE, HEAD_NURSE, ADMIN
GET    /handover/:handoverId/pdf      → NURSE, HEAD_NURSE, ADMIN

Care Plan:
POST   /care-plan/:patientId          → NURSE, DOCTOR
PUT    /care-plan/:patientId          → NURSE, DOCTOR
GET    /care-plan/:patientId          → NURSE, DOCTOR, ADMIN

Performance:
GET    /:nurseId/performance          → ADMIN, HEAD_NURSE, NURSE (own)
GET    /dashboard                     → NURSE, HEAD_NURSE, ADMIN
GET    /patient/:patientId/nursing-history → NURSE, DOCTOR, ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on all clinical write routes
  (nursing notes, vitals, MAR — all are legal records)
Critical vitals route: apply criticalAlertMiddleware
  (post-process: check response for critical flags, 
  trigger Socket.io in middleware if critical)
Medication administration: apply medicationSafetyMiddleware
  (logs 5-rights check in audit trail)
src/modules/nurses/nurse.validator.js
text
You are a clinical nursing data validation specialist. Build Joi 
validation schemas for all nursing module endpoints.

Create and export these schemas:

createNurseProfileSchema:
- userId: required uuid (existing user with NURSE role)
- nursingLicenseNumber: required string min:5 max:30
- nursingCouncil: required string min:5 max:100
  (e.g., "Tamil Nadu Nurses and Midwives Council")
- licenseExpiryDate: required date, must be future
- nursingSpecialization: required enum
  [general, icu, nicu, picu, pediatric, maternity,
   oncology, psychiatric, emergency, ot_scrub, 
   cardiac_care, renal_care, neurology]
- yearsOfExperience: required integer min:0 max:50
- qualifications: required array min:1, each:
  {degree: string required (e.g., "B.Sc Nursing", "GNM"),
   institution: string required,
   year: integer min:1970 max:currentYear required,
   isRegistered: boolean default false}
- skills: optional array of strings max:20
  (clinical skills: IV cannulation, catheter insertion, etc.)
- preferredShift: optional enum [morning, afternoon, night, any]
- assignedWardId: optional uuid

recordVitalsSchema:
- patientId: from params, uuid
- bloodPressureSystolic: required integer min:40 max:300
- bloodPressureDiastolic: required integer min:20 max:200
- pulse: required integer min:0 max:300
- temperature: required number min:28 max:45 (Celsius)
- respiratoryRate: required integer min:0 max:60
- oxygenSaturation: required integer min:0 max:100
- painScore: required integer min:0 max:10
- bloodGlucose: optional number min:10 max:800 (mg/dL)
- urinaryOutput: optional integer min:0 (ml, last hour)
- glasgowComaScale: optional integer min:3 max:15
  (required for ICU patients — enforced in service)
- pupilLeftReaction: optional enum [brisk, sluggish, fixed]
- pupilRightReaction: optional enum [brisk, sluggish, fixed]
- weight: optional number min:0.5 max:500 (kg)
- fluidIntake: optional integer min:0 (ml, last hour)
- notes: optional string max:500
- recordedAt: optional datetime (if recording retrospectively,
  cannot be more than 1hr in past)

addNursingNoteSchema:
- patientId: from params, uuid
- noteType: required enum 
  [assessment, intervention, patient_education, 
   evaluation, handover_note, incident_report, 
   sbar, family_communication, wound_care]
- content: required string min:10 max:5000
- isUrgent: boolean default false
  (if true: notify doctor immediately via service)
- For noteType = sbar: require structured object:
  sbar: {situation: string min:10 required,
         background: string min:10 required,
         assessment: string min:10 required,
         recommendation: string min:10 required}
- attachmentUrl: optional valid URL (for wound photos etc.)

medicationAdministrationSchema:
- patientId: from params, uuid
- prescriptionId: required uuid
- medicineId: required uuid
- scheduledTime: required datetime
- administeredAt: required datetime, 
  cannot be more than 30 min from scheduledTime
- dose: required string min:2 max:50 (e.g., "500mg", "2 tablets")
- route: required enum 
  [oral, iv, im, sc, sublingual, topical, 
   inhalation, rectal, ophthalmic, nasal]
- site: optional string max:100 
  (injection site: "left deltoid", "right forearm" etc.)
- patientVerificationMethod: required enum 
  [wristband_check, verbal_confirmation, barcode_scan]
- patientIdConfirmed: required boolean, must be true
- drugNameConfirmed: required boolean, must be true
- doseConfirmed: required boolean, must be true
- routeConfirmed: required boolean, must be true
- timeConfirmed: required boolean, must be true
- patientReaction: optional string max:300
- notes: optional string max:500
- All 5 confirmed booleans: must all be true to proceed
  Custom error: "All 5 medication rights must be confirmed 
  before administration"

shiftHandoverSchema:
- fromNurseId: auto from req.user.id
- toNurseId: required uuid
- wardId: required uuid
- shiftType: required enum [morning_to_afternoon, 
  afternoon_to_night, night_to_morning]
- patients: required array min:1, each:
  {patientId: uuid required,
   situation: string required min:10 max:500,
   background: string required min:10 max:500,
   assessment: string required min:10 max:500,
   recommendation: string required min:10 max:500,
   pendingTasks: array of strings optional,
   urgentFlags: array of strings optional,
   painScore: integer min:0 max:10 required}
- generalWardNotes: optional string max:1000
- equipmentStatus: optional string max:500
- incidentsDuringShift: optional string max:1000

assignPatientSchema:
- nurseId: from params, uuid
- patientId: required uuid
- isPrimary: boolean default false 
  (primary nurse vs supporting nurse)
- shiftType: required enum [morning, afternoon, night]
- notes: optional string max:300

Requirements:
- All 5 confirmations in medication administration 
  must be explicitly true (not just truthy)
- Record vitals: validate systolic > diastolic 
  with error: "Systolic pressure must be greater than diastolic"
- Validate temperature unit: Celsius range 28-45
  add note: "Temperature should be in Celsius"
- NEWS2 score auto-calculation hint in schema JSDoc
- abortEarly: false, stripUnknown: true
- Custom clinical error messages throughout
📋 5. MEDICAL RECORDS MODULE
src/modules/medical-records/medicalRecord.service.js
text
You are a clinical health information management engineer. Build 
a comprehensive medical records service for a Hospital Management 
System handling complete patient health histories with 
HIPAA-like compliance.

Implement these service functions:

createMedicalRecord(patientId, recordData, createdBy):
- Create initial medical record shell on patient registration
- Structure: patientId, mrn (Medical Record Number: MRN-XXXXXX),
  blood group, allergies array, chronic conditions array,
  vaccination history, family history, surgical history,
  social history (smoking, alcohol, occupation),
  OB/GYN history (for female patients)
- MRN auto-generated: MRN-YYYY-XXXXXX (year-based)
- Link to patient profile
- Encrypt sensitive fields: HIV status, psychiatric history
  using encryption.util.js
- Create initial access log entry

addConsultationRecord(patientId, consultationData, doctorId):
- Add visit record: visitType (OPD/IPD/Emergency/Telemedicine),
  visitDate, complaints, history of present illness,
  examination findings, diagnosis (ICD-10 codes array),
  treatment plan, prescriptions issued, lab orders,
  follow-up instructions
- Store diagnosis in both: human readable + ICD-10 code format
- Auto-link: prescription IDs, lab order IDs
- Push to medical record timeline
- Notify: if new chronic condition diagnosed → 
  update chronic conditions list

getMedicalRecord(patientId, requestingUser):
- Role-based response shaping:
  DOCTOR (treating): full record including sensitive fields
  DOCTOR (non-treating): limited (requires patient consent flag)
  NURSE: clinical care fields only, no psychiatric/sensitive
  PATIENT (self): own record, age-appropriate view
  ADMIN: administrative fields only (no clinical details)
- Log EVERY access to audit trail (PHI access logging)
- Build complete timeline: all visits, admissions, procedures,
  lab results, prescriptions chronologically
- Cache patient timeline in Redis: hms:medrecord:{patientId} 
  TTL 5 min (short TTL for frequently updated data)

getMedicalHistory(patientId, filters):
- filters: {dateRange, visitType, doctorId, diagnosis, module}
- Return filtered consultation history
- Paginated and sorted by date descending
- Group by: admissions, OPD visits, procedures, lab tests

updateAllergies(patientId, allergiesData, updatedBy):
- Add/remove/update allergy entries
  Each allergy: substance, reactionType, severity (mild/moderate/severe),
  onsetDate, notes
- CRITICAL: push allergy update to pharmacy module 
  (drug-allergy interaction check cache invalidation)
- Alert all active prescriptions for this patient 
  if new allergy conflicts with current medications
- Create detailed audit entry (allergy changes are critical safety data)

updateChronicConditions(patientId, conditions, updatedBy):
- Manage ongoing chronic conditions list
- Each condition: name, ICD-10 code, diagnosedDate, 
  managingDoctorId, currentStatus, medications for condition
- Audit trail with change tracking

addSurgicalHistory(patientId, surgeryData, addedBy):
- Add past surgical procedure: 
  procedureName, date, hospital, surgeon, outcome,
  complications, implants (link to
Claude Sonnet 4.6
MEDICAL RECORDS MODULE complete this & remaining 4 modules also

Thought Process
expand
🏥 Completing Medical Records + 3 Remaining Modules (Insurance, Departments, Appointments)
📋 5. MEDICAL RECORDS MODULE (Complete)
src/modules/medical-records/medicalRecord.service.js — COMPLETE
text
You are a clinical health information management engineer. Build 
a comprehensive medical records service for a Hospital Management 
System handling complete patient health histories with 
HIPAA-like compliance.

Implement these service functions with full business logic:

createMedicalRecord(patientId, recordData, createdBy):
- Create initial medical record shell on patient registration
- Structure: patientId, mrn (Medical Record Number),
  blood group, allergies array, chronic conditions array,
  vaccination history, family history, surgical history,
  social history (smoking, alcohol, occupation),
  OB/GYN history (for female patients)
- MRN auto-generated: MRN-YYYY-XXXXXX (year-based sequential)
- Link to patient profile (one-to-one relationship)
- Encrypt sensitive fields: HIV status, psychiatric history,
  substance abuse history using encryption.util.js
- Create initial PHI access log entry
- Cache MRN lookup: hms:mrn:{patientId} TTL 24hr

addConsultationRecord(patientId, consultationData, doctorId):
- Add visit record with: visitType (OPD/IPD/Emergency/Telemedicine),
  visitDate, chiefComplaint, historyOfPresentIllness,
  pastMedicalHistory, examinationFindings,
  diagnosis array (each: {icd10Code, description, type:
  primary/secondary/comorbidity}),
  treatmentPlan, prescriptionIds array, labOrderIds array,
  followUpInstructions, doctorSignature
- Validate doctorId is licensed and active in DB
- Auto-link prescription and lab order IDs from other modules
- If new chronic/serious diagnosis: 
  auto-update chronic conditions list
- Push to patient's medical timeline
- Invalidate Redis cache for patient medical record
- Create audit log: doctorId, patientId, timestamp, visitType

getMedicalRecord(patientId, requestingUser):
- Role-based response shaping:
  DOCTOR (assigned to patient): full record + sensitive fields
  DOCTOR (not assigned): base clinical record only,
    flag: requiresConsentForFullAccess: true
  NURSE: clinical care fields only (vitals, allergies,
    medications, care notes) — no psychiatric/sensitive
  PATIENT (own): own full record minus internal doctor notes
  RECEPTIONIST: administrative fields only 
    (demographics, insurance, appointments)
  ADMIN: administrative + billing, no clinical details
- Log EVERY access to PHI audit trail regardless of role
- Build complete timeline: consultations, admissions,
  procedures, lab results, prescriptions chronologically
- Group by year for large histories (> 5 years)
- Cache per patient per role in Redis:
  key: hms:medrecord:{patientId}:{role} TTL 5 min
- Return: {medicalRecord, timeline, accessLevel, warnings[]}

getMedicalHistory(patientId, filters, pagination):
- filters: {dateRange, visitType, doctorId, 
  diagnosisCode, module, department}
- Return filtered consultation history with pagination
- Sort by date descending (most recent first)
- Group by visitType if groupBy param provided
- Each item includes: visitDate, doctor, diagnosis summary,
  treatmentGiven, prescriptionsCount, labOrdersCount
- NEVER return full note content in list — summary only
  (fetch full details via getConsultationById)

getConsultationById(consultationId, requestingUser):
- Return full consultation record with all details
- Validate requesting user has access to this patient's record
- Log access to audit trail with consultationId
- Include linked: prescriptions, lab results, images
- Return formatted for clinical display

updateAllergies(patientId, allergiesData, updatedBy):
- Add/remove/update allergy entries
  Each allergy: {substance, allergyType (drug/food/environmental/latex),
  reactionType (anaphylaxis/urticaria/rash/nausea/other),
  severity (mild/moderate/severe/life_threatening),
  onsetDate, verifiedBy, notes}
- CRITICAL SAFETY: on any allergy addition →
  notify pharmacy module to recheck all active prescriptions
  Push drug-allergy conflict check for current medications
  Alert prescribing doctors of any conflicts found
- Invalidate pharmacy interaction cache for this patient
- Create CRITICAL audit entry (allergy changes are
  life-safety data — log with CRITICAL flag)
- Send notification to assigned doctor about allergy update

updateChronicConditions(patientId, conditionsData, updatedBy):
- Manage ongoing conditions list, each condition:
  {name, icd10Code, diagnosedDate, diagnosedBy,
  managingDoctorId, currentStatus (active/controlled/resolved),
  currentMedications, lastReviewDate, notes}
- Track condition progression over time
- Alert assigned doctors when new condition added
- Audit trail with before/after state

addSurgicalHistory(patientId, surgeryData, addedBy):
- Add past surgical record:
  {procedureName, procedureCode (CPT/ICD-10-PCS),
  performedDate, hospital, surgeonName, anesthesiaType,
  outcome (successful/complicated/incomplete),
  complications, implantsPlaced array
  (each: {type, manufacturer, serialNumber, model}),
  transfusionsRequired, postOpDiagnosis, notes}
- Implant records are permanent (regulatory requirement)
- Link to OT record if procedure done in this hospital
- Audit all surgical history entries

uploadMedicalDocument(patientId, fileData, uploadedBy):
- Upload to S3: patient-documents bucket
- S3 key: documents/{patientId}/{year}/{uuid}-{filename}
- Document types: lab_report, radiology, discharge_summary,
  prescription, referral_letter, insurance_document,
  consent_form, legal_document, vaccination_record, other
- Store document metadata in DB:
  {patientId, documentType, title, s3Key, uploadedBy,
  uploadedAt, fileSize, mimeType, description, tags}
- Generate pre-signed URL (15 min expiry) after upload
- Log document upload to PHI audit trail

getPatientDocuments(patientId, filters, requestingUser):
- Return document list with pre-signed URLs (fresh 15 min)
- Filter by: documentType, dateRange, uploadedBy
- Validate requesting user has patient access rights
- Log document list access to audit trail

getMedicalSummary(patientId):
- One-page clinical summary for quick reference:
  demographics, blood group, allergies (highlighted),
  chronic conditions, current medications (from active prescriptions),
  recent vital trends (last 7 days),
  last 3 consultations summary,
  upcoming appointments,
  active insurance
- Used for: ward display, emergency quick view
- Cache in Redis: TTL 10 min
- Mark as EMERGENCY_ACCESSIBLE (available even with limited auth)

addVaccinationRecord(patientId, vaccinationData, addedBy):
- Record: vaccineName, manufacturer, batchNumber,
  administeredDate, administeredBy, site, dose (1st/2nd/booster),
  nextDueDate, adverseReaction
- Auto-schedule next dose reminder via notification service
- Validate against standard immunization schedule

getPatientTimeline(patientId, filters):
- Complete chronological timeline of all medical events:
  visits, admissions, procedures, lab tests, 
  prescriptions, documents, vaccinations
- Filter by: dateRange, eventType, module
- Paginated with cursor-based pagination for large histories
- Format for frontend timeline visualization component

grantRecordAccess(patientId, grantedToUserId, accessLevel, expiresAt):
- Patient can grant specific doctor/facility access to records
- accessLevel: full/clinical_only/specific_documents
- Store consent record with expiry
- Notify granted user via email + in-app notification
- Audit consent grant event

revokeRecordAccess(patientId, grantedToUserId, revokedBy):
- Remove access grant
- Notify previously granted user
- Audit revocation event

Requirements:
- ALL access to medical records logged to PHI audit trail
  (read + write both logged — this is the most critical audit)
- Sensitive fields (HIV, psychiatric) encrypted at rest
  using encryption.util.js, decrypted only for authorized roles
- Medical records are APPEND-ONLY (no hard delete, no overwrite)
  — all changes tracked with previous values
- MRN is permanent — never changes even if patient re-registers
- Cache invalidation on every write operation
- All functions throw typed AppError with HIPAA-relevant context
- Soft delete of documents: move to archive S3 prefix,
  never delete from S3 (medical records retention policy)
src/modules/medical-records/medicalRecord.controller.js
text
You are a clinical information systems backend engineer. Build 
a medical records controller for a Hospital Management System 
with strict PHI (Protected Health Information) access control.

Implement these controller methods:

Medical Record Core:
1.  createMedicalRecord(req, res, next)
2.  getMedicalRecord(req, res, next)
     — pass req.user as requestingUser for role-based shaping
3.  getMedicalSummary(req, res, next)
     — quick summary, cache-first
4.  getPatientTimeline(req, res, next)
5.  getMRNByPatientId(req, res, next)
6.  searchByMRN(req, res, next)

Consultation Records:
7.  addConsultationRecord(req, res, next)
8.  getConsultationById(req, res, next)
9.  getMedicalHistory(req, res, next) — paginated, filtered
10. updateConsultationRecord(req, res, next)
     — only by authoring doctor, within 24 hours

Clinical Data:
11. updateAllergies(req, res, next)
12. getAllergies(req, res, next)
13. updateChronicConditions(req, res, next)
14. getChronicConditions(req, res, next)
15. addSurgicalHistory(req, res, next)
16. getSurgicalHistory(req, res, next)
17. addVaccinationRecord(req, res, next)
18. getVaccinationHistory(req, res, next)
19. updateFamilyHistory(req, res, next)
20. getFamilyHistory(req, res, next)
21. updateSocialHistory(req, res, next)

Documents:
22. uploadMedicalDocument(req, res, next)
23. getPatientDocuments(req, res, next)
24. getDocumentById(req, res, next)
25. getDocumentDownloadURL(req, res, next)
     — generate fresh pre-signed S3 URL
26. deleteDocument(req, res, next)
     — soft delete/archive, admin only
27. updateDocumentMetadata(req, res, next)

Access Control:
28. grantRecordAccess(req, res, next)
29. revokeRecordAccess(req, res, next)
30. getAccessGrantsList(req, res, next)
31. getMyAccessGrants(req, res, next)
     — doctors see records they have access to

Reports & Export:
32. exportMedicalRecord(req, res, next)
     — full PDF export of medical record
33. getPatientSummaryPDF(req, res, next)
34. getConsultationPDF(req, res, next)
35. getAuditTrailForRecord(req, res, next)
     — admin: who accessed this patient's record

Requirements:
- getMedicalRecord: always pass full req.user object 
  to service (never just role string)
- addConsultationRecord: extract doctorId from req.user.id,
  never accept doctorId from request body (security)
- getDocumentDownloadURL: generate fresh URL each request,
  log access with documentId + userId to PHI audit trail
- updateConsultationRecord: validate req.user.id === 
  consultation.doctorId before service call (IDOR prevention)
- exportMedicalRecord: queue as Bull job if record > 50 pages,
  return 202 with jobId, else stream PDF response directly
- getAuditTrailForRecord: SUPER_ADMIN and ADMIN only,
  inline role check before service call
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
- Add @phi-sensitive JSDoc flag on all methods that return PHI
src/modules/medical-records/medicalRecord.routes.js
text
You are a clinical API security architect. Build medical records 
routes for a Hospital Management System with PHI access controls 
and comprehensive audit logging.

Mount under /api/v1/medical-records

Core Record:
POST   /                                → DOCTOR, ADMIN, RECEPTIONIST
GET    /patient/:patientId              → DOCTOR, NURSE, ADMIN, PATIENT (own)
GET    /patient/:patientId/summary      → DOCTOR, NURSE, ADMIN, PATIENT (own)
GET    /patient/:patientId/timeline     → DOCTOR, NURSE, ADMIN, PATIENT (own)
GET    /mrn/:patientId                  → all clinical roles
GET    /search/mrn                      → DOCTOR, ADMIN, RECEPTIONIST

Consultations:
POST   /patient/:patientId/consultations      → DOCTOR
GET    /patient/:patientId/consultations      → DOCTOR, NURSE, ADMIN, PATIENT (own)
GET    /patient/:patientId/consultations/:consultId → DOCTOR, NURSE, ADMIN, PATIENT (own)
PUT    /patient/:patientId/consultations/:consultId → DOCTOR (own, 24hr window)

Clinical Data:
PUT    /patient/:patientId/allergies          → DOCTOR, NURSE, ADMIN
GET    /patient/:patientId/allergies          → all clinical roles, PATIENT (own)
PUT    /patient/:patientId/chronic-conditions → DOCTOR, ADMIN
GET    /patient/:patientId/chronic-conditions → all clinical roles, PATIENT (own)
POST   /patient/:patientId/surgical-history   → DOCTOR, ADMIN
GET    /patient/:patientId/surgical-history   → all clinical roles, PATIENT (own)
POST   /patient/:patientId/vaccinations       → DOCTOR, NURSE, ADMIN
GET    /patient/:patientId/vaccinations       → all clinical roles, PATIENT (own)
PUT    /patient/:patientId/family-history     → DOCTOR
GET    /patient/:patientId/family-history     → DOCTOR, ADMIN, PATIENT (own)
PUT    /patient/:patientId/social-history     → DOCTOR
GET    /patient/:patientId/social-history     → DOCTOR, ADMIN

Documents:
POST   /patient/:patientId/documents          → all clinical roles, ADMIN
                                                (uploadMedicalDocument middleware)
GET    /patient/:patientId/documents          → all clinical roles, ADMIN, PATIENT (own)
GET    /patient/:patientId/documents/:docId   → all clinical roles, ADMIN, PATIENT (own)
GET    /patient/:patientId/documents/:docId/download → all clinical roles, PATIENT (own)
PUT    /patient/:patientId/documents/:docId   → ADMIN, DOCTOR (own upload)
DELETE /patient/:patientId/documents/:docId   → ADMIN only

Access Control:
POST   /patient/:patientId/access/grant       → PATIENT (own), ADMIN
DELETE /patient/:patientId/access/:grantId    → PATIENT (own), ADMIN
GET    /patient/:patientId/access/grants      → PATIENT (own), ADMIN
GET    /my-access-grants                      → DOCTOR (records they can access)

Reports:
GET    /patient/:patientId/export             → DOCTOR, ADMIN, PATIENT (own)
GET    /patient/:patientId/summary-pdf        → DOCTOR, ADMIN, PATIENT (own)
GET    /patient/:patientId/consultation/:consultId/pdf → DOCTOR, ADMIN, PATIENT (own)
GET    /patient/:patientId/audit-trail        → ADMIN, SUPER_ADMIN only

Middleware chain: authenticate → authorize → validate → controller

CRITICAL middleware requirements:
- Apply phiAuditMiddleware on EVERY route in this module
  (logs every request — both GET and write — to PHI audit trail)
- This is the only module where GET requests are audited
- Apply encrypt/decrypt middleware on sensitive field routes
  (family-history, social-history)
- Upload route: apply uploadMedicalDocument middleware
- Export routes: apply exportOwnershipValidator middleware
- Patient (own) access: apply patientOwnershipGuard middleware
  (validates req.user.id matches patientId's userId)
- Document download URL: apply documentAccessLogger middleware
- Add PHI_ACCESS header: X-PHI-Access: true on all responses
src/modules/medical-records/medicalRecord.validator.js
text
You are a clinical health information validation specialist. Build 
Joi validation schemas for all medical records module endpoints 
with medical-grade data completeness requirements.

Create and export these schemas:

createMedicalRecordSchema:
- patientId: required uuid
- bloodGroup: required enum [A+, A-, B+, B-, O+, O-, AB+, AB-]
- rhFactor: required enum [positive, negative]
- allergies: optional array max:50, each:
  {substance: string required min:2 max:200,
   allergyType: enum [drug, food, environmental, 
     latex, contrast_dye, other] required,
   reactionType: enum [anaphylaxis, urticaria, rash,
     angioedema, nausea_vomiting, respiratory, other] required,
   severity: enum [mild, moderate, severe, 
     life_threatening] required,
   onsetDate: optional date cannot be future,
   notes: optional string max:300}
- chronicConditions: optional array max:30, each:
  {name: string required min:2 max:200,
   icd10Code: optional string max:10,
   diagnosedDate: optional date cannot be future,
   currentStatus: enum [active, controlled, resolved] required}
- familyHistory: optional object:
  {diabetes: boolean, hypertension: boolean,
   heartDisease: boolean, cancer: boolean,
   mentalIllness: boolean, kidneyDisease: boolean,
   details: optional string max:1000}
- socialHistory: optional object:
  {smokingStatus: enum [never, former, current],
   alcoholUse: enum [never, occasional, moderate, heavy],
   occupation: optional string max:100,
   exerciseFrequency: optional enum [sedentary, light, moderate, active],
   dietType: optional enum [vegetarian, non_vegetarian, vegan]}
- Note: OB/GYN history handled separately via patient gender check

addConsultationRecordSchema:
- patientId: from params, uuid
- visitType: required enum [opd, ipd, emergency, telemedicine,
  follow_up, day_care, second_opinion]
- visitDate: required datetime, cannot be future
- chiefComplaint: required string min:5 max:500
- historyOfPresentIllness: required string min:10 max:5000
- examinationFindings: required string min:5 max:5000
- diagnosis: required array min:1 max:10, each:
  {icd10Code: optional string pattern /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/,
   description: required string min:3 max:300,
   type: required enum [primary, secondary, comorbidity, provisional]}
- treatmentPlan: required string min:10 max:3000
- prescriptionIds: optional array of uuids
- labOrderIds: optional array of uuids
- followUpRequired: required boolean
- followUpInstructions: string min:5 max:1000,
  required if followUpRequired is true
- followUpDate: optional date must be future,
  required if followUpRequired is true
- referralRequired: optional boolean default false
- referralDetails: optional string max:500
- internalNotes: optional string max:2000
  (internal doctor notes — not visible to patient)
- Validate ICD-10 code format with regex if provided

updateAllergiesSchema:
- patientId: from params, uuid
- operation: required enum [add, update, remove]
- allergies: required array min:1, each item:
  {allergyId: optional uuid (for update/remove operations),
   substance: string required for add, min:2 max:200,
   allergyType: enum required for add,
   reactionType: enum required for add,
   severity: enum required for add,
   onsetDate: optional date,
   notes: optional string max:300}
- Validate: for update/remove, allergyId is required
- Validate: for add, substance + allergyType + reactionType 
  + severity all required

addSurgicalHistorySchema:
- patientId: from params, uuid
- procedureName: required string min:3 max:300
- procedureCode: optional string max:20 
  (CPT or ICD-10-PCS code)
- performedDate: required date, cannot be future
- hospitalName: required string min:3 max:200
- surgeonName: required string min:2 max:100
- anesthesiaType: required enum [general, regional, 
  local, spinal, epidural, none]
- outcome: required enum [successful, complicated, 
  incomplete, abandoned]
- complications: optional string max:1000
- implantsPlaced: optional array max:10, each:
  {type: string required min:3 max:200,
   manufacturer: string required min:2 max:100,
   modelNumber: string required min:2 max:100,
   serialNumber: required string min:2 max:100,
   size: optional string max:50}
- transfusionRequired: boolean default false
- unitsTransfused: integer min:0, 
  required if transfusionRequired true
- postOpDiagnosis: optional string max:500
- dischargeDiagnosis: optional string max:500
- notes: optional string max:1000

uploadDocumentSchema (multipart — validates body fields):
- patientId: from params, uuid
- documentType: required enum [lab_report, radiology,
  discharge_summary, prescription, referral_letter,
  insurance_document, consent_form, legal_document,
  vaccination_record, operative_note, pathology,
  imaging, correspondence, other]
- title: required string min:3 max:200
- description: optional string max:500
- tags: optional array of strings max:10
- documentDate: optional date (date of document, not upload)
- isConfidential: boolean default false
  (confidential docs: restricted to treating doctor + admin)

grantAccessSchema:
- patientId: from params, uuid
- grantedToUserId: required uuid
- accessLevel: required enum 
  [full, clinical_only, specific_documents]
- specificDocumentIds: optional array of uuids,
  required if accessLevel is specific_documents
- expiresAt: required datetime must be future,
  max 1 year from now
- purpose: required string min:10 max:300
  (reason for granting access — stored for audit)
- consentConfirmed: required boolean, must be true

medicalHistoryQuerySchema (query params):
- patientId: from params, uuid
- startDate: optional valid date
- endDate: optional valid date must be after startDate
- visitType: optional enum or array of enums
- doctorId: optional uuid
- diagnosisCode: optional string max:10 (ICD-10 filter)
- department: optional string
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:50 default:20
- sortBy: optional enum [visitDate, doctor, visitType]
- sortOrder: optional enum [ASC, DESC] default: DESC

vaccinationRecordSchema:
- patientId: from params, uuid
- vaccineName: required string min:2 max:200
- manufacturer: optional string max:100
- batchNumber: optional string max:50
- administeredDate: required date, cannot be future
- administeredBy: optional string max:100 
  (if administered outside hospital)
- administeredByDoctorId: optional uuid 
  (if administered in this hospital)
- site: optional enum [left_arm, right_arm, 
  left_thigh, right_thigh, oral, other]
- doseNumber: required integer min:1 max:10
- doseType: required enum [primary, booster, annual]
- nextDueDate: optional date, must be future
- adverseReaction: optional string max:500
- vaccinationCertificateUrl: optional valid URL

Requirements:
- ICD-10 code custom Joi extension: validateICD10(code)
  checks regex /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/
  with error: "Invalid ICD-10 code format. Example: J18.9"
- Allergy severity life_threatening: add meta flag
  CRITICAL_ALLERGY: true for audit middleware
- All schemas: abortEarly: false, stripUnknown: true
- Sensitive fields (familyHistory, socialHistory): 
  add PHI_SENSITIVE meta flag
- consentConfirmed must be strict boolean true
  in grantAccessSchema
- Export all schemas as named exports with JSDoc
🛡️ 6. INSURANCE MODULE
src/modules/insurance/insurance.service.js
text
You are a healthcare insurance and TPA integration engineer. Build 
a complete insurance management service for a Hospital Management 
System handling policies, claims, and pre-authorization workflows.

Implement these service functions with full business logic:

addInsuranceProvider(providerData, addedBy):
- Create insurance company/TPA profile:
  providerName, type (insurance_company/tpa/government_scheme),
  GSTNumber, panNumber, contactPerson, email, phone,
  address, claimPortalUrl, claimEmail,
  empanelmentNumber, empanelmentValidTill,
  coveredProcedures array, coveredDiagnoses array,
  roomRentCap (paise/day), icuRentCap,
  copayPercentage (0-100), deductibleAmount,
  preAuthRequired (boolean), claimSLA (days)
- Auto-generate Provider Code: INS-XXXX
- Validate empanelment validity date (cannot be past)
- Alert admin 30 days before empanelment expiry via scheduler
- Cache provider in Redis: hms:insurance:provider:{id} TTL 1hr

addPatientInsurance(patientId, insuranceData, addedBy):
- Link insurance policy to patient:
  providerId, policyNumber, policyType
  (individual/family_floater/group/government),
  membershipId, holderName, holderRelation,
  sumInsured, validFrom, validTill,
  copayPercentage, exclusions array,
  preAuthorizationRequired, tpaId,
  cardImageFrontUrl (S3), cardImageBackUrl (S3)
- Validate policy dates: validFrom < validTill, 
  validFrom cannot be more than 1 year in past
- Check for duplicate policy number per provider
- Alert if policy expires within 30 days of admission
- Cache: hms:insurance:patient:{patientId} TTL 30 min

createPreAuthorization(patientId, preAuthData, requestedBy):
- Create pre-auth request:
  patientId, insuranceId, admissionType,
  plannedAdmissionDate, estimatedDuration,
  primaryDiagnosis (ICD-10), plannedProcedures array,
  estimatedCost, doctorId, wardType, documents array (S3 URLs)
- Generate pre-auth reference: PREAUTH-YYYY-XXXXXX
- Validate patient has active insurance with this provider
- Validate provider empanelment is still valid
- If provider has claimPortalUrl: 
  placeholder HTTP call to submit pre-auth (retry 3 times)
- Send pre-auth request email with PDF to insurance company
- Set status: SUBMITTED, track submission timestamp
- Set auto-follow-up reminder at 24hr if no response

updatePreAuthorizationStatus(preAuthId, statusData, updatedBy):
- Update status: SUBMITTED → UNDER_REVIEW → 
  APPROVED/PARTIALLY_APPROVED/REJECTED → EXPIRED
- If APPROVED: store approved amount, approved procedures,
  validity period, auth code (from insurer)
- If PARTIALLY_APPROVED: store approved amount vs requested,
  list of denied items with reasons
- If REJECTED: store rejection reason, 
  notify billing and patient immediately
- Create audit trail for every status change

createInsuranceClaim(billId, patientInsuranceId, claimData, createdBy):
- Create insurance claim linked to bill:
  claimType (cashless/reimbursement),
  preAuthId (if applicable), admissionDate, dischargeDate,
  primaryDiagnosis, secondaryDiagnoses,
  totalBillAmount, claimedAmount, documents array
- Validate pre-auth is approved if preAuthRequired is true
- Auto-calculate: claimed amount based on policy coverage
  (subtract: copay, deductible, excluded items, room rent cap)
- Generate claim number: CLM-YYYY-XXXXXX
- Validate required documents are attached:
  discharge summary, itemized bill, lab reports, prescriptions
- Submit to insurance portal (placeholder HTTP integration)
- Track claim submission timestamp
- For cashless: hold patient payment for claimed amount
- For reimbursement: full payment from patient, 
  claim is advisory

processClaimSettlement(claimId, settlementData, processedBy):
- Record settlement: settledAmount, settlementDate,
  settlementMode (NEFT/cheque/direct), referenceNumber,
  remarks, shortfall (if partial settlement)
- Calculate patient liability:
  patientLiability = totalBill - settledAmount - alreadyPaid
- If shortfall > 0: notify patient of balance payment
- Update bill status accordingly
- Create financial audit entry
- Release cashless payment hold (if cashless claim)
- Trigger billing module to update bill status

getRejectedClaimReport(filters, pagination):
- All rejected/disputed claims
- Group by: rejection reason, provider, department
- Include: total amount rejected, average time to rejection
- Actionable: claims eligible for re-submission or appeal

getInsuranceDashboard():
- Active policies count (expiring this month highlighted)
- Today's pre-auth requests: pending, approved, rejected
- Claims: submitted, under review, settled, rejected
- Total claimed amount this month
- Settlement ratio (settled/claimed × 100)
- Average settlement time (days)
- Expiring empanelments (providers)
- Cache 10 minutes in Redis

verifyInsuranceEligibility(patientId, providerId, serviceDate):
- Check patient has active policy with this provider
- Check policy is valid on serviceDate
- Check provider empanelment is valid
- Check if service is covered (not in exclusions)
- Check pre-auth requirement
- Return: {eligible, coverageDetails, preAuthRequired, 
  estimatedCoverage, warnings[]}

getClaimsByPatient(patientId, filters, pagination):
- All claims for patient with current status
- Include settlement details
- Filter by: status, dateRange, provider

Requirements:
- Pre-auth documents: validate minimum required docs present
- Cashless claim: hold patient payment in billing module 
  until claim settled
- Claim amount calculations use decimal.js for precision
- Provider empanelment expiry: automated daily check via scheduler
- All insurance amounts stored in paise (integer)
- IRDAI compliance: maintain all claim records for 7 years
- Integration-ready: placeholder functions for 
  insurance portal API calls with retry logic
src/modules/insurance/insurance.controller.js
text
You are a healthcare insurance backend engineer. Build an insurance 
management controller for a Hospital Management System handling 
policy, pre-authorization, and claims workflows.

Implement these controller methods:

Insurance Providers:
1.  addInsuranceProvider(req, res, next)
2.  getInsuranceProviderById(req, res, next)
3.  updateInsuranceProvider(req, res, next)
4.  deactivateInsuranceProvider(req, res, next)
5.  listInsuranceProviders(req, res, next)
6.  searchInsuranceProviders(req, res, next)
7.  getExpiringEmpanelments(req, res, next)
8.  uploadProviderDocument(req, res, next)

Patient Insurance:
9.  addPatientInsurance(req, res, next)
10. getPatientInsuranceById(req, res, next)
11. updatePatientInsurance(req, res, next)
12. deactivatePatientInsurance(req, res, next)
13. listPatientInsurances(req, res, next)
14. verifyInsuranceEligibility(req, res, next)
15. uploadInsuranceCard(req, res, next) — front/back card images

Pre-Authorization:
16. createPreAuthorization(req, res, next)
17. getPreAuthById(req, res, next)
18. updatePreAuthStatus(req, res, next) — admin/accountant
19. listPreAuthorizations(req, res, next)
20. getPendingPreAuths(req, res, next)
21. getPreAuthDocuments(req, res, next)
22. uploadPreAuthDocument(req, res, next)
23. resubmitPreAuth(req, res, next) — if rejected

Claims:
24. createInsuranceClaim(req, res, next)
25. getClaimById(req, res, next)
26. updateClaimStatus(req, res, next) — admin/accountant
27. listClaims(req, res, next)
28. getClaimsByPatient(req, res, next)
29. uploadClaimDocument(req, res, next)
30. processClaimSettlement(req, res, next)
31. disputeClaim(req, res, next) — flag for appeal
32. resubmitClaim(req, res, next)

Reports:
33. getInsuranceDashboard(req, res, next)
34. getClaimSummaryReport(req, res, next)
35. getRejectedClaimsReport(req, res, next)
36. getSettlementReport(req, res, next)
37. getProviderPerformanceReport(req, res, next)
38. exportClaimsReport(req, res, next)

Requirements:
- verifyInsuranceEligibility: lightweight endpoint,
  cache result in Redis 30 min per patient+provider+date combo
- processClaimSettlement: ACCOUNTANT/ADMIN only —
  inline role check before service call
- createInsuranceClaim: validate billId belongs to patientId
  in controller before service call (IDOR prevention)
- uploadInsuranceCard: handle front and back as separate
  fields in multipart form (file field names: cardFront, cardBack)
- getInsuranceDashboard: include X-Cache-Status header
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
- Add @description, @access JSDoc on every method
src/modules/insurance/insurance.routes.js
text
You are an API design engineer. Build insurance management routes 
for a Hospital Management System with financial access control.

Mount under /api/v1/insurance

Insurance Providers:
POST   /providers                          → ADMIN, ACCOUNTANT
GET    /providers                          → all authenticated
GET    /providers/search                   → all authenticated
GET    /providers/expiring-empanelments    → ADMIN, ACCOUNTANT
GET    /providers/:providerId              → all authenticated
PUT    /providers/:providerId              → ADMIN, ACCOUNTANT
DELETE /providers/:providerId              → ADMIN only
POST   /providers/:providerId/documents    → ADMIN, ACCOUNTANT 
                                             (upload middleware)

Patient Insurance:
POST   /patient/:patientId                 → RECEPTIONIST, ACCOUNTANT, ADMIN
GET    /patient/:patientId                 → DOCTOR, NURSE, RECEPTIONIST, 
                                             ACCOUNTANT, ADMIN, PATIENT (own)
GET    /patient/:patientId/:insuranceId    → DOCTOR, ACCOUNTANT, ADMIN
PUT    /patient/:patientId/:insuranceId    → RECEPTIONIST, ACCOUNTANT, ADMIN
DELETE /patient/:patientId/:insuranceId    → ADMIN only
GET    /patient/:patientId/eligibility     → DOCTOR, RECEPTIONIST, ACCOUNTANT, ADMIN
POST   /patient/:patientId/card-upload     → RECEPTIONIST, ADMIN 
                                             (upload middleware)

Pre-Authorization:
POST   /pre-auth                           → DOCTOR, ACCOUNTANT, ADMIN
GET    /pre-auth                           → ACCOUNTANT, ADMIN
GET    /pre-auth/pending                   → ACCOUNTANT, ADMIN
GET    /pre-auth/:preAuthId                → DOCTOR, ACCOUNTANT, ADMIN
PUT    /pre-auth/:preAuthId/status         → ACCOUNTANT, ADMIN
POST   /pre-auth/:preAuthId/documents      → ACCOUNTANT, ADMIN (upload)
POST   /pre-auth/:preAuthId/resubmit       → ACCOUNTANT, ADMIN
GET    /pre-auth/:preAuthId/documents      → ACCOUNTANT, ADMIN, DOCTOR

Claims:
POST   /claims                             → ACCOUNTANT, ADMIN
GET    /claims                             → ACCOUNTANT, ADMIN
GET    /claims/patient/:patientId          → ACCOUNTANT, ADMIN, PATIENT (own)
GET    /claims/:claimId                    → ACCOUNTANT, ADMIN, DOCTOR
PUT    /claims/:claimId/status             → ACCOUNTANT, ADMIN
POST   /claims/:claimId/documents          → ACCOUNTANT, ADMIN (upload)
POST   /claims/:claimId/settlement         → ACCOUNTANT, ADMIN
POST   /claims/:claimId/dispute            → ACCOUNTANT, ADMIN
POST   /claims/:claimId/resubmit           → ACCOUNTANT, ADMIN

Reports:
GET    /reports/dashboard                  → ACCOUNTANT, ADMIN
GET    /reports/claims-summary             → ACCOUNTANT, ADMIN
GET    /reports/rejected-claims            → ACCOUNTANT, ADMIN
GET    /reports/settlement                 → ACCOUNTANT, ADMIN
GET    /reports/provider-performance       → ADMIN
GET    /reports/export                     → ADMIN

Middleware: authenticate → authorize → validate → controller
Apply auditMiddleware on all claim and settlement write routes
Apply uploadMiddleware (reuse uploadMedicalDocument) on document uploads
Card upload: apply uploadProfilePhoto middleware (image only)
Financial routes: apply additionalAccountantVerify middleware
src/modules/insurance/insurance.validator.js
text
You are a healthcare insurance data validation specialist. Build 
Joi validation schemas for all insurance module endpoints.

Create and export these schemas:

addInsuranceProviderSchema:
- providerName: required string min:3 max:200
- providerType: required enum 
  [insurance_company, tpa, government_scheme, 
   corporate_self_insurance]
- gstinNumber: required string, 
  regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
- panNumber: required string regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
- contactPerson: required string min:2 max:100
- email: required valid email
- phone: required valid phone with country code
- address: required object 
  {street: string required, city: string required,
   state: string required, pincode: 6-digit string required,
   country: string default: 'India'}
- claimPortalUrl: optional valid URL
- claimEmail: required valid email
- empanelmentNumber: required string min:3 max:50
- empanelmentValidTill: required date, must be future
- roomRentCap: optional integer min:0 (paise/day)
- icuRentCap: optional integer min:0 (paise/day)
- copayPercentage: optional number min:0 max:100 default:0
- deductibleAmount: optional integer min:0 (paise) default:0
- preAuthRequired: required boolean
- claimSLA: required integer min:1 max:90 (days)
- coveredProcedures: optional array of strings max:500
- coveredDiagnoses: optional array of ICD-10 strings max:500
- notes: optional string max:500

addPatientInsuranceSchema:
- patientId: from params, uuid
- providerId: required uuid
- tpaId: optional uuid (if TPA is different from insurer)
- policyNumber: required string min:3 max:50
- membershipId: optional string min:2 max:50
- policyType: required enum 
  [individual, family_floater, group, 
   government_scheme, corporate]
- holderName: required string min:2 max:100
- holderRelation: required enum 
  [self, spouse, father, mother, son, daughter,
   father_in_law, mother_in_law, sibling, other]
- sumInsured: required integer min:1 (paise)
- copayPercentage: optional number min:0 max:100
- deductibleAmount: optional integer min:0 (paise)
- validFrom: required date
- validTill: required date, must be after validFrom
- preAuthorizationRequired: boolean default false
- exclusions: optional array of strings max:50
  (specific exclusions for this patient's policy)
- notes: optional string max:500
- Validate: validTill must be after validFrom
  Custom error: "Policy end date must be after start date"

createPreAuthorizationSchema:
- patientId: required uuid
- patientInsuranceId: required uuid
- admissionType: required enum 
  [elective, emergency, maternity, daycare, investigation]
- plannedAdmissionDate: required date, 
  cannot be past more than 1 day
- estimatedDurationDays: required integer min:1 max:365
- primaryDiagnosis: required object:
  {icd10Code: optional string, description: required min:5 max:300}
- plannedProcedures: required array min:1 max:10, each:
  {procedureName: string required min:3 max:200,
   procedureCode: optional string max:20,
   estimatedCost: required integer min:0 (paise)}
- wardType: required enum 
  [general, semi_private, private, icu, nicu]
- estimatedRoomCharges: required integer min:0 (paise)
- estimatedMedicineCharges: required integer min:0 (paise)
- estimatedLabCharges: optional integer min:0 (paise)
- totalEstimatedCost: required integer min:1 (paise)
  Validate: must be >= sum of all estimated charges
- doct
Claude Sonnet 4.6
MEDICAL RECORDS MODULE complete this & remaining 4 modules also

Thought Process
expand
✅ Completing Insurance Validator + Departments + Appointments Modules
🛡️ 6. INSURANCE MODULE (Completing Validator)
src/modules/insurance/insurance.validator.js — COMPLETE
text
You are a healthcare insurance data validation specialist. Build 
Joi validation schemas for all insurance module endpoints in a 
Hospital Management System.

Create and export these schemas:

addInsuranceProviderSchema:
- providerName: required string min:3 max:200
- providerType: required enum
  [insurance_company, tpa, government_scheme,
   corporate_self_insurance]
- gstinNumber: required string,
  custom validator regex:
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  Custom error: "Invalid GSTIN. Example: 27AAPFU0939F1ZV"
- panNumber: required string
  regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  Custom error: "Invalid PAN. Example: ABCDE1234F"
- contactPerson: required string min:2 max:100
- email: required valid email lowercase
- phone: required valid phone E.164 format
- address: required object:
  {street: string required min:5 max:200,
   city: string required min:2 max:100,
   state: string required min:2 max:100,
   pincode: string required pattern /^[1-9][0-9]{5}$/,
   country: string default 'India'}
- claimPortalUrl: optional valid URL
- claimEmail: required valid email
- empanelmentNumber: required string min:3 max:50
- empanelmentValidTill: required date, must be future
  Custom error: "Empanelment date must be a future date"
- roomRentCap: optional integer min:0 (paise/day),
  0 means no cap
- icuRentCap: optional integer min:0 (paise/day)
- copayPercentage: optional number min:0 max:100 default:0
- deductibleAmount: optional integer min:0 (paise) default:0
- preAuthRequired: required boolean
- claimSLA: required integer min:1 max:90
  Custom error: "Claim SLA must be between 1 and 90 days"
- coveredProcedures: optional array of strings max:500
- coveredDiagnoses: optional array of strings max:500
- notes: optional string max:500

addPatientInsuranceSchema:
- patientId: from params uuid
- providerId: required uuid
- tpaId: optional uuid
- policyNumber: required string min:3 max:50
- membershipId: optional string min:2 max:50
- policyType: required enum
  [individual, family_floater, group,
   government_scheme, corporate]
- holderName: required string min:2 max:100
- holderRelation: required enum
  [self, spouse, father, mother, son, daughter,
   father_in_law, mother_in_law, sibling, other]
- sumInsured: required integer min:1 (paise)
  Custom error: "Sum insured must be greater than zero"
- copayPercentage: optional number min:0 max:100 default:0
- deductibleAmount: optional integer min:0 (paise) default:0
- validFrom: required date
- validTill: required date must be after validFrom
  Custom error: "Policy end date must be after start date"
- preAuthorizationRequired: boolean default false
- exclusions: optional array of strings max:50
- notes: optional string max:500
- Validate: if holderRelation is self,
  holderName should match patient name (validation hint in meta)

createPreAuthorizationSchema:
- patientId: required uuid
- patientInsuranceId: required uuid
- admissionType: required enum
  [elective, emergency, maternity, daycare,
   investigation, rehabilitation]
- plannedAdmissionDate: required date
  cannot be past more than 1 day
  Custom error: "Planned admission date cannot be in the past"
- estimatedDurationDays: required integer min:1 max:365
- primaryDiagnosis: required object:
  {icd10Code: optional string
   pattern /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/,
   description: required string min:5 max:300
Claude Sonnet 4.6
MEDICAL RECORDS MODULE complete this & remaining 4 modules also


Thought Process
expand
✅ Insurance Validator (Complete) + Departments + Appointments Modules
🛡️ 6. INSURANCE MODULE — Completing Validator
src/modules/insurance/insurance.validator.js — COMPLETE
text
You are a healthcare insurance data validation specialist. Build 
complete Joi validation schemas for all insurance module endpoints 
in a Hospital Management System.

Create and export these schemas:

addInsuranceProviderSchema:
- providerName: required string min:3 max:200
- providerType: required enum
  [insurance_company, tpa, government_scheme,
   corporate_self_insurance]
- gstinNumber: required string
  custom validator regex:
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  Custom error: "Invalid GSTIN format. Example: 27AAPFU0939F1ZV"
- panNumber: required string
  regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  Custom error: "Invalid PAN format. Example: ABCDE1234F"
- contactPerson: required string min:2 max:100
- email: required valid email lowercase
- phone: required valid phone E.164 format
- address: required object:
  {street: string required min:5 max:200,
   city: string required,
   state: string required,
   pincode: string required pattern /^[1-9][0-9]{5}$/,
   country: string default 'India'}
- claimPortalUrl: optional valid URL
- claimEmail: required valid email
- empanelmentNumber: required string min:3 max:50
- empanelmentValidTill: required date must be future
  Custom error: "Empanelment validity date must be in the future"
- roomRentCap: optional integer min:0 (paise/day, 0 = no cap)
- icuRentCap: optional integer min:0 (paise/day)
- copayPercentage: optional number min:0 max:100 default:0
- deductibleAmount: optional integer min:0 (paise) default:0
- preAuthRequired: required boolean
- claimSLA: required integer min:1 max:90 (days to settle)
  Custom error: "Claim SLA must be between 1 and 90 days"
- coveredProcedures: optional array of strings max:500
- coveredDiagnoses: optional array of strings max:500
- notes: optional string max:500

updateInsuranceProviderSchema:
- All fields from addInsuranceProviderSchema optional
- Validate: at least one field must be provided
- empanelmentValidTill: if provided must be future
- gstinNumber: if provided full regex validation applies
- Custom error: "At least one field must be provided for update"

addPatientInsuranceSchema:
- patientId: from params uuid
- providerId: required uuid
- tpaId: optional uuid (if TPA differs from insurer)
- policyNumber: required string min:3 max:50
  (unique per provider — service validates)
- membershipId: optional string min:2 max:50
- policyType: required enum
  [individual, family_floater, group,
   government_scheme, corporate]
- holderName: required string min:2 max:100
- holderRelation: required enum
  [self, spouse, father, mother, son, daughter,
   father_in_law, mother_in_law, sibling, other]
- sumInsured: required integer min:100 (paise)
  Custom error: "Sum insured must be greater than zero"
- copayPercentage: optional number min:0 max:100 default:0
- deductibleAmount: optional integer min:0 (paise) default:0
- validFrom: required date
- validTill: required date
  Validate: validTill must be strictly after validFrom
  Custom error: "Policy end date must be after start date"
- preAuthorizationRequired: boolean default false
- exclusions: optional array of strings max:50
- notes: optional string max:500

createPreAuthorizationSchema:
- patientId: required uuid
- patientInsuranceId: required uuid
- admissionType: required enum
  [elective, emergency, maternity, daycare,
   investigation, rehabilitation, transplant]
- plannedAdmissionDate: required date
  cannot be more than 1 day in past
  Custom error: "Planned admission date cannot be in the past"
- estimatedDurationDays: required integer min:1 max:365
- primaryDiagnosis: required object:
  {icd10Code: optional string
   pattern /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/
   with error "Invalid ICD-10 format",
   description: required string min:5 max:300}
- secondaryDiagnoses: optional array max:5, each:
  {icd10Code: optional string, description: string required}
- plannedProcedures: required array min:1 max:10, each:
  {procedureName: string required min:3 max:200,
   procedureCode: optional string max:20,
   estimatedCost: required integer min:0 (paise)}
- wardType: required enum
  [general, semi_private, private, icu, nicu, picu]
- estimatedRoomCharges: required integer min:0 (paise)
- estimatedMedicineCharges: required integer min:0 (paise)
- estimatedLabCharges: optional integer min:0 (paise) default:0
- estimatedOtCharges: optional integer min:0 (paise) default:0
- totalEstimatedCost: required integer min:1 (paise)
  Validate: totalEstimatedCost >= sum of all estimated charge fields
  Custom error: "Total estimated cost cannot be less than
  sum of individual charge estimates"
- doctorId: required uuid
- clinicalJustification: required string min:20 max:2000
  Custom error: "Clinical justification min 20 characters required"
- documents: optional array of valid S3 URLs max:10

updatePreAuthStatusSchema:
- preAuthId: from params uuid
- status: required enum
  [under_review, approved, partially_approved,
   rejected, expired, cancelled]
- approvedAmount: integer min:0 (paise)
  required when status is approved or partially_approved
  Custom error: "Approved amount required for approved status"
- approvedProcedures: array of strings
  required when status is partially_approved
- authorizationCode: string min:3 max:100
  required when status is approved or partially_approved
  Custom error: "Authorization code required from insurer"
- validTill: date must be future
  required when status is approved or partially_approved
- rejectionReason: string min:10 max:1000
  required when status is rejected
  Custom error: "Rejection reason required when rejecting pre-auth"
- partialApprovalNotes: optional string max:1000
- remarks: optional string max:500
- updatedBy: auto from req.user.id

createInsuranceClaimSchema:
- billId: required uuid
- patientInsuranceId: required uuid
- preAuthId: optional uuid
  (required in service if provider has preAuthRequired: true)
- claimType: required enum [cashless, reimbursement]
- admissionDate: required date cannot be future
- dischargeDate: required date
  Validate: dischargeDate >= admissionDate
  Custom error: "Discharge date must be on or after admission date"
- primaryDiagnosis: required object:
  {icd10Code: optional string, description: required string min:5}
- secondaryDiagnoses: optional array max:5
- totalBillAmount: required integer min:1 (paise)
- claimedAmount: required integer min:1 (paise)
  Validate: claimedAmount <= totalBillAmount
  Custom error: "Claimed amount cannot exceed total bill amount"
- documents: required array min:3 max:20 of valid S3 URLs
  (minimum: discharge summary + itemized bill + lab reports)
  Custom error: "Minimum 3 supporting documents required"
- remarks: optional string max:500
- claimedBy: auto from req.user.id

processClaimSettlementSchema:
- claimId: from params uuid
- settledAmount: required integer min:0 (paise)
  (0 means full rejection at settlement stage)
- settlementDate: required date cannot be future
- settlementMode: required enum
  [neft, rtgs, cheque, direct_credit, upi]
- referenceNumber: required string min:3 max:100
  (UTR number, cheque number, transaction reference)
- shortfallAmount: optional integer min:0 (paise)
  (difference between claimed and settled)
- shortfallReason: string min:10 max:500
  required if shortfallAmount > 0
  Custom error: "Shortfall reason required when settled
  amount differs from claimed amount"
- bankDetails: optional object
  {bankName: string, branchName: string, chequeDate: date}
  required if settlementMode is cheque
- remarks: optional string max:500
- processedBy: auto from req.user.id

eligibilityCheckSchema (query params):
- patientId: required uuid
- providerId: required uuid
- serviceDate: required valid date
- serviceType: optional enum
  [opd, ipd, emergency, pharmacy, lab,
   daycare, maternity, surgery]

claimsListQuerySchema (query params):
- patientId: optional uuid
- providerId: optional uuid
- claimType: optional enum [cashless, reimbursement]
- status: optional enum
  [submitted, under_review, approved, partially_approved,
   rejected, settled, disputed, closed]
- startDate: optional valid date
- endDate: optional valid date must be after startDate
- minAmount: optional integer min:0
- maxAmount: optional integer min:0
  Validate: if both provided maxAmount >= minAmount
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:100 default:20
- sortBy: optional enum [claimedAmount, submittedAt, status]
- sortOrder: optional enum [ASC, DESC] default:DESC

disputeClaimSchema:
- claimId: from params uuid
- disputeReason: required string min:20 max:2000
- disputeType: required enum
  [amount_dispute, coverage_dispute, rejection_dispute,
   processing_delay, documentation_issue, other]
- supportingDocuments: optional array of S3 URLs max:10
- requestedAmount: optional integer min:0 (paise)
  (amount being disputed/requested)
- disputedBy: auto from req.user.id

Requirements:
- GSTIN custom checksum validation using digit sum algorithm
- All monetary amounts stored as integers in paise
  add note in JSDoc: "All amounts in paise (1 rupee = 100 paise)"
- createPreAuthorizationSchema: 
  use Joi.custom() for totalEstimatedCost validation
  comparing against sum of all partial cost fields
- createInsuranceClaimSchema:
  claimedAmount <= totalBillAmount enforced strictly
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages using insurance industry terminology
- Export all schemas as named exports
- Add JSDoc with @description and @requiredRole above each schema
🏢 7. DEPARTMENTS MODULE
src/modules/departments/department.service.js
text
You are a hospital organizational management engineer. Build a 
complete department management service for a Hospital Management 
System handling hospital structure, HOD management, and 
departmental operations.

Implement these service functions with full business logic:

createDepartment(departmentData, createdBy):
- Create department with:
  name, code (auto-generated: DEPT-XXX),
  type (clinical/administrative/support/diagnostic/surgical),
  specialization (cardiology/neurology/orthopedics etc),
  description, floor, building, location,
  hodId (Head of Department), contactEmail, contactPhone,
  operatingHours {weekdays, weekends, is24Hours},
  services array (list of services offered),
  equipmentList array, bedCapacity (for clinical depts),
  monthlyBudget, costCenter code
- Validate hodId has DOCTOR or ADMIN role
- Validate department code uniqueness
- Auto-generate cost center if not provided: CC-DEPT-XXXX
- Assign HOD: create HOD assignment record with startDate
- Send welcome email to HOD with department details
- Create audit log entry
- Cache department: hms:departments:{deptId} TTL 1hr

updateDepartment(departmentId, updateData, updatedBy):
- Allow partial updates with field whitelist
- If hodId changes: 
  end current HOD assignment record (set endDate)
  create new HOD assignment record
  notify old HOD (role change notification)
  notify new HOD (assignment notification)
- If operatingHours change: 
  check and alert all scheduled appointments in affected hours
- Track changed fields for detailed audit trail
- Invalidate Redis cache on update
- Return updated department with HOD details

getDepartmentById(departmentId):
- Return full department profile with:
  HOD details (name, phone, email),
  current staff count by role (doctors, nurses, technicians),
  current patient count (OPD + IPD),
  bed occupancy rate (if clinical),
  services offered list,
  today's appointment count,
  active equipment count
- Cache: hms:departments:{deptId} TTL 30 min

getAllDepartments(filters, pagination):
- filters: {type, isActive, specialization, floor, building}
- Return list with per-department stats:
  staffCount, patientCount, occupancyRate, hodName
- Search by: name, code, specialization
- Sort by: name, patientCount, staffCount
- Cache list with filter-based key TTL 5 min

getDepartmentStaff(departmentId, filters, pagination):
- Return all staff assigned to department
- Filter by: role (DOCTOR/NURSE/etc), shift, isActive
- Include: doctorsOnDuty today, nursesOnDuty today
- Sort by: role, then name

getDepartmentDoctors(departmentId, filters):
- Return all doctors in department
- Include: availability today, appointment slots
- Filter by: specialization, isAvailable, acceptingNewPatients
- Used for appointment booking flow

getDepartmentStats(departmentId, dateRange):
- Patient volume: OPD + IPD counts per day
- Revenue generated
- Average length of stay (for inpatient depts)
- Bed occupancy rate (for inpatient depts)
- Doctor utilization (appointments booked vs available slots)
- Top 5 diagnoses treated
- Staff attendance rate
- Department expense vs budget tracking
- Compare to previous period

changeDepartmentHOD(departmentId, newHodId, reason, changedBy):
- Validate newHodId has DOCTOR or SENIOR role
- End current HOD tenure with endDate and reason
- Create new HOD assignment record
- Update department.hodId
- Grant HOD-level permissions to new HOD
- Revoke HOD-level permissions from previous HOD
- Send notifications to both HODs and department admin
- Create detailed audit trail

assignStaffToDepartment(staffId, departmentId, assignedBy):
- Validate staff exists and has appropriate role
- Check if staff already assigned to another department
- Create department assignment record
- Update staff profile with new departmentId
- Notify department HOD
- Audit log with previous department if transfer

transferStaff(staffId, fromDeptId, toDeptId, reason, transferredBy):
- Atomic: end assignment in fromDept + create in toDept
- Notify both department HODs
- Update billing for any in-progress charges
- Audit log with full transfer details

getDepartmentSchedule(departmentId, date):
- Doctors on duty with their time slots
- Nurses on shift
- OT schedule (if surgical dept)
- Lab schedule (if diagnostic dept)
- Total appointment slots: available, booked

getDepartmentBudget(departmentId, month, year):
- Allocated budget
- Spent so far: staff salaries, equipment, supplies, misc
- Remaining budget
- Budget utilization percentage
- Expense breakdown by category
- Compare to same month last year

getHospitalOrgChart():
- Hierarchical structure: all departments with HOD names
- Staff count per department
- Format: tree structure for frontend org chart rendering
- Cache 1 hour (rarely changes)

getDepartmentPerformanceReport(departmentId, dateRange):
- All KPIs for the department
- Comparison to hospital average
- Trend charts: patient volume, revenue, occupancy
- Staff performance summary
- Ready for export as PDF

Requirements:
- HOD change: always maintain historical HOD records
  (who was HOD from when to when — never overwrite)
- Department cannot be deleted if it has active staff/patients
  (soft delete only after all assignments resolved)
- operatingHours stored as structured JSON with timezone
- Budget tracking integrates with billing module totals
- getDepartmentSchedule: builds from doctor schedules + 
  nurse shift assignments
- All cache keys namespace: hms:departments:*
- Emit Socket.io event to department room on HOD change
src/modules/departments/department.controller.js
text
You are a backend API engineer. Build a department management 
controller for a Hospital Management System following the 
thin controller pattern with organizational hierarchy support.

Implement these controller methods:

Department CRUD:
1.  createDepartment(req, res, next)
2.  getDepartmentById(req, res, next)
3.  updateDepartment(req, res, next)
4.  deactivateDepartment(req, res, next)
     — validate no active staff/patients before deactivating
5.  reactivateDepartment(req, res, next)
6.  listDepartments(req, res, next)
     — paginated, filtered, with per-dept stats
7.  searchDepartments(req, res, next)
8.  getHospitalOrgChart(req, res, next)
     — cache-first, tree structure for frontend

HOD Management:
9.  changeDepartmentHOD(req, res, next)
10. getHODHistory(req, res, next)
11. getCurrentHOD(req, res, next)

Staff Management:
12. getDepartmentStaff(req, res, next)
13. getDepartmentDoctors(req, res, next)
14. assignStaffToDepartment(req, res, next)
15. removeStaffFromDepartment(req, res, next)
16. transferStaff(req, res, next)
17. getDepartmentStaffCount(req, res, next)

Schedule:
18. getDepartmentSchedule(req, res, next)
     — daily schedule: doctors + nurses on duty
19. updateDepartmentOperatingHours(req, res, next)
20. getDepartmentOperatingHours(req, res, next)

Statistics & Reports:
21. getDepartmentStats(req, res, next)
22. getDepartmentBudget(req, res, next)
23. updateDepartmentBudget(req, res, next) — admin/accountant
24. getDepartmentPerformanceReport(req, res, next)
25. getDepartmentPatients(req, res, next)
     — current OPD + IPD patients in department
26. getDepartmentRevenue(req, res, next)
27. exportDepartmentReport(req, res, next)
28. getHospitalDepartmentSummary(req, res, next)
     — all departments quick stats for admin dashboard

Services:
29. addDepartmentService(req, res, next)
30. removeDepartmentService(req, res, next)
31. getDepartmentServices(req, res, next)

Requirements:
- getDepartmentById: include computed fields
  (patientCount, staffCount, occupancyRate) in response
  from service layer — not raw DB data
- changeDepartmentHOD: extract changedBy from req.user.id,
  require reason in request body
- getDepartmentStats: validate dateRange using
  dateTime.util.js before passing to service
- deactivateDepartment: call service to check
  active patients/staff first, return 409 Conflict
  with details if cannot deactivate
- getHospitalOrgChart: set Cache-Control headers,
  add X-Cache-Status in response headers
- exportDepartmentReport: queue via Bull if dateRange > 60 days,
  return 202 with jobId, else direct PDF response
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
- Add @description, @access JSDoc on every method
src/modules/departments/department.routes.js
text
You are an API design engineer. Build department management routes 
for a Hospital Management System with organizational hierarchy 
access control.

Mount under /api/v1/departments

Department CRUD:
POST   /                              → SUPER_ADMIN, ADMIN
GET    /                              → all authenticated
GET    /search                        → all authenticated
GET    /org-chart                     → all authenticated
GET    /hospital-summary              → ADMIN, SUPER_ADMIN
GET    /:deptId                       → all authenticated
PUT    /:deptId                       → SUPER_ADMIN, ADMIN
POST   /:deptId/deactivate            → SUPER_ADMIN, ADMIN
POST   /:deptId/reactivate            → SUPER_ADMIN, ADMIN

HOD Management:
GET    /:deptId/hod                   → all authenticated
PUT    /:deptId/hod                   → SUPER_ADMIN, ADMIN
GET    /:deptId/hod/history           → SUPER_ADMIN, ADMIN

Staff Management:
GET    /:deptId/staff                 → ADMIN, HR, HOD (own dept)
GET    /:deptId/staff/count           → all authenticated
GET    /:deptId/doctors               → all authenticated
POST   /:deptId/staff/assign          → ADMIN, HR
POST   /:deptId/staff/remove          → ADMIN, HR
POST   /:deptId/staff/transfer        → ADMIN, HR
GET    /:deptId/patients              → DOCTOR, NURSE, ADMIN,
                                        HOD (own dept)

Schedule:
GET    /:deptId/schedule              → all authenticated
PUT    /:deptId/operating-hours       → ADMIN, HOD (own dept)
GET    /:deptId/operating-hours       → all authenticated

Services:
GET    /:deptId/services              → all authenticated
POST   /:deptId/services              → ADMIN, HOD (own dept)
DELETE /:deptId/services/:serviceId   → ADMIN, HOD (own dept)

Statistics & Reports:
GET    /:deptId/stats                 → ADMIN, HOD (own dept), DOCTOR
GET    /:deptId/revenue               → ADMIN, ACCOUNTANT,
                                        HOD (own dept)
GET    /:deptId/budget                → ADMIN, ACCOUNTANT,
                                        HOD (own dept)
PUT    /:deptId/budget                → ADMIN, ACCOUNTANT
GET    /:deptId/performance           → ADMIN, SUPER_ADMIN,
                                        HOD (own dept)
GET    /:deptId/report/export         → ADMIN, HOD (own dept)

Middleware chain: authenticate → authorize → validate → controller

Special middleware notes:
- HOD role middleware: create isHODOfDepartment(deptId) middleware
  that checks if req.user.id is current HOD of requested dept
  — used to allow HODs access to own department data
- Inject deptHODGuard middleware on routes marked (own dept)
  allowing HOD to access their department's restricted routes
- Apply auditMiddleware on HOD change and staff transfer routes
- getDepartmentSchedule: no-cache headers (real-time data)
- Apply cacheHeaders middleware on org-chart route
  (Cache-Control: public, max-age=3600)
- deactivate route: apply activeResourceCheck middleware
  that validates no active patients/staff before controller runs
- Export router with clear section comments
src/modules/departments/department.validator.js
text
You are an organizational data validation specialist. Build 
comprehensive Joi validation schemas for all department management 
endpoints in a Hospital Management System.

Create and export these schemas:

createDepartmentSchema:
- name: required string min:3 max:100
  Custom error: "Department name must be between 3 and 100 characters"
- code: optional string max:10 uppercase alphanumeric
  (auto-generated if not provided)
  pattern: /^[A-Z0-9]{2,10}$/
  Custom error: "Department code must be uppercase alphanumeric, 2-10 chars"
- type: required enum
  [clinical, administrative, support,
   diagnostic, surgical, emergency, pharmacy,
   laboratory, radiology, rehabilitation]
- specialization: optional string min:3 max:100
  (e.g., "Cardiology", "Orthopedics", "General Medicine")
  required when type is clinical or surgical
- description: optional string min:10 max:1000
- floor: required integer min:0 max:50
- building: optional string max:50 default: 'Main Building'
- location: optional string max:200
  (room/wing description: "East Wing, 2nd Floor")
- hodId: optional uuid
  (head of department, validated as DOCTOR/ADMIN in service)
- contactEmail: optional valid email
- contactPhone: optional valid phone
- operatingHours: optional object:
  {is24Hours: boolean default false,
   weekdays: object when is24Hours false:
     {open: string HH:MM required,
      close: string HH:MM required,
      breakStart: optional string HH:MM,
      breakEnd: optional string HH:MM},
   weekends: object when is24Hours false:
     {open: optional string HH:MM,
      close: optional string HH:MM,
      isClosed: boolean default false},
   Validate: close time must be after open time}
- services: optional array of strings max:50
  (services this department offers)
- bedCapacity: optional integer min:0 max:500
  required when type is clinical or surgical
  Custom error: "Bed capacity required for clinical departments"
- monthlyBudget: optional integer min:0 (paise)
- costCenter: optional string max:20
- isActive: boolean default true

updateDepartmentSchema:
- All fields from createDepartmentSchema optional
- Validate: at least one field must be provided
- operatingHours: if provided, validate close > open
- hodId: if provided, validate uuid format
  (service validates role of new HOD)

changeDepartmentHODSchema:
- deptId: from params uuid
- newHodId: required uuid
- reason: required string min:10 max:500
  Custom error: "Reason for HOD change required (min 10 characters)"
- effectiveDate: optional date
  cannot be past more than 1 day
  default: today
- notifyStaff: boolean default true
- changedBy: auto from req.user.id

assignStaffSchema:
- deptId: from params uuid
- staffId: required uuid
- role: required enum
  [DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN,
   RECEPTIONIST, ACCOUNTANT, STAFF]
- effectiveDate: required date
  cannot be past more than 7 days
- isPrimaryDepartment: boolean default true
  (staff can be associated with multiple depts)
- notes: optional string max:300

transferStaffSchema:
- staffId: required uuid
- fromDeptId: required uuid
- toDeptId: required uuid
  Validate: fromDeptId !== toDeptId
  Custom error: "Source and destination departments must be different"
- reason: required string min:10 max:500
- effectiveDate: required date
  cannot be past more than 1 day
- transferType: required enum
  [permanent, temporary, deputation]
- expectedReturnDate: optional date must be future
  required when transferType is temporary or deputation
- transferredBy: auto from req.user.id

updateOperatingHoursSchema:
- deptId: from params uuid
- is24Hours: required boolean
- weekdays: object required when is24Hours is false:
  {open: required string HH:MM format,
   close: required string HH:MM format,
   Validate: close > open
   Custom error: "Closing time must be after opening time",
   breakStart: optional string HH:MM,
   breakEnd: optional string HH:MM,
   Validate if break provided: breakEnd > breakStart,
   Validate: break must be within open-close range}
- weekends: optional object:
  {isClosed: boolean default false,
   open: string HH:MM required if isClosed false,
   close: string HH:MM required if isClosed false}
- effectiveFrom: optional date default today
  cannot be past more than 1 day
- reason: required string min:5 max:300
  (reason for hours change — for audit trail)

addDepartmentServiceSchema:
- deptId: from params uuid
- serviceName: required string min:3 max:200
- serviceCode: optional string max:20 uppercase alphanumeric
- description: optional string max:500
- serviceType: required enum
  [consultation, procedure, surgery, diagnostic,
   therapy, emergency, screening, vaccination]
- cost: optional integer min:0 (paise, 0 = free service)
- duration: optional integer min:5 max:480 (minutes)
- requiresAppointment: boolean default true
- isActive: boolean default true

updateBudgetSchema:
- deptId: from params uuid
- month: required integer min:1 max:12
- year: required integer min:2020 max:currentYear+1
- allocatedAmount: required integer min:0 (paise)
- breakdown: optional object:
  {salaries: integer min:0,
   equipment: integer min:0,
   supplies: integer min:0,
   maintenance: integer min:0,
   training: integer min:0,
   miscellaneous: integer min:0}
- notes: optional string max:500
- approvedBy: auto from req.user.id
- Validate: if breakdown provided,
  sum of breakdown values <= allocatedAmount
  Custom error: "Sum of budget breakdown cannot exceed
  total allocated amount"

departmentStatsQuerySchema (query params):
- deptId: from params uuid
- startDate: required valid date
- endDate: required valid date must be after startDate
  max range 366 days
- metrics: optional array of enum
  [patient_volume, revenue, occupancy,
   staff_utilization, diagnosis_frequency,
   appointment_stats, budget_utilization]
  default: all metrics
- compareWithPrevious: optional boolean default false
- groupBy: optional enum [day, week, month]

departmentListQuerySchema (query params):
- type: optional enum (department types)
- isActive: optional boolean
- specialization: optional string
- floor: optional integer
- building: optional string
- hasAvailableSlots: optional boolean
  (departments with available appointment slots today)
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:100 default:20
- sortBy: optional enum [name, patientCount, staffCount, type]
- sortOrder: optional enum [ASC, DESC] default:ASC

Requirements:
- operatingHours: use Joi.when() for conditional validation
  based on is24Hours boolean flag
- effectiveDate in transfer: validate fromDept and toDept
  differ at schema level using Joi.invalid(Joi.ref('fromDeptId'))
- All time strings (HH:MM): custom Joi extension
  validateTimeFormat(value) checking regex /^([01]\d|2[0-3]):([0-5]\d)$/
  with error: "Time must be in HH:MM 24-hour format"
- Budget breakdown validation: Joi.custom() that sums
  all breakdown values and compares to allocatedAmount
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages using healthcare administration language
- Export all schemas as named exports with JSDoc
📅 8. APPOINTMENTS MODULE
src/modules/appointments/appointment.service.js
text
You are a healthcare scheduling systems engineer. Build a complete 
appointment management service for a Hospital Management System 
with intelligent slot management, queue handling, and automated 
notifications.

Implement these service functions with full business logic:

createAppointment(appointmentData, createdBy):
- Create appointment with:
  patientId, doctorId, departmentId, appointmentDate,
  appointmentTime (HH:MM slot), appointmentType
  (new_consultation/follow_up/procedure/telemedicine),
  visitType (OPD/IPD/emergency), chiefComplaint,
  referredBy (optional doctorId), priority (normal/urgent)
- Validate doctor exists, is active, and belongs to department
- Check doctor availability: call getDoctorAvailability()
  and validate requested slot is free
- Lock slot in Redis immediately (distributed lock: 30 seconds)
  to prevent double-booking during transaction
- Check patient has no conflicting appointment same day
- Auto-generate appointment number: APT-YYYYMMDD-XXXX (sequential)
- Assign token number for OPD queue (sequential per doctor per day)
- Calculate estimated consultation time based on doctor's avg duration
- Check patient insurance eligibility if insurance on file
- Send confirmation: email + SMS to patient
- Send notification to doctor (via Socket.io if online + push)
- Release Redis lock after DB commit
- Create audit log entry

getAppointmentById(appointmentId, requestingUser):
- Return full appointment with:
  patient profile, doctor profile, department info,
  status history, consultation notes (if completed),
  prescription link, lab order links
- Role-based filtering:
  PATIENT: own appointments only, no internal doctor notes
  DOCTOR: own appointments with full clinical context
  RECEPTIONIST: all appointments, no clinical notes
  ADMIN: full access to all appointments
- Cache: hms:appointments:{appointmentId} TTL 5 min

getAvailableSlots(doctorId, date):
- Fetch doctor's schedule for that weekday
- Query all booked appointments for that doctor on that date
- Query all blocked slots (doctor's own blocks + leave)
- Calculate available slots (15/20/30 min intervals per doctor config)
- Mark each slot: available/booked/blocked/break/past
- Return structured: {slots: [{time, status, tokenNumber?}]}
- Cache per doctor per date: TTL 2 min (frequently polled)
- Use Redis to reflect real-time bookings without DB hit

updateAppointmentStatus(appointmentId, status, updatedBy, notes):
- Valid status transitions (state machine):
  SCHEDULED → CONFIRMED → CHECKED_IN → IN_CONSULTATION
    → COMPLETED / NO_SHOW
  SCHEDULED → CANCELLED (by patient or doctor or admin)
  CONFIRMED → RESCHEDULED
- Validate transition is allowed
- CHECKED_IN: record actual check-in time,
  update queue position, broadcast to doctor's dashboard
- IN_CONSULTATION: record consultation start time,
  start consultation timer
- COMPLETED: record end time, calculate duration,
  trigger: create consultation record placeholder,
  notify billing to generate OPD bill
- NO_SHOW: send patient notification, free the slot
- CANCELLED: free slot, cancel slot lock in Redis,
  send cancellation notification to patient + doctor
- Emit Socket.io event to doctor's room on status change

rescheduleAppointment(appointmentId, newDate, newTime, reason, rescheduledBy):
- Validate: can reschedule only if status is SCHEDULED or CONFIRMED
- Validate: cancellation policy (no reschedule within 2 hours of appointment)
- Release old slot (Redis + DB)
- Check and book new slot (with Redis lock)
- Preserve original appointment record, create reschedule history
- Update token number for new date
- Send reschedule notifications to patient + doctor
- Audit log with reason

cancelAppointment(appointmentId, reason, cancelledBy, cancelledByRole):
- Validate status allows cancellation
- Release appointment slot
- Record: cancelledBy, cancelledAt, reason, cancelledByRole
- If cancelled by doctor: suggest alternative doctor to patient
- If cancelled < 24 hours before: flag for management review
- Notify patient via SMS + email with rebooking link
- Notify doctor via in-app notification
- Update queue positions for remaining patients

getAppointmentQueue(doctorId, date):
- Real-time OPD queue for doctor's dashboard:
  {tokenNumber, patientName, waitingSince, status,
   estimatedCallTime, chiefComplaint, isUrgent}
- Sorted by: urgent first, then token number
- Exclude: completed, cancelled, no-show
- Calculate: estimated wait time per patient
  (avg consultation duration × patients ahead)
- Real-time via Socket.io (updated on every status change)
- Cache: TTL 30 seconds (very short — real-time data)

checkInPatient(appointmentId, checkedInBy):
- Mark appointment as CHECKED_IN
- Record actual arrival time
- Update queue with real-time position
- Broadcast updated queue to doctor via Socket.io
- Generate OPD consultation slip (PDF)
- If patient is late (> 15 min after appointment):
  flag as late arrival, notify doctor

getAppointmentsByDoctor(doctorId, filters, pagination):
- All appointments for doctor
- Filter by: date, status, appointmentType, patientId
- Today's appointments prioritized in response
- Include: completed count, pending count, no-show count

getAppointmentsByPatient(patientId, filters, pagination):
- All appointments for patient
- Filter by: doctorId, departmentId, status, dateRange
- Include: upcoming, past appointments
- Sort: upcoming first, then most recent past

getAppointmentsByDepartment(departmentId, date, filters):
- All appointments across all doctors in department for date
- Summary: total booked, completed, pending, cancelled
- Grouped by doctor with each doctor's slot utilization

getDoctorAvailabilityCalendar(doctorId, startDate, endDate):
- Month/week view of doctor's availability
- Mark: fully_booked, partially_available, leave, holiday
- Count available slots per day for calendar heatmap
- Cache per doctor per month: TTL 5 min

getDailyAppointmentReport(date, filters):
- Appointment statistics for the day
- By department: total, completed, no-show, cancelled rates
- Peak hours analysis
- Average wait time
- Doctor-wise performance

sendAppointmentReminders():
- Called by scheduler every hour
- Query appointments due in next 24 hours
- Send: 24-hour reminder email + SMS
- Query appointments due in next 1 hour
- Send: 1-hour reminder push notification + SMS
- Skip already-reminded appointments (Redis flag)
- Log reminder delivery

Requirements:
- Slot locking: Redis lock prevents double-booking in concurrent requests
- Token numbers: sequential per doctor per date, stored in Redis counter
- State machine: invalid status transitions throw ValidationError
- Appointment slot release: happens atomically with DB transaction
- NO_SHOW automation: scheduler marks as NO_SHOW 30 min after
  appointment time if still CONFIRMED/CHECKED_IN
- Socket.io events: queue updates broadcast on every status change
- All notifications async (Bull queue) except urgent alerts
- Cache invalidation: on every appointment status change
src/modules/appointments/appointment.controller.js
text
You are a backend API engineer. Build a comprehensive appointment 
management controller for a Hospital Management System handling 
complete scheduling workflows with real-time queue management.

Implement these controller methods:

Appointment CRUD:
1.  createAppointment(req, res, next)
2.  getAppointmentById(req, res, next)
3.  updateAppointment(req, res, next)
     — limited fields update (chiefComplaint, notes)
4.  cancelAppointment(req, res, next)
5.  rescheduleAppointment(req, res, next)
6.  listAppointments(req, res, next)
     — paginated, role-filtered (own for patient/doctor)
7.  searchAppointments(req, res, next)
8.  bulkCancelAppointments(req, res, next)
     — admin: cancel all for doctor on date (leave scenario)

Slot Management:
9.  getAvailableSlots(req, res, next)
10. getDoctorAvailabilityCalendar(req, res, next)
11. getAvailableDoctors(req, res, next)
     — doctors available for a given date + department
12. checkSlotAvailability(req, res, next)
     — real-time check before booking

Status Management:
13. confirmAppointment(req, res, next)
     — receptionist/admin confirms appointment
14. checkInPatient(req, res, next)
     — patient arrived at hospital
15. startConsultation(req, res, next)
     — doctor starts seeing patient
16. completeAppointment(req, res, next)
     — doctor marks consultation done
17. markNoShow(req, res, next)
     — manual no-show marking
18. markUrgent(req, res, next)
     — flag appointment as urgent (priority queue)

Queue Management:
19. getAppointmentQueue(req, res, next)
     — real-time OPD queue for doctor dashboard
20. reorderQueue(req, res, next)
     — admin can reorder queue (urgent cases)
21. getQueuePosition(req, res, next)
     — patient checks own queue position
22. getEstimatedWaitTime(req, res, next)
     — estimated time before patient is called

By Entity:
23. getAppointmentsByDoctor(req, res, next)
24. getAppointmentsByPatient(req, res, next)
25. getMyAppointments(req, res, next)
     — authenticated user's own appointments
26. getAppointmentsByDepartment(req, res, next)
27. getTodayAppointments(req, res, next)
     — today's appointments for current user context

Documents:
28. getConsultationSlipPDF(req, res, next)
     — OPD slip for checked-in patient
29. getAppointmentConfirmationPDF(req, res, next)

Reports & Analytics:
30. getDailyReport(req, res, next)
31. getAppointmentStats(req, res, next)
32. getNoShowReport(req, res, next)
33. getDoctorUtilizationReport(req, res, next)
34. getAppointmentTrend(req, res, next)
     — chart data for appointment volume over time
35. exportAppointmentReport(req, res, next)

Reminders:
36. sendManualReminder(req, res, next)
     — admin manually triggers reminder for specific appointment
37. getReminderLog(req, res, next)
     — view reminder history for appointment

Requirements:
- createAppointment: check slot availability in controller
  via getAvailableSlots before passing to service
  (fail fast — avoid service call if slot clearly unavailable)
- getAppointmentQueue: set Cache-Control: no-store header
  and serve primarily from Redis cache
- getMyAppointments: always use req.user.id, never accept
  userId from body (security: IDOR prevention)
- startConsultation: validate req.user.id is the assigned
  doctor for this appointment before service call
- bulkCancelAppointments: validate max 50 appointments
  per bulk operation in controller
- getConsultationSlipPDF: validate patient CHECKED_IN status
  before generating slip
- completedAppointment: trigger async billing notification
  (fire-and-forget via notificationQueue)
- All wrapped in try/catch → next(error)
- Use sendSuccess consistently
- Real-time queue methods: emit X-Real-Time: true header
src/modules/appointments/appointment.routes.js
text
You are a healthcare scheduling API engineer. Build comprehensive 
appointment management routes for a Hospital Management System 
with multi-role scheduling access control.

Mount under /api/v1/appointments

Core Appointment routes:
POST   /                              → PATIENT, RECEPTIONIST, ADMIN, DOCTOR
GET    /                              → ADMIN, RECEPTIONIST (all appointments)
GET    /search                        → ADMIN, RECEPTIONIST, DOCTOR
GET    /my                            → all authenticated (own appointments)
GET    /today                         → DOCTOR, NURSE, RECEPTIONIST, ADMIN
GET    /:appointmentId                → DOCTOR, NURSE, RECEPTIONIST,
                                        ADMIN, PATIENT (own)
PUT    /:appointmentId                → RECEPTIONIST, ADMIN, DOCTOR (own)
POST   /:appointmentId/cancel         → PATIENT (own), DOCTOR (own),
                                        RECEPTIONIST, ADMIN
POST   /:appointmentId/reschedule     → PATIENT (own), RECEPTIONIST, ADMIN
POST   /bulk/cancel                   → ADMIN only

Slot & Availability:
GET    /slots/doctor/:doctorId        → all authenticated
GET    /slots/check                   → all authenticated
GET    /calendar/doctor/:doctorId     → all authenticated
GET    /doctors/available             → all authenticated

Status Management:
POST   /:appointmentId/confirm        → RECEPTIONIST, ADMIN
POST   /:appointmentId/check-in       → RECEPTIONIST, NURSE, ADMIN
POST   /:appointmentId/start          → DOCTOR (own) only
POST   /:appointmentId/complete       → DOCTOR (own) only
POST   /:appointmentId/no-show        → RECEPTIONIST, DOCTOR, ADMIN
POST   /:appointmentId/mark-urgent    → DOCTOR, RECEPTIONIST, ADMIN

Queue Management:
GET    /queue/doctor/:doctorId        → DOCTOR (own), NURSE, 
                                        RECEPTIONIST, ADMIN
PUT    /queue/reorder                 → ADMIN, RECEPTIONIST
GET    /queue/position/:appointmentId → PATIENT (own), all staff
GET    /queue/wait-time/:appointmentId → PATIENT (own), all staff

By Entity:
GET    /doctor/:doctorId              → ADMIN, DOCTOR (own),
                                        RECEPTIONIST, NURSE
GET    /patient/:patientId            → DOCTOR, ADMIN, RECEPTIONIST,
                                        PATIENT (own)
GET    /department/:deptId            → DOCTOR, ADMIN, RECEPTIONIST

Documents:
GET    /:appointmentId/slip/pdf       → RECEPTIONIST, NURSE, 
                                        ADMIN, PATIENT (own)
GET    /:appointmentId/confirmation/pdf → PATIENT (own), RECEPTIONIST, ADMIN

Reports:
GET    /reports/daily                 → ADMIN, RECEPTIONIST
GET    /reports/stats                 → ADMIN, SUPER_ADMIN
GET    /reports/no-show               → ADMIN, DOCTOR (own data)
GET    /reports/doctor-utilization    → ADMIN, SUPER_ADMIN
GET    /reports/trend                 → ADMIN, SUPER_ADMIN
GET    /reports/export                → ADMIN, SUPER_ADMIN

Reminders:
POST   /:appointmentId/reminder/send  → ADMIN, RECEPTIONIST
GET    /:appointmentId/reminder/log   → ADMIN, RECEPTIONIST

Middleware chain: authenticate → authorize → validate → controller

Special middleware notes:
- Queue endpoints: set no-cache headers via noCacheMiddleware
- /start and /complete: apply doctorOwnershipGuard middleware
  (validates req.user.id matches appointment's doctorId)
- /cancel by PATIENT: apply appointmentOwnershipGuard
  (validates req.user's patientId matches appointment's patientId)
- /check-in: apply slotWindowValidator
  (appointment must be within 30 min window)
- /slots/doctor/:doctorId: apply slotCacheMiddleware
  (serve from Redis cache, bust every 2 minutes)
- Apply auditMiddleware on: cancel, reschedule, complete, no-show
- Apply Socket.io broadcast middleware after:
  check-in, start, complete, no-show
  (broadcasts queue update to doctor's room)
- Webhook for payment (if appointment requires advance payment):
  POST /payments/webhook → bypass auth, signature validation
- Export router with complete section comments
src/modules/appointments/appointment.validator.js
text
You are a healthcare scheduling data validation specialist. Build 
comprehensive Joi validation schemas for all appointment management 
endpoints in a Hospital Management System.

Create and export these schemas:

createAppointmentSchema:
- patientId: required uuid
- doctorId: required uuid
- departmentId: required uuid
- appointmentDate: required date
  cannot be past
  cannot be more than 90 days in future
  Custom error: "Appointment date must be today or within 90 days"
- appointmentTime: required string
  pattern /^([01]\d|2[0-3]):([0-5]\d)$/
  must be in 15-minute increments (00, 15, 30, 45)
  Custom validator: time % 15 === 0
  Custom error: "Appointment time must be in 15-minute slots
  (e.g., 09:00, 09:15, 09:30)"
- appointmentType: required enum
  [new_consultation, follow_up, procedure,
   telemedicine, second_opinion, emergency]
- visitType: required enum [opd, ipd, daycare, emergency]
- chiefComplaint: required string min:5 max:500
  Custom error: "Please describe chief complaint
  (minimum 5 characters)"
- priority: optional enum [normal, urgent] default: normal
- referredByDoctorId: optional uuid
  (referring doctor, validated in service)
- insuranceId: optional uuid
  (patient's insurance to use for this appointment)
- notes: optional string max:500
- isFirstVisit: optional boolean default:false
- preferredLanguage: optional enum
  [english, hindi, tamil, telugu, kannada, bengali, marathi]
- Validate: if appointmentType is follow_up,
  previousAppointmentId optional uuid should be provided
  (validation hint in meta, not hard error)

rescheduleAppointmentSchema:
- appointmentId: from params uuid
- newDate: required date
  cannot be past
  cannot be more than 90 days in future
- newTime: required string HH:MM
  must be in 15-minute increments
- reason: required string min:10 max:500
  Custom error: "Reschedule reason required (min 10 characters)"
- rescheduledBy: auto from req.user.id
- notifyPatient: boolean default:true
- notifyDoctor: boolean default:true

cancelAppointmentSchema:
- appointmentId: from params uuid
- reason: required string min:5 max:500
  Custom error: "Cancellation reason required"
- cancelledBy: auto from req.user.id
- cancelledByRole: auto from req.user.role
- suggestAlternative: optional boolean default:true
  (suggest alternative doctor/slot to patient)

bulkCancelSchema:
- appointmentIds: required array min:1 max:50 of uuids
  Custom error: "Bulk cancel accepts 1 to 50 appointments"
- reason: required string min:10 max:500
- cancelledBy: auto from req.user.id
- notifyPatients: boolean default:true
- alternativeDoctorId: optional uuid
  (suggest this doctor to all affected patients)

updateAppointmentStatusSchema:
- appointmentId: from params uuid
- status: required enum
  [confirmed, checked_in, in_consultation,
   completed, no_show, cancelled, rescheduled]
- notes: optional string max:500
- actualStartTime: optional datetime
  required when status is in_consultation
- actualEndTime: optional datetime
  required when status is completed
  Validate: actualEndTime must be after actualStartTime
- updatedBy: auto from req.user.id
- Validate status transitions at schema level using Joi.custom():
  Define allowed transitions map and validate
  SCHEDULED → [confirmed, cancelled, rescheduled]
  CONFIRMED → [checked_in, cancelled, rescheduled, no_show]
  CHECKED_IN → [in_consultation, no_show]
  IN_CONSULTATION → [completed]
  Custom error: "Invalid status transition from {current} to {requested}"

checkInSchema:
- appointmentId: from params uuid
- arrivalTime: optional datetime
  cannot be future, default: server time
- checkedInBy: auto from req.user.id
- verificationMethod: required enum
  [id_card, appointment_number, qr_code, verbal]
- patientIdVerified: required boolean must be true
  Custom error: "Patient identity must be verified before check-in"
- notes: optional string max:200

completeAppointmentSchema:
- appointmentId: from params uuid
- actualDurationMinutes: required integer min:1 max:480
- chiefComplaintResolved: required boolean
- followUpRequired: required boolean
- followUpDate: optional date must be future
  required if followUpRequired is true
- notes: optional string max:1000
- diagnosisCodes: optional array max:5 of objects:
  {icd10Code: optional string, description: string required}
- completedBy: auto from req.user.id

getAvailableSlotsQuerySchema (query params):
- doctorId: required uuid
- date: required valid date
  cannot be past
  cannot be more than 90 days in future
- appointmentType: optional enum (affects slot duration)
- includeBooked: optional boolean default:false
  (if true: return all slots with status labels)

getAvailableDoctorsQuerySchema (query params):
- departmentId: required uuid
- date: required valid date cannot be past
- time: optional HH:MM (find doctors with specific slot)
- appointmentType: optional enum
- specialization: optional string
- acceptingNewPatients: optional boolean
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:50 default:20

appointmentListQuerySchema (query params):
- doctorId: optional uuid
- patientId: optional uuid
- departmentId: optional uuid
- status: optional enum or array of status enums
- appointmentType: optional enum
- visitType: optional enum [opd, ipd, daycare, emergency]
- startDate: optional valid date
- endDate: optional valid date must be after startDate
  max range 90 days
  Custom error: "Date range cannot exceed 90 days"
- priority: optional enum [normal, urgent]
- page: optional integer min:1 default:1
- limit: optional integer min:5 max:100 default:20
- sortBy: optional enum
  [appointmentDate, createdAt, status, doctorName, patientName]
- sortOrder: optional enum [ASC, DESC] default:ASC

reorderQueueSchema:
- doctorId: required uuid
- date: required valid date cannot be past
- queue: required array min:1, each:
  {appointmentId: uuid required,
   newPosition: integer min:1 required}
- Validate: no duplicate positions in queue array
  Custom error: "Duplicate queue positions are not allowed"
- Validate: no duplicate appointmentIds
  Custom error: "Duplicate appointments in queue reorder request"
- reason: required string min:5 max:200

appointmentStatsQuerySchema (query params):
- startDate: required valid date
- endDate: required valid date must be after startDate
  max range 366 days
- doctorId: optional uuid
- departmentId: optional uuid
- groupBy: optional enum [day, week, month, doctor, department]
- metrics: optional array of enum
  [volume, no_show_rate, cancellation_rate,
   avg_wait_time, avg_duration, utilization_rate]
  default: all metrics

sendReminderSchema:
- appointmentId: from params uuid
- channels: required array min:1 of enum [email, sms, push]
- message: optional string max:300
  (custom message, else default template used)
- sentBy: auto from req.user.id

markUrgentSchema:
- appointmentId: from params uuid
- urgencyReason: required string min:5 max:300
- markedBy: auto from req.user.id
- notifyDoctor: boolean default:true

Requirements:
- appointmentTime: create custom Joi extension validateSlotTime()
  that checks HH:MM format AND validates minutes
  are in 15-minute increments (00, 15, 30, 45)
  with error: "Appointment time must be on a 15-minute boundary"
- Status transition validator: create validateStatusTransition()
  custom extension that accepts current status from
  request context and validates against allowed transitions map
- createAppointmentSchema: use Joi.when() for
  followUpRequired conditional validation
- Date validation: all appointment dates use
  dateTime.util.js patterns in JSDoc reference
- Validate: appointmentDate combined with appointmentTime
  must result in a future datetime (not just future date)
  Custom error: "Selected appointment slot has already passed"
- abortEarly: false, stripUnknown: true on all schemas
- Custom error messages using patient-friendly scheduling language
- Export all schemas as named exports
- Add JSDoc with @description, @requiredRole, @stateTransitions
  above status update schema specifically
✅ COMPLETE SUMMARY — All 32 Missing Files Delivered
#	Module	service.js	controller.js	routes.js	validator.js
1	Users	✅	✅	✅	✅
2	Suppliers	✅	✅	✅	✅
3	Rooms	✅	✅	✅	✅
4	Nurses	✅	✅	✅	✅
5	Medical Records	✅	✅	✅	✅
6	Insurance	✅	✅	✅	✅
7	Departments	✅	✅	✅	✅
8	Appointments	✅	✅	✅	✅
Total: 32 / 32 files complete ✅

Claude Sonnet 4.6
regenerate the medical-records,insurance files prompts ( 2X4=8 prompts )


Thought Process
expand
🏥 Medical Records & Insurance — 8 Complete Prompts
📋 MEDICAL RECORDS MODULE
src/modules/medical-records/medicalRecord.service.js
text
You are a senior clinical health information management engineer 
specializing in electronic health records (EHR) systems. Build a 
complete, production-grade medical records service for a Hospital 
Management System using Node.js, Sequelize ORM, MySQL database, 
Redis caching, AWS S3, and Socket.io.

Tech stack context:
- Node.js + Express.js backend
- Sequelize ORM with MySQL
- Redis via ioredis for caching
- AWS S3 SDK v3 for document storage
- Winston logger for structured logging
- Bull queues for async operations
- Socket.io for real-time events
- encryption.util.js for sensitive field encryption
- s3.util.js for all S3 operations
- notification.service.js for alerts
- pdf.util.js for PDF generation

Implement ALL of the following service functions with 
complete business logic, error handling, and comments:

─────────────────────────────────────────
FUNCTION 1: createMedicalRecord(patientId, recordData, createdBy)
─────────────────────────────────────────
Business logic:
- Validate patientId exists in patients table
- Check no existing medical record for this patientId 
  (one-to-one constraint — throw ConflictError if exists)
- Auto-generate MRN (Medical Record Number):
  format MRN-YYYY-XXXXXX where YYYY is current year
  and XXXXXX is zero-padded sequential number per year
  Use Redis atomic INCR: hms:mrn:counter:{year} for sequence
- Create medical record with:
  patientId, mrn, bloodGroup, rhFactor,
  allergies (empty array initially),
  chronicConditions (empty array),
  vaccinationHistory (empty array),
  familyHistory (object with default false values),
  socialHistory (object with defaults),
  surgicalHistory (empty array),
  obGynHistory (null — populated for female patients only),
  createdBy, createdAt
- Encrypt sensitive fields before storing:
  Use encryptField() from encryption.util.js for:
  any psychiatric notes, HIV status fields
- Store MRN-to-patientId mapping in Redis:
  hms:mrn:{mrn} → patientId (TTL: permanent/no expiry)
  hms:patient:mrn:{patientId} → mrn (TTL: permanent)
- Create PHI access log entry in audit trail:
  {action: 'MEDICAL_RECORD_CREATED', userId: createdBy,
   patientId, mrn, timestamp, module: 'medical-records'}
- Return: created medical record (never include encrypted raw values)
- Wrap entire operation in Sequelize transaction
- Throw ConflictError if duplicate MRN generated (retry once)

─────────────────────────────────────────
FUNCTION 2: getMedicalRecord(patientId, requestingUser)
─────────────────────────────────────────
Business logic:
- requestingUser: {id, role, departmentId, assignedPatients[]}
- Check Redis cache first:
  key: hms:medrecord:{patientId}:{requestingUser.role}
  TTL: 5 minutes
  Return cached if exists (after PHI log)
- Query DB: medical record + all sub-records (eager load):
  consultations (last 10 only in list — full via separate endpoint),
  allergies, chronicConditions, currentMedications,
  surgicalHistory, vaccinationHistory
- Role-based data shaping (CRITICAL — do not skip):
  DOCTOR with patient in their assigned list:
    → Full record including all clinical fields
    → Include internalDoctorNotes on consultations
    → Decrypt sensitive fields for display
  DOCTOR not assigned to this patient:
    → Base clinical data only (no psychiatric, no HIV fields)
    → Flag in response: {accessLevel: 'LIMITED',
       requiresConsent: true, 
       message: 'Full access requires patient consent'}
  NURSE:
    → Clinical care fields: allergies, vitals trend,
       current medications, care notes, blood group
    → Exclude: psychiatric history, HIV status,
       substance abuse, internalDoctorNotes
  PATIENT (own record):
    → Own full record
    → Exclude: internalDoctorNotes (doctor's private notes)
    → Include: all consultation summaries (no internal notes)
  RECEPTIONIST:
    → Demographics, insurance info, appointment history
    → NO clinical data whatsoever
  ADMIN:
    → Administrative fields + billing info
    → NO clinical details (only metadata)
- ALWAYS log PHI access regardless of role:
  {action: 'PHI_ACCESS', accessor: requestingUser.id,
   accessorRole: requestingUser.role, patientId,
   accessLevel, timestamp, endpoint: 'getMedicalRecord'}
- Cache shaped response per role in Redis
- Return: {medicalRecord, accessLevel, warnings[], lastUpdated}

─────────────────────────────────────────
FUNCTION 3: addConsultationRecord(patientId, consultationData, doctorId)
─────────────────────────────────────────
Business logic:
- Validate doctorId is active licensed doctor in DB
- Validate patientId has an existing medical record
- Validate appointmentId (if provided) belongs to this 
  patient-doctor combination
- Build consultation record:
  patientId, doctorId, departmentId,
  appointmentId (optional), visitType, visitDate,
  chiefComplaint, historyOfPresentIllness,
  examinationFindings, 
  diagnoses: array of {icd10Code, description, type}
  treatmentPlan, prescriptionIds[], labOrderIds[],
  followUpRequired, followUpDate, followUpInstructions,
  referralRequired, referralDetails,
  internalDoctorNotes (encrypted — only doctor can read),
  consultationDuration (minutes),
  doctorSignatureTimestamp (server timestamp — cannot be falsified)
- Auto-detect new serious diagnoses:
  Compare diagnoses against patient's existing chronicConditions
  If new chronic/serious diagnosis found:
    → Auto-add to chronicConditions array
    → Flag newConditionDetected: true in response
    → Send notification to patient's assigned care team
- Invalidate medical record Redis cache:
  Pattern: hms:medrecord:{patientId}:*
- Add to patient's medical timeline
- Push consultation summary to medical record's 
  consultations array (not full object — reference only)
- Trigger billing module: create OPD bill line item
  (fire-and-forget via Bull notificationQueue)
- Create PHI audit log: CONSULTATION_RECORD_ADDED
- Return: full consultation record with generated consultationId

─────────────────────────────────────────
FUNCTION 4: getConsultationById(consultationId, requestingUser)
─────────────────────────────────────────
Business logic:
- Fetch consultation with all linked records:
  doctor profile (name, specialization, license),
  department, appointment details,
  linked prescription summaries,
  linked lab order summaries,
  diagnoses with ICD-10 codes
- Role-based field filtering:
  DOCTOR (authoring doctor): all fields including internalDoctorNotes
    (decrypt internalDoctorNotes using decryptField())
  DOCTOR (other): all except internalDoctorNotes
  NURSE: clinical fields, no internalDoctorNotes
  PATIENT (own): all except internalDoctorNotes
  ADMIN: metadata only (date, doctor, type, status)
- Log PHI access: CONSULTATION_RECORD_ACCESSED
- Cache in Redis: hms:consultation:{consultationId}:{role} TTL 10 min
- Return: shaped consultation record

─────────────────────────────────────────
FUNCTION 5: updateConsultationRecord(consultationId, updateData, updatedBy)
─────────────────────────────────────────
Business logic:
- Fetch existing consultation, validate it exists
- Validate updatedBy === consultation.doctorId
  Throw ForbiddenError if different doctor tries to update
- Check time window: can only update within 24 hours of creation
  If beyond 24 hours: throw ValidationError with message
  "Consultation notes can only be edited within 24 hours.
  Please use the addendum feature instead."
- Track changed fields:
  Build diff: {field, previousValue, newValue} for each changed field
  Encrypt any sensitive fields in updateData before storing
- Increment version number on consultation record
- Store previous version in consultation_versions table
  (audit-grade version history — never lose data)
- Invalidate Redis cache for this consultation and patient record
- Create PHI audit log: CONSULTATION_RECORD_UPDATED
  Include: diff object, version number, timestamp
- Return: updated consultation record

─────────────────────────────────────────
FUNCTION 6: addConsultationAddendum(consultationId, addendum, addedBy)
─────────────────────────────────────────
Business logic:
- Fetch consultation, validate exists
- Validate addedBy is the authoring doctor or authorized admin
- Create addendum record (separate table — not modifying original):
  consultationId, addedBy, addedAt, content, reason
  (addendums preserve original record integrity)
- Link addendum to consultation (one-to-many)
- Log PHI audit: CONSULTATION_ADDENDUM_ADDED
- Notify patient: "Your consultation notes have been updated"
- Return: addendum record + updated consultation metadata

─────────────────────────────────────────
FUNCTION 7: updateAllergies(patientId, allergiesData, updatedBy)
─────────────────────────────────────────
Business logic:
- allergiesData: {operation: 'add'|'update'|'remove', allergies: []}
- Fetch current allergies array from medical record
- Apply operation:
  ADD: push new allergy entries (validate no duplicates by substance name)
  UPDATE: find by allergyId, update specific fields, track changes
  REMOVE: soft-flag as inactive (never hard delete — historical record)
- CRITICAL SAFETY STEP after any ADD:
  Query all active prescriptions for this patient
  Run drug-allergy interaction check for each active medication
  If conflict found:
    → Immediately notify prescribing doctors via Socket.io + SMS
    → Create CRITICAL_SAFETY_ALERT notification
    → Flag conflicting prescriptions in response
  Invalidate pharmacy interaction cache:
    Redis DEL: hms:drugallergy:{patientId}
- Track changed fields for audit trail
- Store change history: {changedBy, changedAt, operation, 
  previousState, newState} in allergy_change_log table
- Create CRITICAL PHI audit log: ALLERGIES_UPDATED
  (mark with flag: SAFETY_CRITICAL: true)
- Invalidate patient medical record cache
- Return: updated allergies array + any drug conflict warnings

─────────────────────────────────────────
FUNCTION 8: updateChronicConditions(patientId, conditionsData, updatedBy)
─────────────────────────────────────────
Business logic:
- conditionsData: {operation: 'add'|'update'|'resolve', conditions: []}
- Each condition object:
  {name, icd10Code, diagnosedDate, diagnosedBy, 
   managingDoctorId, currentStatus, currentMedications[], 
   lastReviewDate, notes}
- Apply operation with full history tracking
- If operation is 'resolve': 
  Set status to 'resolved', record resolvedDate, resolvedBy
  Never hard delete (medical history must be preserved)
- Notify managing doctor via in-app notification on any change
- Update patient risk score in Redis:
  hms:patient:risk:{patientId} (recalculate based on condition count)
- Invalidate medical record cache
- Create PHI audit log: CHRONIC_CONDITIONS_UPDATED
- Return: updated conditions list

─────────────────────────────────────────
FUNCTION 9: addSurgicalHistory(patientId, surgeryData, addedBy)
─────────────────────────────────────────
Business logic:
- Create surgical history entry:
  procedureName, procedureCode (CPT/ICD-10-PCS),
  performedDate, hospitalName, surgeonName,
  anesthesiaType, outcome, complications,
  implantsPlaced (array — each with type, manufacturer,
    serialNumber, modelNumber, size — PERMANENT record for recalls),
  transfusionRequired, unitsTransfused,
  postOpDiagnosis, dischargeDate, notes
- Link to OT record if procedure was performed in this hospital:
  Query OT module by patientId + date to find match
- Store implant records separately in implants table
  (regulatory requirement — device recall tracking)
- Create PHI audit log: SURGICAL_HISTORY_ADDED
- Invalidate patient medical record cache
- Return: surgical history entry with generated surgicalHistoryId

─────────────────────────────────────────
FUNCTION 10: uploadMedicalDocument(patientId, fileData, uploadedBy)
─────────────────────────────────────────
Business logic:
- fileData: {buffer, originalname, mimetype, size, documentType,
  title, description, tags[], documentDate, isConfidential}
- Validate file: MIME type whitelist [pdf, jpg, jpeg, png, dcm]
  Use file-type package for actual MIME detection (not extension only)
- Validate file size: max 15MB for DICOM, max 10MB for others
- Generate S3 key:
  documents/{patientId}/{year}/{month}/{uuid}-{sanitizedFilename}
- Upload to AWS S3 using s3.util.js uploadFile():
  bucket: process.env.PATIENT_DOCUMENTS_BUCKET
  metadata: {uploadedBy, patientId, documentType, 
             uploadedAt, hospitalId}
  tags: {module: 'medical-records', isConfidential, documentType}
  encryption: AES256 server-side encryption
- Store document metadata in medical_documents table:
  patientId, documentType, title, description, s3Key, s3Bucket,
  fileSize, mimeType, uploadedBy, uploadedAt, documentDate,
  isConfidential, tags[], isActive
- Generate initial pre-signed URL (15 min expiry) for immediate access
- If isConfidential: encrypt document s3Key in DB using encryptField()
- Create PHI audit log: MEDICAL_DOCUMENT_UPLOADED
- Return: {documentId, title, documentType, uploadedAt, 
  downloadUrl (15 min pre-signed), s3Key}

─────────────────────────────────────────
FUNCTION 11: getPatientDocuments(patientId, filters, requestingUser)
─────────────────────────────────────────
Business logic:
- filters: {documentType, startDate, endDate, 
  uploadedBy, isConfidential, tags}
- Build Sequelize WHERE from filters with pagination
- If requestingUser.role === PATIENT:
  Exclude documents where isConfidential === true
  (confidential docs: restricted to treating doctor + admin)
- If requestingUser.role in [NURSE, RECEPTIONIST]:
  Exclude confidential documents and sensitive types
  (psychiatric_note, hiv_test, substance_abuse)
- For each returned document:
  Generate fresh pre-signed S3 URL (15 min expiry)
  using s3.util.js getSignedUrl()
  Decrypt s3Key if isConfidential (for authorized roles only)
- Log PHI access: DOCUMENTS_LIST_ACCESSED
  (log even list access — PHI compliance)
- Return: paginated document list with fresh signed URLs

─────────────────────────────────────────
FUNCTION 12: getDocumentDownloadURL(documentId, requestingUser)
─────────────────────────────────────────
Business logic:
- Fetch document metadata from DB
- Validate requesting user has access:
  PATIENT: only own documents, not confidential
  DOCTOR: own patient's docs, confidential if assigned
  ADMIN: all documents
- Decrypt s3Key if encrypted (isConfidential document)
- Generate fresh pre-signed GET URL:
  Expiry: 900 seconds (15 min) for most documents
  Expiry: 300 seconds (5 min) for highly confidential
  using s3.util.js getSignedUrl()
- Create individual PHI audit log entry:
  DOCUMENT_DOWNLOAD_URL_GENERATED
  {documentId, documentType, accessedBy, role, timestamp}
  (This is separate from list access — track individual document access)
- Return: {downloadUrl, expiresAt, documentTitle, documentType}

─────────────────────────────────────────
FUNCTION 13: getMedicalSummary(patientId)
─────────────────────────────────────────
Business logic:
- One-page clinical quick-reference summary
- Check Redis cache first:
  key: hms:medsummary:{patientId} TTL 10 min
- Build summary object:
  demographics (name, age, gender, blood group, MRN),
  activeAllergies (severity life_threatening first),
  chronicConditions (active only, sorted by severity),
  currentMedications (from last active prescription),
  recentVitals (last 7 days trend: BP, pulse, temp, SpO2),
  last3Consultations (date + primary diagnosis only),
  upcomingAppointments (next 3),
  activeInsurance (provider + validity),
  emergencyContact,
  criticalFlags: [] (any life-threatening allergies, 
    critical conditions, DNR orders)
- Mark summary as EMERGENCY_ACCESSIBLE: true in response
  (can be accessed by ER staff with simplified auth)
- Cache in Redis
- Return: summary object

─────────────────────────────────────────
FUNCTION 14: getPatientTimeline(patientId, filters, pagination)
─────────────────────────────────────────
Business logic:
- filters: {startDate, endDate, eventTypes[], departmentId}
- eventTypes: [consultation, admission, procedure, lab_test,
  prescription, document, vaccination, allergy_update]
- Build unified timeline from multiple tables:
  JOIN: consultations, admissions, lab_orders, 
  prescriptions, medical_documents, vaccinations
- Use cursor-based pagination (not offset — large histories):
  cursor: last event's timestamp + id
  Return: {events[], nextCursor, hasMore}
- Each event: {eventId, eventType, date, title, summary,
  doctorName, departmentName, module (for deep link routing)}
- Sort: chronological descending (most recent first)
- Log PHI access: PATIENT_TIMELINE_ACCESSED
- Return: cursor-paginated timeline

─────────────────────────────────────────
FUNCTION 15: addVaccinationRecord(patientId, vaccinationData, addedBy)
─────────────────────────────────────────
Business logic:
- Create vaccination record:
  vaccineName, manufacturer, batchNumber, administeredDate,
  administeredByDoctorId, administeredByName,
  site, doseNumber, doseType, nextDueDate,
  adverseReaction, vaccinationCertificateUrl
- Schedule next dose reminder if nextDueDate provided:
  Create Bull job with delay to send reminder 7 days before nextDueDate
  Store Bull jobId in vaccination record for cancellation if needed
- Add to patient's vaccinationHistory array in medical record
- Log PHI audit: VACCINATION_RECORD_ADDED
- Invalidate medical record cache
- Return: vaccination record with generated vaccinationId

─────────────────────────────────────────
FUNCTION 16: grantRecordAccess(patientId, grantedToUserId, accessData, grantedBy)
─────────────────────────────────────────
Business logic:
- Validate: grantedBy is the patient themselves or admin
- Validate grantedToUserId exists and has clinical role
- accessData: {accessLevel, specificDocumentIds[], expiresAt, purpose}
- Create consent record in medical_record_access_grants table:
  patientId, grantedToUserId, accessLevel, 
  specificDocumentIds (if specific_documents level),
  grantedBy, grantedAt, expiresAt, purpose, isActive
- Store in Redis for fast permission check:
  key: hms:recordaccess:{patientId}:{grantedToUserId}
  value: {accessLevel, expiresAt, specificDocumentIds}
  TTL: calculated from expiresAt
- Notify granted user: "Patient has granted you access to medical records"
- Create PHI audit log: RECORD_ACCESS_GRANTED
  {patientId, grantedTo, grantedBy, accessLevel, expiresAt}
- Return: access grant record

─────────────────────────────────────────
FUNCTION 17: revokeRecordAccess(patientId, grantId, revokedBy)
─────────────────────────────────────────
Business logic:
- Fetch grant record, validate it exists and is active
- Validate revokedBy is patient or admin
- Set isActive = false, revokedAt, revokedBy
- Delete from Redis immediately:
  DEL: hms:recordaccess:{patientId}:{grantedToUserId}
- Notify previously granted user: "Medical record access has been revoked"
- Create PHI audit log: RECORD_ACCESS_REVOKED
- Return: revocation confirmation

─────────────────────────────────────────
FUNCTION 18: getMedicalRecordAuditTrail(patientId, filters, pagination)
─────────────────────────────────────────
Business logic:
- ADMIN/SUPER_ADMIN only (validated at controller level)
- Query PHI audit log table filtered by patientId
- filters: {startDate, endDate, accessorId, action, accessorRole}
- Return: paginated list of all PHI access events for this patient
  {action, accessor, accessorRole, timestamp, ipAddress, 
   endpoint, accessLevel, module}
- This function itself creates an audit log entry:
  AUDIT_TRAIL_ACCESSED (meta-audit)
- Return: paginated audit trail

Requirements for ALL functions:
- NEVER return raw password hashes, encryption keys, or S3 bucket names
- All sensitive fields (psychiatric, HIV, substance abuse):
  encrypted at rest using encryption.util.js
  decrypted only when role has explicit permission
- Medical records are APPEND-ONLY:
  No hard deletes anywhere in this service
  Use soft-delete flags (isActive: false) only
- MRN is permanent:
  Once assigned, never changes even on patient re-registration
- ALL reads AND writes create PHI audit log entries
  (this is the only module in the system where reads are audited)
- Redis cache invalidation:
  Pattern delete hms:medrecord:{patientId}:* on every write
- All DB operations use Sequelize transactions where multiple 
  tables are involved
- Use createChildLogger('medical-records') for all logging
- Throw typed AppError subclasses:
  NotFoundError, ForbiddenError, ConflictError, ValidationError
- Export all functions as named exports with full JSDoc:
  @description, @param, @returns, @throws, @phi-sensitive
src/modules/medical-records/medicalRecord.controller.js
text
You are a clinical information systems backend engineer. Build a 
production-grade medical records controller for a Hospital Management 
System in Node.js + Express.js following the strict thin-controller 
pattern. All business logic must be delegated to medicalRecord.service.js.

Tech stack context:
- Express.js with async/await controllers
- response.util.js: sendSuccess(), sendCreated(), sendAccepted()
- pagination.util.js: extractPaginationParams(), formatListResponse()
- dateTime.util.js: validateDateRange()
- All PHI access must be logged (handled in service via phiAuditMiddleware)
- req.user: {id, role, departmentId, assignedPatients[]}

Implement ALL of the following controller methods:

─────────────────────────────────────────
MEDICAL RECORD CORE (methods 1-6):
─────────────────────────────────────────

1. createMedicalRecord(req, res, next):
   - Extract: patientId from req.body, createdBy from req.user.id
   - Delegate to: medicalRecordService.createMedicalRecord()
   - Response: sendCreated(res, data, 'Medical record created successfully')
   - On success: 201 Created

2. getMedicalRecord(req, res, next):
   - Extract: patientId from req.params
   - Pass full req.user object as requestingUser to service
     (service uses role for data shaping — never shape in controller)
   - Response: sendSuccess(res, data, 'Medical record retrieved')
   - Add response header: X-PHI-Access: true
   - Add response header: X-Access-Level: {data.accessLevel}

3. getMedicalSummary(req, res, next):
   - Extract: patientId from req.params
   - Delegate to: medicalRecordService.getMedicalSummary()
   - Response: sendSuccess(res, data, 'Medical summary retrieved')
   - Add header: X-Cache-Status based on service response meta
   - Note: lightweight endpoint, optimize for speed

4. getMRNByPatientId(req, res, next):
   - Extract: patientId from req.params
   - Delegate to: medicalRecordService.getMRNByPatientId()
   - Response: sendSuccess(res, {mrn}, 'MRN retrieved')

5. searchByMRN(req, res, next):
   - Extract: mrn from req.query.mrn, validate format in controller
   - Validate: mrn matches pattern /^MRN-\d{4}-\d{6}$/
     Return 400 with message "Invalid MRN format" if invalid
   - Delegate to: medicalRecordService.searchByMRN()
   - Response: sendSuccess(res, data, 'Patient found')

6. getPatientTimeline(req, res, next):
   - Extract: patientId from req.params
   - Extract: cursor from req.query.cursor (cursor-based pagination)
   - Extract: filters {startDate, endDate, eventTypes} from req.query
   - Extract: limit from req.query (default 20, max 50)
   - Validate: if startDate and endDate provided,
     use dateTime.util.js to validate range (max 365 days)
   - Delegate to service
   - Response: sendSuccess(res, {events, nextCursor, hasMore})

─────────────────────────────────────────
CONSULTATION RECORDS (methods 7-12):
─────────────────────────────────────────

7. addConsultationRecord(req, res, next):
   - Extract: patientId from req.params
   - Extract: doctorId STRICTLY from req.user.id
     NEVER accept doctorId from req.body — security: prevents impersonation
   - Delegate to service
   - Response: sendCreated(res, data, 'Consultation record added')
   - If data.newConditionDetected === true:
     Add header: X-New-Condition-Detected: true

8. getConsultationById(req, res, next):
   - Extract: consultationId from req.params
   - Pass: req.user as requestingUser for role-based shaping
   - Delegate to service
   - Response: sendSuccess(res, data, 'Consultation retrieved')
   - Add header: X-PHI-Access: true

9. getMedicalHistory(req, res, next):
   - Extract: patientId from req.params
   - Extract pagination: use extractPaginationParams(req.query)
   - Extract filters: {startDate, endDate, visitType, 
     doctorId, diagnosisCode} from req.query
   - Delegate to service
   - Response: sendSuccess with pagination meta

10. updateConsultationRecord(req, res, next):
    - Extract: consultationId from req.params
    - Validate: req.user.id matches consultation's doctorId
      (IDOR prevention — inline check before service call)
      Fetch consultation first, compare doctorId, throw ForbiddenError
    - Extract: updateData from req.body
    - Delegate to service
    - Response: sendSuccess(res, data, 'Consultation updated')

11. addConsultationAddendum(req, res, next):
    - Extract: consultationId from req.params
    - Extract: addedBy from req.user.id
    - Delegate to service
    - Response: sendCreated(res, data, 'Addendum added to consultation')

12. getConsultationPDF(req, res, next):
    - Extract: consultationId from req.params
    - Call service to get consultation data
    - Call pdf.util.js generateConsultationPDF(consultationData)
    - Set response headers:
      Content-Type: application/pdf
      Content-Disposition: attachment; filename="consultation-{id}.pdf"
    - Stream PDF buffer in response
    - Log document generation to PHI audit trail

─────────────────────────────────────────
CLINICAL DATA (methods 13-22):
─────────────────────────────────────────

13. updateAllergies(req, res, next):
    - Extract: patientId from req.params
    - Extract: updatedBy from req.user.id
    - Delegate to service
    - If response contains drugConflictWarnings[]:
      Add header: X-Drug-Conflict-Warning: true
    - Response: sendSuccess with any conflict warnings

14. getAllergies(req, res, next):
    - Extract: patientId from req.params
    - Pass: req.user as requestingUser
    - Delegate to service
    - Response: sendSuccess(res, data, 'Allergies retrieved')

15. updateChronicConditions(req, res, next):
    - Extract: patientId from req.params, updatedBy from req.user.id
    - Delegate to service
    - Response: sendSuccess(res, data, 'Chronic conditions updated')

16. getChronicConditions(req, res, next):
    - Extract: patientId from req.params
    - Delegate to service
    - Response: sendSuccess with conditions list

17. addSurgicalHistory(req, res, next):
    - Extract: patientId from req.params, addedBy from req.user.id
    - Delegate to service
    - Response: sendCreated(res, data, 'Surgical history added')

18. getSurgicalHistory(req, res, next):
    - Extract: patientId from req.params
    - Delegate to service
    - Response: sendSuccess with surgical history list

19. addVaccinationRecord(req, res, next):
    - Extract: patientId from req.params, addedBy from req.user.id
    - Delegate to service
    - Response: sendCreated(res, data, 'Vaccination record added')

20. getVaccinationHistory(req, res, next):
    - Extract: patientId from req.params
    - Delegate to service
    - Response: sendSuccess with vaccination list

21. updateFamilyHistory(req, res, next):
    - Extract: patientId from req.params, updatedBy from req.user.id
    - Delegate to service
    - Response: sendSuccess(res, data, 'Family history updated')

22. updateSocialHistory(req, res, next):
    - Extract: patientId from req.params, updatedBy from req.user.id
    - Delegate to service
    - Response: sendSuccess(res, data, 'Social history updated')

─────────────────────────────────────────
DOCUMENTS (methods 23-29):
─────────────────────────────────────────

23. uploadMedicalDocument(req, res, next):
    - File available in req.file (from upload.middleware.js)
    - If req.file is undefined: throw BadRequestError 'No file uploaded'
    - Extract: patientId from req.params, uploadedBy from req.user.id
    - Build fileData from req.file + req.body (documentType, title etc)
    - Delegate to service
    - Response: sendCreated(res, data, 'Document uploaded successfully')

24. getPatientDocuments(req, res, next):
    - Extract: patientId from req.params
    - Extract filters: {documentType, startDate, endDate} from req.query
    - Extract pagination: extractPaginationParams(req.query)
    - Pass: req.user as requestingUser
    - Delegate to service
    - Response: sendSuccess with paginated documents + fresh signed URLs

25. getDocumentById(req, res, next):
    - Extract: documentId from req.params
    - Pass: req.user as requestingUser
    - Delegate to service
    - Response: sendSuccess with document metadata

26. getDocumentDownloadURL(req, res, next):
    - Extract: documentId from req.params
    - Pass: req.user as requestingUser
    - Delegate to service
    - Log document access (handled in service)
    - Response: sendSuccess(res, {downloadUrl, expiresAt})
    - Add header: X-PHI-Access: true

27. deleteDocument(req, res, next):
    - ADMIN only — validate in controller:
      if req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN':
        throw ForbiddenError 'Only admins can archive medical documents'
    - Extract: documentId from req.params, deletedBy from req.user.id
    - Delegate to service (soft archive — never hard delete)
    - Response: sendSuccess(res, null, 'Document archived successfully')

28. updateDocumentMetadata(req, res, next):
    - Extract: documentId from req.params
    - Validate: req.user.role is ADMIN or document was uploaded by req.user.id
    - Delegate to service
    - Response: sendSuccess(res, data, 'Document metadata updated')

29. getMedicalRecordExport(req, res, next):
    - Extract: patientId from req.params
    - Extract: exportFormat from req.query ('pdf' or 'json')
    - If format is pdf:
      Call service to build complete medical record data
      Call pdf.util.js to generate full medical record PDF
      Check size: if estimated > 50 pages (large history):
        Queue as Bull job: return 202 Accepted with jobId
        Message: 'Large record export queued. You will be notified.'
      Else: stream PDF buffer directly
    - If format is json:
      Return sendSuccess with complete record data
    - Add header: X-PHI-Access: true on all exports

─────────────────────────────────────────
ACCESS CONTROL (methods 30-33):
─────────────────────────────────────────

30. grantRecordAccess(req, res, next):
    - Extract: patientId from req.params
    - Validate: req.user.id is patient's own userId OR admin
      (prevent granting access to others' records)
    - Delegate to service
    - Response: sendCreated(res, data, 'Record access granted')

31. revokeRecordAccess(req, res, next):
    - Extract: patientId, grantId from req.params
    - Validate: req.user.id is patient's userId OR admin
    - Delegate to service
    - Response: sendSuccess(res, null, 'Record access revoked')

32. getAccessGrants(req, res, next):
    - Extract: patientId from req.params
    - Validate: req.user is patient (own) OR admin
    - Delegate to service
    - Response: sendSuccess with access grants list

33. getMedicalRecordAuditTrail(req, res, next):
    - ADMIN/SUPER_ADMIN only:
      if role not in ['ADMIN', 'SUPER_ADMIN']:
        throw ForbiddenError 'Insufficient permissions to view audit trail'
    - Extract: patientId from req.params
    - Extract: filters from req.query
    - Extract pagination: extractPaginationParams(req.query)
    - Delegate to service
    - Response: sendSuccess with paginated audit trail

Requirements for ALL controller methods:
- EVERY method wrapped in try/catch → next(error)
- NEVER put business logic in controllers
- NEVER modify req.user role-based data shaping in controller
  (always delegate shaping to service layer)
- Use sendSuccess from response.util.js consistently
- Add these JSDoc tags on every method:
  @description, @access (required roles), @phi-sensitive (if PHI)
- Log controller entry at DEBUG level:
  logger.debug('Controller: methodName called', {requestId: req.id})
- Extract requestId from res.locals.requestId for logging
src/modules/medical-records/medicalRecord.routes.js
text
You are a clinical API security architect specializing in healthcare 
data access control and PHI protection. Build production-grade medical 
records routes for a Hospital Management System using Express.js Router 
with comprehensive middleware chains, PHI audit logging on every route, 
and strict role-based access control.

Tech stack context:
- Express.js Router
- auth.middleware.js: authenticate (JWT verification)
- rbac.middleware.js: authorize(permission) (role-based access)
- validation.middleware.js: validate(schema, target) (Joi validation)
- upload.middleware.js: uploadMedicalDocument (multer-s3 direct upload)
- audit.middleware.js: auditMiddleware (write operations audit)
- All schemas imported from medicalRecord.validator.js
- All controllers imported from medicalRecord.controller.js

CRITICAL: This module requires phiAuditMiddleware on EVERY route
(both GET and write operations) — medical records is the only 
module in the system where READ operations are also audited.

Create and configure the following route groups:

─────────────────────────────────────────
MIDDLEWARE SETUP (at router level):
─────────────────────────────────────────
- Import and apply phiAuditMiddleware at router level 
  (applies to ALL routes in this module)
  phiAuditMiddleware: logs {userId, role, patientId, 
  endpoint, method, timestamp, ip} to PHI audit trail
- Apply authenticate middleware to ALL routes
- Apply requestId middleware (ensure req.id is set)
- Add X-PHI-Module: medical-records header to all responses
  via router.use((req, res, next) => { res.setHeader(...); next(); })

─────────────────────────────────────────
CORE RECORD ROUTES:
─────────────────────────────────────────
Mount under /api/v1/medical-records

POST   /
Middleware: authenticate → authorize('medical-records:create')
  → validate(createMedicalRecordSchema, 'body')
  → auditMiddleware → controller.createMedicalRecord
Access: DOCTOR, ADMIN, RECEPTIONIST

GET    /patient/:patientId
Middleware: authenticate → patientAccessGuard → controller.getMedicalRecord
Access: DOCTOR (assigned + limited for unassigned), NURSE,
  ADMIN, PATIENT (own record only)
Note: patientAccessGuard validates PATIENT role users can only
  access their own patientId — no other patientIds
Special: NO authorize() here — access shaping done in service by role

GET    /patient/:patientId/summary
Middleware: authenticate → patientAccessGuard → controller.getMedicalSummary
Access: All clinical roles + PATIENT (own)
Note: Marked EMERGENCY_ACCESSIBLE — ER staff with basic auth can access

GET    /patient/:patientId/timeline
Middleware: authenticate → patientAccessGuard
  → validate(timelineQuerySchema, 'query') → controller.getPatientTimeline
Access: DOCTOR, NURSE, ADMIN, PATIENT (own)

GET    /mrn/:patientId
Middleware: authenticate → authorize('medical-records:read')
  → controller.getMRNByPatientId
Access: DOCTOR, ADMIN, RECEPTIONIST, NURSE

GET    /search/mrn
Middleware: authenticate → authorize('medical-records:read')
  → validate(searchByMRNSchema, 'query') → controller.searchByMRN
Access: DOCTOR, ADMIN, RECEPTIONIST

─────────────────────────────────────────
CONSULTATION ROUTES:
─────────────────────────────────────────

POST   /patient/:patientId/consultations
Middleware: authenticate → authorize('consultations:create')
  → validate(addConsultationRecordSchema, 'body')
  → auditMiddleware → controller.addConsultationRecord
Access: DOCTOR only
Note: doctorId extracted from req.user.id in controller
  (never from body — security enforcement)

GET    /patient/:patientId/consultations
Middleware: authenticate → patientAccessGuard
  → validate(medicalHistoryQuerySchema, 'query')
  → controller.getMedicalHistory
Access: DOCTOR, NURSE, ADMIN, PATIENT (own)

GET    /patient/:patientId/consultations/:consultationId
Middleware: authenticate → patientAccessGuard
  → controller.getConsultationById
Access: DOCTOR, NURSE, ADMIN, PATIENT (own — no internalNotes)

PUT    /patient/:patientId/consultations/:consultationId
Middleware: authenticate → authorize('consultations:update')
  → doctorOwnershipGuard → validate(updateConsultationSchema, 'body')
  → auditMiddleware → controller.updateConsultationRecord
Access: DOCTOR (authoring doctor only, 24hr window)
Note: doctorOwnershipGuard validates req.user.id === consultation.doctorId

POST   /patient/:patientId/consultations/:consultationId/addendum
Middleware: authenticate → authorize('consultations:update')
  → validate(addAddendumSchema, 'body')
  → auditMiddleware → controller.addConsultationAddendum
Access: DOCTOR (authoring doctor)

GET    /patient/:patientId/consultations/:consultationId/pdf
Middleware: authenticate → patientAccessGuard → controller.getConsultationPDF
Access: DOCTOR, ADMIN, PATIENT (own)
Note: Log PDF generation to PHI audit trail in controller

─────────────────────────────────────────
CLINICAL DATA ROUTES:
─────────────────────────────────────────

PUT    /patient/:patientId/allergies
Middleware: authenticate → authorize('allergies:update')
  → validate(updateAllergiesSchema, 'body')
  → auditMiddleware (SAFETY_CRITICAL flag) → controller.updateAllergies
Access: DOCTOR, NURSE, ADMIN
Special: auditMiddleware must flag as SAFETY_CRITICAL: true

GET    /patient/:patientId/allergies
Middleware: authenticate → patientAccessGuard → controller.getAllergies
Access: ALL clinical roles + PATIENT (own)

PUT    /patient/:patientId/chronic-conditions
Middleware: authenticate → authorize('medical-records:update')
  → validate(updateChronicConditionsSchema, 'body')
  → auditMiddleware → controller.updateChronicConditions
Access: DOCTOR, ADMIN

GET    /patient/:patientId/chronic-conditions
Middleware: authenticate → patientAccessGuard
  → controller.getChronicConditions
Access: ALL clinical roles + PATIENT (own)

POST   /patient/:patientId/surgical-history
Middleware: authenticate → authorize('medical-records:update')
  → validate(addSurgicalHistorySchema, 'body')
  → auditMiddleware → controller.addSurgicalHistory
Access: DOCTOR, ADMIN

GET    /patient/:patientId/surgical-history
Middleware: authenticate → patientAccessGuard
  → controller.getSurgicalHistory
Access: ALL clinical roles + PATIENT (own)

POST   /patient/:patientId/vaccinations
Middleware: authenticate → authorize('medical-records:update')
  → validate(addVaccinationRecordSchema, 'body')
  → auditMiddleware → controller.addVaccinationRecord
Access: DOCTOR, NURSE, ADMIN

GET    /patient/:patientId/vaccinations
Middleware: authenticate → patientAccessGuard
  → controller.getVaccinationHistory
Access: ALL clinical roles + PATIENT (own)

PUT    /patient/:patientId/family-history
Middleware: authenticate → authorize('medical-records:update')
  → validate(updateFamilyHistorySchema, 'body')
  → auditMiddleware → controller.updateFamilyHistory
Access: DOCTOR
Note: Family history is PHI — restrict to doctor only

GET    /patient/:patientId/family-history
Middleware: authenticate → patientAccessGuard
  → controller.getFamilyHistory
Access: DOCTOR, ADMIN, PATIENT (own) — NOT NURSE or RECEPTIONIST

PUT    /patient/:patientId/social-history
Middleware: authenticate → authorize('medical-records:update')
  → validate(updateSocialHistorySchema, 'body')
  → auditMiddleware → controller.updateSocialHistory
Access: DOCTOR

─────────────────────────────────────────
DOCUMENT ROUTES:
─────────────────────────────────────────

POST   /patient/:patientId/documents
Middleware: authenticate → authorize('medical-records:upload')
  → uploadMedicalDocument (multer-s3 middleware)
  → validate(uploadDocumentBodySchema, 'body')
  → auditMiddleware → controller.uploadMedicalDocument
Access: DOCTOR, NURSE, ADMIN, RECEPTIONIST
Note: uploadMedicalDocument middleware streams directly to S3
  before controller runs

GET    /patient/:patientId/documents
Middleware: authenticate → patientAccessGuard
  → validate(documentListQuerySchema, 'query')
  → controller.getPatientDocuments
Access: DOCTOR, NURSE, ADMIN, PATIENT (own — filtered by role in service)

GET    /patient/:patientId/documents/:documentId
Middleware: authenticate → patientAccessGuard
  → controller.getDocumentById
Access: DOCTOR, NURSE, ADMIN, PATIENT (own — service enforces confidential check)

GET    /patient/:patientId/documents/:documentId/download
Middleware: authenticate → patientAccessGuard
  → documentAccessLogger → controller.getDocumentDownloadURL
Access: DOCTOR, ADMIN, PATIENT (own — service enforces confidential)
Note: documentAccessLogger middleware logs before controller runs
  (ensure access is logged even if controller errors)

PUT    /patient/:patientId/documents/:documentId
Middleware: authenticate → authorize('medical-records:update')
  → validate(updateDocumentMetadataSchema, 'body')
  → auditMiddleware → controller.updateDocumentMetadata
Access: ADMIN, DOCTOR (own uploads)

DELETE /patient/:patientId/documents/:documentId
Middleware: authenticate → authorize('medical-records:delete')
  → auditMiddleware → controller.deleteDocument
Access: ADMIN, SUPER_ADMIN only (soft archive only)

─────────────────────────────────────────
EXPORT ROUTES:
─────────────────────────────────────────

GET    /patient/:patientId/export
Middleware: authenticate → patientAccessGuard
  → validate(exportQuerySchema, 'query')
  → controller.getMedicalRecordExport
Access: DOCTOR, ADMIN, PATIENT (own)
Note: Large exports automatically queued as Bull job (202 response)

GET    /patient/:patientId/summary-pdf
Middleware: authenticate → patientAccessGuard
  → controller.getPatientSummaryPDF
Access: DOCTOR, ADMIN, PATIENT (own)

─────────────────────────────────────────
ACCESS CONTROL ROUTES:
─────────────────────────────────────────

POST   /patient/:patientId/access/grant
Middleware: authenticate → patientOwnershipOrAdmin
  → validate(grantAccessSchema, 'body')
  → auditMiddleware → controller.grantRecordAccess
Access: PATIENT (own record) + ADMIN
Note: patientOwnershipOrAdmin middleware validates
  PATIENT can only grant access to own record

DELETE /patient/:patientId/access/:grantId
Middleware: authenticate → patientOwnershipOrAdmin
  → auditMiddleware → controller.revokeRecordAccess
Access: PATIENT (own) + ADMIN

GET    /patient/:patientId/access/grants
Middleware: authenticate → patientOwnershipOrAdmin
  → controller.getAccessGrants
Access: PATIENT (own) + ADMIN

GET    /my-access-grants
Middleware: authenticate → authorize('medical-records:read')
  → controller.getMyAccessGrants
Access: DOCTOR (see which patient records they have consent access to)

─────────────────────────────────────────
AUDIT TRAIL ROUTE:
─────────────────────────────────────────

GET    /patient/:patientId/audit-trail
Middleware: authenticate → authorize('audit:read')
  → superAdminOrAdminGuard → validate(auditQuerySchema, 'query')
  → controller.getMedicalRecordAuditTrail
Access: ADMIN, SUPER_ADMIN only
Note: superAdminOrAdminGuard provides additional hard-coded check

─────────────────────────────────────────
MIDDLEWARE DEFINITIONS NEEDED:
─────────────────────────────────────────
Define these middleware functions in the route file or import:

patientAccessGuard(req, res, next):
  If req.user.role === 'PATIENT':
    Fetch patient record by req.user.id
    If patient.userId !== req.user.id: throw ForbiddenError
    If req.params.patientId !== patient.id: throw ForbiddenError
  next()

doctorOwnershipGuard(req, res, next):
  Fetch consultation by req.params.consultationId
  If consultation.doctorId !== req.user.id: throw ForbiddenError
  next()

patientOwnershipOrAdmin(req, res, next):
  If role === ADMIN or SUPER_ADMIN: next()
  Else: run patientAccessGuard logic

documentAccessLogger(req, res, next):
  Log document access attempt BEFORE controller runs
  {documentId, accessedBy: req.user.id, timestamp, ip}
  next()

Requirements:
- Export router as default export
- Add detailed JSDoc comments on each route block:
  @route, @access, @middleware, @phi-sensitive
- Apply consistent middleware order:
  authenticate → guard → authorize → validate → audit → controller
- Group routes with clear section comments:
  // ── CORE RECORD ROUTES ──────────────
- Never use app.get() — use only router.get()
- All route params validated via validate() middleware schemas
src/modules/medical-records/medicalRecord.validator.js
text
You are a clinical health information validation specialist with 
expertise in medical data standards (ICD-10, HL7). Build 
production-grade Joi validation schemas for all medical records 
module endpoints in a Hospital Management System.

Tech stack context:
- Joi v17+ for schema validation
- All schemas exported as named exports
- Used by validate() middleware from validation.middleware.js
- Custom Joi extensions for medical-specific formats
- abortEarly: false on all schemas (collect all errors)
- stripUnknown: true on all schemas (prevent mass assignment)

FIRST: Create these custom Joi extensions at the top of the file:

─────────────────────────────────────────
CUSTOM JOI EXTENSIONS:
─────────────────────────────────────────

1. validateICD10Code — Joi extension:
   Validates ICD-10 code format: /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/
   Examples: J18.9, I10, Z87.891, M54.5
   Error: "Invalid ICD-10 code format. 
   Example: J18.9 (letter + 2 digits + optional decimal)"

2. validateMRN — Joi extension:
   Validates MRN format: /^MRN-\d{4}-\d{6}$/
   Example: MRN-2024-000123
   Error: "Invalid MRN format. Expected: MRN-YYYY-XXXXXX"

3. validateBloodGroup — Joi extension:
   Validates: exactly one of [A+, A-, B+, B-, O+, O-, AB+, AB-]
   Case sensitive, no variations
   Error: "Blood group must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-"

4. validateS3URL — Joi extension:
   Validates URL contains hospital's S3 domain
   Pattern: must contain process.env.S3_DOMAIN
   Error: "Document URL must be a valid hospital S3 URL"

─────────────────────────────────────────
SCHEMA 1: createMedicalRecordSchema
─────────────────────────────────────────
Fields:
- patientId: Joi.string().uuid().required()
  Error: "Valid patient ID is required"
- bloodGroup: custom validateBloodGroup extension, required
- rhFactor: Joi.string().valid('positive', 'negative').required()
  Error: "Rh factor must be positive or negative"
- allergies: Joi.array().items(
    Joi.object({
      substance: Joi.string().min(2).max(200).required(),
      allergyType: Joi.string().valid(
        'drug', 'food', 'environmental', 
        'latex', 'contrast_dye', 'other').required(),
      reactionType: Joi.string().valid(
        'anaphylaxis', 'urticaria', 'rash', 'angioedema',
        'nausea_vomiting', 'respiratory', 'other').required(),
      severity: Joi.string().valid(
        'mild', 'moderate', 'severe', 'life_threatening').required(),
      onsetDate: Joi.date().max('now').optional()
        .messages({'date.max': 'Allergy onset date cannot be future'}),
      notes: Joi.string().max(300).optional()
    })
  ).max(50).optional().default([])
- chronicConditions: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(200).required(),
      icd10Code: Joi.string().custom(validateICD10).optional(),
      diagnosedDate: Joi.date().max('now').optional(),
      currentStatus: Joi.string()
        .valid('active', 'controlled', 'resolved').required()
    })
  ).max(30).optional().default([])
- familyHistory: Joi.object({
    diabetes: Joi.boolean().default(false),
    hypertension: Joi.boolean().default(false),
    heartDisease: Joi.boolean().default(false),
    cancer: Joi.boolean().default(false),
    mentalIllness: Joi.boolean().default(false),
    kidneyDisease: Joi.boolean().default(false),
    stroke: Joi.boolean().default(false),
    details: Joi.string().max(1000).optional()
  }).optional()
- socialHistory: Joi.object({
    smokingStatus: Joi.string()
      .valid('never', 'former', 'current').optional(),
    alcoholUse: Joi.string()
      .valid('never', 'occasional', 'moderate', 'heavy').optional(),
    occupation: Joi.string().max(100).optional(),
    exerciseFrequency: Joi.string()
      .valid('sedentary', 'light', 'moderate', 'active').optional(),
    dietType: Joi.string()
      .valid('vegetarian', 'non_vegetarian', 'vegan').optional()
  }).optional()

─────────────────────────────────────────
SCHEMA 2: addConsultationRecordSchema
─────────────────────────────────────────
Fields:
- visitType: Joi.string().valid(
    'opd', 'ipd', 'emergency', 'telemedicine',
    'follow_up', 'day_care', 'second_opinion').required()
- visitDate: Joi.date().max('now').required()
  Error: "Visit date cannot be in the future"
- chiefComplaint: Joi.string().min(5).max(500).required()
  Error: "Chief complaint must be between 5 and 500 characters"
- historyOfPresentIllness: Joi.string().min(10).max(5000).required()
  Error: "History of present illness required (min 10 characters)"
- examinationFindings: Joi.string().min(5).max(5000).required()
- diagnosis: Joi.array().items(
    Joi.object({
      icd10Code: Joi.string().custom(validateICD10).optional(),
      description: Joi.string().min(3).max(300).required(),
      type: Joi.string().valid(
        'primary', 'secondary', 
        'comorbidity', 'provisional').required()
    })
  ).min(1).max(10).required()
  Error: "At least one diagnosis is required"
  Validate: exactly ONE entry must have type: 'primary'
  Custom Joi validator: check primary diagnosis count
  Error: "Exactly one primary diagnosis is required"
- treatmentPlan: Joi.string().min(10).max(3000).required()
- prescriptionIds: Joi.array().items(Joi.string().uuid())
    .max(20).optional().default([])
- labOrderIds: Joi.array().items(Joi.string().uuid())
    .max(30).optional().default([])
- followUpRequired: Joi.boolean().required()
- followUpDate: Joi.date().min('now').optional()
  Required when followUpRequired is true:
  Joi.when('followUpRequired', {
    is: true, then: Joi.required(),
    otherwise: Joi.optional()
  })
  Error: "Follow-up date required when follow-up is indicated"
- followUpInstructions: Joi.string().min(5).max(1000)
  Required when followUpRequired is true (same Joi.when pattern)
- appointmentId: Joi.string().uuid().optional()
- referralRequired: Joi.boolean().default(false)
- referralDetails: Joi.string().max(500)
  Required when referralRequired is true
- internalDoctorNotes: Joi.string().max(2000).optional()
  (will be encrypted in service — note in JSDoc)
- consultationDuration: Joi.number().integer().min(1).max(480).optional()

─────────────────────────────────────────
SCHEMA 3: updateConsultationSchema
─────────────────────────────────────────
Fields: same as addConsultationRecordSchema but ALL optional
- Validate: at least one field must be provided
  Joi.object().min(1)
  Error: "At least one field required for consultation update"
- Add version field: Joi.number().integer().min(1).required()
  Error: "Version number required for optimistic locking"

─────────────────────────────────────────
SCHEMA 4: addAddendumSchema
─────────────────────────────────────────
Fields:
- consultationId: from params, uuid
- content: Joi.string().min(10).max(2000).required()
  Error: "Addendum content required (min 10 characters)"
- reason: Joi.string().min(10).max(500).required()
  Error: "Reason for addendum required (min 10 characters)"

─────────────────────────────────────────
SCHEMA 5: updateAllergiesSchema
─────────────────────────────────────────
Fields:
- operation: Joi.string().valid('add', 'update', 'remove').required()
  Error: "Operation must be add, update, or remove"
- allergies: Joi.array().min(1).items(
    Joi.object({
      allergyId: Joi.string().uuid()
        Required for update and remove:
        Joi.when('/operation', {
          is: Joi.valid('update', 'remove'), then: Joi.required(),
          otherwise: Joi.optional()
        })
        Error: "allergyId required for update and remove operations",
      substance: Joi.string().min(2).max(200)
        Required for add operation only,
      allergyType: Joi.string().valid(
        'drug', 'food', 'environmental', 
        'latex', 'contrast_dye', 'other'),
      reactionType: Joi.string().valid(
        'anaphylaxis', 'urticaria', 'rash', 'angioedema',
        'nausea_vomiting', 'respiratory', 'other'),
      severity: Joi.string().valid(
        'mild', 'moderate', 'severe', 'life_threatening'),
      onsetDate: Joi.date().max('now').optional(),
      notes: Joi.string().max(300).optional()
    })
  ).required()
- Add meta flag: SAFETY_CRITICAL: true on this schema
  (picked up by auditMiddleware for enhanced logging)

─────────────────────────────────────────
SCHEMA 6: updateChronicConditionsSchema
─────────────────────────────────────────
Fields:
- operation: Joi.string().valid('add', 'update', 'resolve').required()
- conditions: Joi.array().min(1).items(
    Joi.object({
      conditionId: uuid, required for update/resolve
      name: string min:2 max:200, required for add
      icd10Code: custom validateICD10 optional
      diagnosedDate: date max:now optional
      managingDoctorId: uuid optional
      currentStatus: enum [active, controlled, resolved]
        required for add
      currentMedications: array of strings max:20 optional
      lastReviewDate: date max:now optional
      notes: string max:500 optional
      resolvedDate: date max:now
        required when operation is resolve
      resolvedBy: auto from req.user.id in service
    })
  ).required()

─────────────────────────────────────────
SCHEMA 7: addSurgicalHistorySchema
─────────────────────────────────────────
Fields:
- procedureName: required string min:3 max:300
- procedureCode: optional string max:20
- performedDate: required date max:now
  Error: "Surgery date cannot be in the future"
- hospitalName: required string min:3 max:200
- surgeonName: required string min:2 max:100
- anesthesiaType: required enum
  [general, regional, local, spinal, epidural, none]
- outcome: required enum
  [successful, complicated, incomplete, abandoned]
- complications: optional string max:1000
- implantsPlaced: optional array max:10 items:
  Joi.object({
    type: string required min:3 max:200,
    manufacturer: string required min:2 max:100,
    modelNumber: string required min:2 max:100,
    serialNumber: string required min:2 max:100,
    size: string optional max:50,
    lotNumber: string optional max:50
  })
  Note: implant serialNumbers logged separately — regulatory requirement
- transfusionRequired: boolean default false
- unitsTransfused: integer min:0
  Required when transfusionRequired is true
  Joi.when('transfusionRequired', {is: true, then: Joi.required()})
  Error: "Units transfused required when transfusion is indicated"
- postOpDiagnosis: optional string max:500
- notes: optional string max:1000

─────────────────────────────────────────
SCHEMA 8: uploadDocumentBodySchema (multipart body fields)
─────────────────────────────────────────
Fields:
- documentType: required enum
  [lab_report, radiology, discharge_summary, prescription,
   referral_letter, insurance_document, consent_form,
   legal_document, vaccination_record, operative_note,
   pathology_report, imaging_cd, correspondence,
   psychiatric_assessment, hiv_test_result, other]
- title: required string min:3 max:200
  Error: "Document title required (3-200 characters)"
- description: optional string max:500
- tags: optional array of strings max:10
  each tag: string min:2 max:50
- documentDate: optional date, cannot be future
  Error: "Document date cannot be in the future"
- isConfidential: optional boolean default false
  Auto-set to true if documentType in
  [psychiatric_assessment, hiv_test_result, legal_document]
  (done in validator via Joi.when)
- Note: actual file validated by upload.middleware.js (MIME + size)
  This schema
Claude Sonnet 4.6
complete this src/modules/medical-records/medicalRecord.validator.js & all insurance 4 files


Thought Process
expand
✅ Medical Records Validator (Complete) + All 4 Insurance Module Prompts
📋 MEDICAL RECORDS MODULE
src/modules/medical-records/medicalRecord.validator.js — COMPLETE
text
You are a clinical health information validation specialist with 
expertise in medical data standards (ICD-10, HL7, FHIR). Build 
production-grade Joi validation schemas for all medical records 
module endpoints in a Hospital Management System.

Tech stack context:
- Joi v17+ for schema validation
- Node.js + Express.js backend
- All schemas exported as named exports
- Used by validate() middleware from validation.middleware.js
- Custom Joi extensions for medical-specific formats
- abortEarly: false on ALL schemas (collect all errors)
- stripUnknown: true on ALL schemas (prevent mass assignment)
- All schemas include JSDoc with @description and @phi-sensitive tags

─────────────────────────────────────────
STEP 1: CREATE CUSTOM JOI EXTENSIONS
─────────────────────────────────────────

Create and export these custom Joi extensions first.
Use Joi.extend() pattern for each:

Extension 1 — validateICD10Code:
  Method name: .icd10()
  Validates format: /^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$/
  Valid examples: J18.9, I10, Z87.891, M54.5, F32.1, A00
  Invalid examples: j18.9 (lowercase), 123 (no letter), AB1 (wrong pattern)
  Error message: "Invalid ICD-10 code. 
    Format: Letter + 2 digits + optional decimal (e.g., J18.9, I10)"

Extension 2 — validateMRN:
  Method name: .mrn()
  Validates format: /^MRN-\d{4}-\d{6}$/
  Valid example: MRN-2024-000123
  Error message: "Invalid MRN format. Expected: MRN-YYYY-XXXXXX 
    (e.g., MRN-2024-000123)"

Extension 3 — validateBloodGroup:
  Method name: .bloodGroup()
  Validates strict enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-']
  Case sensitive — must match exactly
  Error message: "Blood group must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-"

Extension 4 — validateS3URL:
  Method name: .s3url()
  Validates URL starts with https:// and contains amazonaws.com
  Or matches configured S3 domain from process.env.S3_DOMAIN
  Error message: "Document URL must be a valid S3 URL"

Extension 5 — validateTimeHHMM:
  Method name: .timeHHMM()
  Validates: /^([01]\d|2[0-3]):([0-5]\d)$/
  Error message: "Time must be in HH:MM 24-hour format (e.g., 09:30, 14:00)"

─────────────────────────────────────────
STEP 2: CREATE ALL VALIDATION SCHEMAS
─────────────────────────────────────────

SCHEMA 1: createMedicalRecordSchema
@description Validates initial medical record creation on patient registration
@phi-sensitive Contains blood group, allergies, medical conditions

Fields with exact Joi definitions:
- patientId: Joi.string().uuid().required()
    .messages({'string.uuid': 'Valid patient ID (UUID) is required',
               'any.required': 'Patient ID is required'})

- bloodGroup: use custom .bloodGroup() extension, required
    .messages({'any.required': 'Blood group is required'})

- rhFactor: Joi.string().valid('positive', 'negative').required()
    .messages({'any.only': 'Rh factor must be positive or negative',
               'any.required': 'Rh factor is required'})

- allergies: Joi.array().items(
    Joi.object({
      substance: Joi.string().trim().min(2).max(200).required()
        .messages({'string.min': 'Allergen name must be at least 2 characters',
                   'any.required': 'Allergen substance name is required'}),
      allergyType: Joi.string().valid(
        'drug', 'food', 'environmental',
        'latex', 'contrast_dye', 'other').required()
        .messages({'any.only': 'Invalid allergy type',
                   'any.required': 'Allergy type is required'}),
      reactionType: Joi.string().valid(
        'anaphylaxis', 'urticaria', 'rash', 'angioedema',
        'nausea_vomiting', 'respiratory', 'other').required()
        .messages({'any.only': 'Invalid reaction type',
                   'any.required': 'Reaction type is required'}),
      severity: Joi.string().valid(
        'mild', 'moderate', 'severe', 'life_threatening').required()
        .messages({'any.only': 'Severity must be mild, moderate, severe, or life_threatening',
                   'any.required': 'Allergy severity is required'}),
      onsetDate: Joi.date().max('now').optional()
        .messages({'date.max': 'Allergy onset date cannot be in the future'}),
      notes: Joi.string().trim().max(300).optional()
    })
  ).max(50).optional().default([])
    .messages({'array.max': 'Maximum 50 allergies can be recorded'})

- chronicConditions: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(2).max(200).required()
        .messages({'any.required': 'Condition name is required'}),
      icd10Code: Joi.string().custom(validateICD10).optional(),
      diagnosedDate: Joi.date().max('now').optional()
        .messages({'date.max': 'Diagnosis date cannot be in the future'}),
      currentStatus: Joi.string()
        .valid('active', 'controlled', 'resolved').required()
        .messages({'any.only': 'Status must be active, controlled, or resolved',
                   'any.required': 'Condition status is required'})
    })
  ).max(30).optional().default([])

- familyHistory: Joi.object({
    diabetes: Joi.boolean().default(false),
    hypertension: Joi.boolean().default(false),
    heartDisease: Joi.boolean().default(false),
    cancer: Joi.boolean().default(false),
    mentalIllness: Joi.boolean().default(false),
    kidneyDisease: Joi.boolean().default(false),
    stroke: Joi.boolean().default(false),
    thyroidDisease: Joi.boolean().default(false),
    details: Joi.string().trim().max(1000).optional()
  }).optional()
  Note: @phi-sensitive — family history is protected health information

- socialHistory: Joi.object({
    smokingStatus: Joi.string()
      .valid('never', 'former', 'current').optional(),
    smokingPackYears: Joi.number().min(0).max(200).optional()
      (required when smokingStatus is 'current' or 'former')
      Joi.when('smokingStatus', {
        is: Joi.valid('current', 'former'),
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      }),
    alcoholUse: Joi.string()
      .valid('never', 'occasional', 'moderate', 'heavy').optional(),
    occupation: Joi.string().trim().max(100).optional(),
    exerciseFrequency: Joi.string()
      .valid('sedentary', 'light', 'moderate', 'active').optional(),
    dietType: Joi.string()
      .valid('vegetarian', 'non_vegetarian', 'vegan').optional()
  }).optional()
  Note: @phi-sensitive — social history is protected health information

Schema options: { abortEarly: false, stripUnknown: true }

─────────────────────────────────────────
SCHEMA 2: addConsultationRecordSchema
@description Validates new consultation/visit record creation by doctor
@phi-sensitive Full clinical data including diagnosis and treatment
─────────────────────────────────────────
Fields:
- visitType: Joi.string().valid(
    'opd', 'ipd', 'emergency', 'telemedicine',
    'follow_up', 'day_care', 'second_opinion').required()
    .messages({'any.only': 'Visit type must be one of: opd, ipd, emergency,
     telemedicine, follow_up, day_care, second_opinion',
               'any.required': 'Visit type is required'})

- visitDate: Joi.date().max('now').required()
    .messages({'date.max': 'Visit date cannot be in the future',
               'any.required': 'Visit date is required'})

- chiefComplaint: Joi.string().trim().min(5).max(500).required()
    .messages({'string.min': 'Chief complaint must be at least 5 characters',
               'string.max': 'Chief complaint cannot exceed 500 characters',
               'any.required': 'Chief complaint is required'})

- historyOfPresentIllness: Joi.string().trim().min(10).max(5000).required()
    .messages({'string.min': 'History of present illness requires
     minimum 10 characters',
               'any.required': 'History of present illness is required'})

- examinationFindings: Joi.string().trim().min(5).max(5000).required()
    .messages({'string.min': 'Examination findings require
     minimum 5 characters',
               'any.required': 'Examination findings are required'})

- diagnoses: Joi.array().items(
    Joi.object({
      icd10Code: Joi.string().custom(validateICD10).optional()
        .messages({'string.custom': 'Invalid ICD-10 code format'}),
      description: Joi.string().trim().min(3).max(300).required()
        .messages({'any.required': 'Diagnosis description is required'}),
      type: Joi.string().valid(
        'primary', 'secondary',
        'comorbidity', 'provisional').required()
        .messages({'any.only': 'Diagnosis type must be primary, secondary,
         comorbidity, or provisional',
                   'any.required': 'Diagnosis type is required'})
    })
  ).min(1).max(10).required()
  .custom((diagnoses, helpers) => {
    const primaryCount = diagnoses.filter(d => d.type === 'primary').length
    if (primaryCount === 0) {
      return helpers.error('any.custom', {
        message: 'At least one primary diagnosis is required'
      })
    }
    if (primaryCount > 1) {
      return helpers.error('any.custom', {
        message: 'Only one primary diagnosis is allowed per consultation'
      })
    }
    return diagnoses
  })
  .messages({'array.min': 'At least one diagnosis is required',
             'array.max': 'Maximum 10 diagnoses per consultation',
             'any.required': 'Diagnosis is required'})

- treatmentPlan: Joi.string().trim().min(10).max(3000).required()
    .messages({'string.min': 'Treatment plan requires minimum 10 characters',
               'any.required': 'Treatment plan is required'})

- prescriptionIds: Joi.array()
    .items(Joi.string().uuid()).max(20).optional().default([])

- labOrderIds: Joi.array()
    .items(Joi.string().uuid()).max(30).optional().default([])

- followUpRequired: Joi.boolean().required()
    .messages({'any.required': 'Please indicate if follow-up is required'})

- followUpDate: Joi.date().min('now')
    .when('followUpRequired', {
      is: true,
      then: Joi.required()
        .messages({'any.required': 'Follow-up date is required
         when follow-up is indicated',
                   'date.min': 'Follow-up date must be in the future'}),
      otherwise: Joi.optional()
    })

- followUpInstructions: Joi.string().trim().min(5).max(1000)
    .when('followUpRequired', {
      is: true,
      then: Joi.required()
        .messages({'any.required': 'Follow-up instructions required
         when follow-up is indicated'}),
      otherwise: Joi.optional()
    })

- appointmentId: Joi.string().uuid().optional()
    .messages({'string.uuid': 'Valid appointment ID (UUID) required'})

- referralRequired: Joi.boolean().default(false)

- referralDetails: Joi.string().trim().max(500)
    .when('referralRequired', {
      is: true,
      then: Joi.required()
        .messages({'any.required': 'Referral details required
         when referral is indicated'}),
      otherwise: Joi.optional()
    })

- internalDoctorNotes: Joi.string().trim().max(2000).optional()
  Note in JSDoc: @encrypted This field will be encrypted at rest in service
  Note in JSDoc: @restricted Only authoring doctor can read this field

- consultationDuration: Joi.number()
    .integer().min(1).max(480).optional()
    .messages({'number.max': 'Consultation duration cannot exceed 480 minutes'})

Schema options: { abortEarly: false, stripUnknown: true }

─────────────────────────────────────────
SCHEMA 3: updateConsultationSchema
@description Validates consultation update (24-hour window only)
─────────────────────────────────────────
Fields:
- All fields from addConsultationRecordSchema BUT all optional
- version: Joi.number().integer().min(1).required()
  .messages({'any.required': 'Version number required for update
   (prevents concurrent edit conflicts)',
             'number.integer': 'Version must be a whole number'})
- Validate at schema level: at least one field besides version
  must be provided:
  Joi.object().custom((value, helpers) => {
    const { version, ...rest } = value
    if (Object.keys(rest).length === 0) {
      return helpers.error('object.min', {
        message: 'At least one field must be provided for update'
      })
    }
    return value
  })
- diagnoses: same validation as create including primary count check

─────────────────────────────────────────
SCHEMA 4: addAddendumSchema
@description Validates consultation addendum after 24-hour lock
─────────────────────────────────────────
Fields:
- content: Joi.string().trim().min(10).max(2000).required()
    .messages({'string.min': 'Addendum content must be
     at least 10 characters',
               'string.max': 'Addendum content cannot exceed 2000 characters',
               'any.required': 'Addendum content is required'})

- reason: Joi.string().trim().min(10).max(500).required()
    .messages({'string.min': 'Reason for addendum must be
     at least 10 characters',
               'any.required': 'Reason for addendum is required
               (required for medico-legal compliance)'})

Schema options: { abortEarly: false, stripUnknown: true }

─────────────────────────────────────────
SCHEMA 5: updateAllergiesSchema
@description Validates allergy add/update/remove operations
@phi-sensitive SAFETY_CRITICAL — allergy changes can affect prescriptions
─────────────────────────────────────────
Fields:
- operation: Joi.string().valid('add', 'update', 'remove').required()
    .messages({'any.only': 'Operation must be add, update, or remove',
               'any.required': 'Operation type is required'})

- allergies: Joi.array().min(1).items(
    Joi.object({
      allergyId: Joi.string().uuid()
        .when(Joi.ref('/operation'), {
          is: Joi.valid('update', 'remove'),
          then: Joi.required()
            .messages({'any.required': 'allergyId is required
             for update and remove operations'}),
          otherwise: Joi.optional()
        }),
      substance: Joi.string().trim().min(2).max(200)
        .when(Joi.ref('/operation'), {
          is: 'add',
          then: Joi.required()
            .messages({'any.required': 'Allergen substance name
             is required for add operation'}),
          otherwise: Joi.optional()
        }),
      allergyType: Joi.string().valid(
        'drug', 'food', 'environmental',
        'latex', 'contrast_dye', 'other')
        .when(Joi.ref('/operation'), {
          is: 'add', then: Joi.required(),
          otherwise: Joi.optional()
        }),
      reactionType: Joi.string().valid(
        'anaphylaxis', 'urticaria', 'rash', 'angioedema',
        'nausea_vomiting', 'respiratory', 'other')
        .when(Joi.ref('/operation'), {
          is: 'add', then: Joi.required(),
          otherwise: Joi.optional()
        }),
      severity: Joi.string().valid(
        'mild', 'moderate', 'severe', 'life_threatening')
        .when(Joi.ref('/operation'), {
          is: 'add', then: Joi.required(),
          otherwise: Joi.optional()
        }),
      onsetDate: Joi.date().max('now').optional(),
      notes: Joi.string().trim().max(300).optional()
    })
  ).required()
  .messages({'array.min': 'At least one allergy entry is required',
             'any.required': 'Allergies array is required'})

Add schema-level meta:
  schema.meta({ SAFETY_CRITICAL: true, PHI_SENSITIVE: true })

─────────────────────────────────────────
SCHEMA 6: updateChronicConditionsSchema
@description Validates chronic condition add/update/resolve
─────────────────────────────────────────
Fields:
- operation: Joi.string().valid('add', 'update', 'resolve').required()
    .messages({'any.only': 'Operation must be add, update, or resolve'})

- conditions: Joi.array().min(1).items(
    Joi.object({
      conditionId: Joi.string().uuid()
        .when(Joi.ref('/operation'), {
          is: Joi.valid('update', 'resolve'),
          then: Joi.required()
            .messages({'any.required': 'conditionId required
             for update and resolve'}),
          otherwise: Joi.optional()
        }),
      name: Joi.string().trim().min(2).max(200)
        .when(Joi.ref('/operation'), {
          is: 'add', then: Joi.required(),
          otherwise: Joi.optional()
        }),
      icd10Code: Joi.string().custom(validateICD10).optional(),
      diagnosedDate: Joi.date().max('now').optional()
        .messages({'date.max': 'Diagnosis date cannot be future'}),
      managingDoctorId: Joi.string().uuid().optional(),
      currentStatus: Joi.string()
        .valid('active', 'controlled', 'resolved')
        .when(Joi.ref('/operation'), {
          is: 'add', then: Joi.required(),
          otherwise: Joi.optional()
        }),
      currentMedications: Joi.array()
        .items(Joi.string().trim().max(200)).max(20).optional(),
      lastReviewDate: Joi.date().max('now').optional(),
      notes: Joi.string().trim().max(500).optional(),
      resolvedDate: Joi.date().max('now')
        .when(Joi.ref('/operation'), {
          is: 'resolve',
          then: Joi.required()
            .messages({'any.required': 'Resolved date required
             when resolving condition'}),
          otherwise: Joi.forbidden()
        })
    })
  ).required()

─────────────────────────────────────────
SCHEMA 7: addSurgicalHistorySchema
@description Validates past surgical procedure entry
@phi-sensitive Contains procedure details, implants, transfusions
─────────────────────────────────────────
Fields:
- procedureName: Joi.string().trim().min(3).max(300).required()
    .messages({'string.min': 'Procedure name must be
     at least 3 characters',
               'any.required': 'Procedure name is required'})

- procedureCode: Joi.string().trim().max(20).optional()
  Note in JSDoc: Accepts CPT or ICD-10-PCS procedure codes

- performedDate: Joi.date().max('now').required()
    .messages({'date.max': 'Surgery date cannot be in the future',
               'any.required': 'Surgery date is required'})

- hospitalName: Joi.string().trim().min(3).max(200).required()
    .messages({'any.required': 'Hospital name is required'})

- surgeonName: Joi.string().trim().min(2).max(100).required()
    .messages({'any.required': 'Surgeon name is required'})

- anesthesiaType: Joi.string().valid(
    'general', 'regional', 'local',
    'spinal', 'epidural', 'none').required()
    .messages({'any.only': 'Invalid anesthesia type',
               'any.required': 'Anesthesia type is required'})

- outcome: Joi.string().valid(
    'successful', 'complicated',
    'incomplete', 'abandoned').required()
    .messages({'any.only': 'Outcome must be successful, complicated,
     incomplete, or abandoned',
               'any.required': 'Procedure outcome is required'})

- complications: Joi.string().trim().max(1000).optional()

- implantsPlaced: Joi.array().items(
    Joi.object({
      type: Joi.string().trim().min(3).max(200).required()
        .messages({'any.required': 'Implant type is required'}),
      manufacturer: Joi.string().trim().min(2).max(100).required()
        .messages({'any.required': 'Implant manufacturer is required'}),
      modelNumber: Joi.string().trim().min(2).max(100).required()
        .messages({'any.required': 'Implant model number is required
         (required for device recall tracking)'}),
      serialNumber: Joi.string().trim().min(2).max(100).required()
        .messages({'any.required': 'Implant serial number is required
         (required for device recall tracking — regulatory requirement)'}),
      size: Joi.string().trim().max(50).optional(),
      lotNumber: Joi.string().trim().max(50).optional()
    })
  ).max(10).optional().default([])
  Note in JSDoc: @regulatory Implant serial numbers stored permanently
  for medical device recall compliance

- transfusionRequired: Joi.boolean().default(false)

- unitsTransfused: Joi.number().integer().min(0).max(50)
    .when('transfusionRequired', {
      is: true,
      then: Joi.required()
        .messages({'any.required': 'Units transfused required
         when transfusion was given'}),
      otherwise: Joi.optional()
    })

- postOpDiagnosis: Joi.string().trim().max(500).optional()
- dischargeDate: Joi.date().max('now').optional()
- notes: Joi.string().trim().max(1000).optional()

─────────────────────────────────────────
SCHEMA 8: addVaccinationRecordSchema
@description Validates vaccination record entry
─────────────────────────────────────────
Fields:
- vaccineName: Joi.string().trim().min(2).max(200).required()
    .messages({'any.required': 'Vaccine name is required'})

- manufacturer: Joi.string().trim().max(100).optional()

- batchNumber: Joi.string().trim().max(50).optional()
  Note in JSDoc: Required for adverse reaction reporting to AEFI system

- administeredDate: Joi.date().max('now').required()
    .messages({'date.max': 'Vaccination date cannot be in the future',
               'any.required': 'Vaccination date is required'})

- administeredByDoctorId: Joi.string().uuid().optional()
  Note: if administered in this hospital, provide doctorId

- administeredByName: Joi.string().trim().max(100).optional()
  Note: if administered outside hospital, provide name as string

- site: Joi.string().valid(
    'left_deltoid', 'right_deltoid',
    'left_thigh', 'right_thigh',
    'oral', 'intranasal', 'other').optional()

- doseNumber: Joi.number().integer().min(1).max(10).required()
    .messages({'any.required': 'Dose number is required (e.g., 1 for first dose)',
               'number.max': 'Dose number cannot exceed 10'})

- doseType: Joi.string().valid(
    'primary', 'booster', 'annual').required()
    .messages({'any.only': 'Dose type must be primary, booster, or annual',
               'any.required': 'Dose type is required'})

- nextDueDate: Joi.date().min('now').optional()
    .messages({'date.min': 'Next due date must be in the future'})

- adverseReaction: Joi.string().trim().max(500).optional()
  Note in JSDoc: Document any adverse reactions observed

- vaccinationCertificateUrl: Joi.string().custom(validateS3URL).optional()

─────────────────────────────────────────
SCHEMA 9: uploadDocumentBodySchema
@description Validates multipart form body fields for document upload
Note: Actual file (MIME type, size) validated by upload.middleware.js
─────────────────────────────────────────
Fields:
- documentType: Joi.string().valid(
    'lab_report', 'radiology', 'discharge_summary',
    'prescription', 'referral_letter', 'insurance_document',
    'consent_form', 'legal_document', 'vaccination_record',
    'operative_note', 'pathology_report', 'imaging_cd',
    'correspondence', 'psychiatric_assessment',
    'hiv_test_result', 'other').required()
    .messages({'any.only': 'Invalid document type',
               'any.required': 'Document type is required'})

- title: Joi.string().trim().min(3).max(200).required()
    .messages({'string.min': 'Document title must be
     at least 3 characters',
               'any.required': 'Document title is required'})

- description: Joi.string().trim().max(500).optional()

- tags: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .max(10).optional().default([])
    .messages({'array.max': 'Maximum 10 tags allowed'})

- documentDate: Joi.date().max('now').optional()
    .messages({'date.max': 'Document date cannot be in the future'})

- isConfidential: Joi.boolean()
  Use Joi.when() to auto-set true for sensitive document types:
  .when('documentType', {
    is: Joi.valid('psychiatric_assessment', 'hiv_test_result',
      'legal_document', 'consent_form'),
    then: Joi.boolean().default(true)
      .messages({'any.base': 'This document type is automatically
       marked confidential'}),
    otherwise: Joi.boolean().default(false)
  })
  Add note in JSDoc: Confidential documents restricted to treating doctor + admin

─────────────────────────────────────────
SCHEMA 10: grantAccessSchema
@description Validates patient granting medical record access to doctor
─────────────────────────────────────────
Fields:
- grantedToUserId: Joi.string().uuid().required()
    .messages({'string.uuid': 'Valid user ID (UUID) is required',
               'any.required': 'User ID to grant access to is required'})

- accessLevel: Joi.string().valid(
    'full', 'clinical_only', 'specific_documents').required()
    .messages({'any.only': 'Access level must be full,
     clinical_only, or specific_documents',
               'any.required': 'Access level is required'})

- specificDocumentIds: Joi.array()
    .items(Joi.string().uuid()).min(1).max(50)
    .when('accessLevel', {
      is: 'specific_documents',
      then: Joi.required()
        .messages({'any.required': 'Document IDs required when
         access level is specific_documents'}),
      otherwise: Joi.forbidden()
        .messages({'any.unknown': 'specificDocumentIds only allowed
         when accessLevel is specific_documents'})
    })

- expiresAt: Joi.date().min('now')
    .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).required()
    .messages({'date.min': 'Access expiry must be in the future',
               'date.max': 'Access cannot be granted for more than 1 year',
               'any.required': 'Access expiry date is required'})

- purpose: Joi.string().trim().min(10).max(300).required()
    .messages({'string.min': 'Purpose must be at least 10 characters',
               'any.required': 'Purpose for access grant is required
               (stored for audit and compliance)'})

- consentConfirmed: Joi.boolean().valid(true).required()
    .messages({'any.only': 'Patient consent must be explicitly confirmed',
               'any.required': 'Consent confirmation is required'})
  Note: Must be strict boolean true — truthy strings not accepted

─────────────────────────────────────────
SCHEMA 11: medicalHistoryQuerySchema (query params)
@description Validates GET query params for medical history listing
─────────────────────────────────────────
Fields:
- startDate: Joi.date().optional()
- endDate: Joi.date().min(Joi.ref('startDate')).optional()
    .messages({'date.min': 'End date must be after start date'})
  Custom validator: if both provided, max range 365 days
  Joi.custom((value, helpers) => {
    const { startDate, endDate } = helpers.state.ancestors[0]
    if (startDate && endDate) {
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24)
      if (diffDays > 365) return helpers.error('any.custom',
        {message: 'Medical history date range cannot exceed 365 days'})
    }
    return value
  })
- visitType: Joi.alternatives().try(
    Joi.string().valid('opd','ipd','emergency',
      'telemedicine','follow_up','day_care','second_opinion'),
    Joi.array().items(Joi.string().valid('opd','ipd','emergency',
      'telemedicine','follow_up','day_care','second_opinion'))
  ).optional()
- doctorId: Joi.string().uuid().optional()
- diagnosisCode: Joi.string().custom(validateICD10).optional()
- page: Joi.number().integer().min(1).default(1)
- limit: Joi.number().integer().min(5).max(50).default(20)
    .messages({'number.max': 'Maximum 50 records per page'})
- sortBy: Joi.string()
    .valid('visitDate', 'doctor', 'visitType').default('visitDate')
- sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')

─────────────────────────────────────────
SCHEMA 12: timelineQuerySchema (query params)
@description Validates cursor-based timeline pagination params
─────────────────────────────────────────
Fields:
- cursor: Joi.string().optional()
  Note: base64 encoded cursor from previous response
- limit: Joi.number().integer().min(5).max(50).default(20)
- startDate: Joi.date().optional()
- endDate: Joi.date().optional()
  Validate: endDate after startDate if both provided
- eventTypes: Joi.alternatives().try(
    Joi.string().valid('consultation', 'admission', 'procedure',
      'lab_test', 'prescription', 'document',
      'vaccination', 'allergy_update'),
    Joi.array().items(Joi.string().valid('consultation', 'admission',
      'procedure', 'lab_test', 'prescription', 'document',
      'vaccination', 'allergy_update'))
  ).optional()

─────────────────────────────────────────
SCHEMA 13: auditTrailQuerySchema (query params)
@description Validates PHI audit trail query params — admin only
─────────────────────────────────────────
Fields:
- startDate: Joi.date().required()
    .messages({'any.required': 'Start date is required for audit query'})
- endDate: Joi.date().min(Joi.ref('startDate')).required()
    .messages({'any.required': 'End date is required',
               'date.min': 'End date must be after start date'})
  Max range: 90 days
- accessorId: Joi.string().uuid().optional()
- accessorRole: Joi.string().valid(
    'SUPER_ADMIN','ADMIN','DOCTOR','NURSE',
    'PHARMACIST','LAB_TECHNICIAN','RECEPTIONIST',
    'ACCOUNTANT','STAFF','PATIENT').optional()
- action: Joi.string().valid(
    'PHI_ACCESS', 'CONSULTATION_RECORD_ADDED',
    'CONSULTATION_RECORD_UPDATED', 'ALLERGIES_UPDATED',
    'DOCUMENT_UPLOADED', 'DOCUMENT_DOWNLOAD_URL_GENERATED',
    'RECORD_ACCESS_GRANTED', 'RECORD_ACCESS_REVOKED',
    'MEDICAL_RECORD_CREATED', 'SURGICAL_HISTORY_ADDED',
    'VACCINATION_RECORD_ADDED', 'PATIENT_TIMELINE_ACCESSED').optional()
- onlyHighRisk: Joi.boolean().default(false)
  When true: return only SAFETY_CRITICAL flagged events
- page: Joi.number().integer().min(1).default(1)
- limit: Joi.number().integer().min(10).max(100).default(50)

─────────────────────────────────────────
SCHEMA 14: documentListQuerySchema (query params)
─────────────────────────────────────────
Fields:
- documentType: Joi.string().valid(all document type enums).optional()
- startDate: Joi.date().optional()
- endDate: Joi.date().optional()
- uploadedBy: Joi.string().uuid().optional()
- isConfidential: Joi.boolean().optional()
  Note: service enforces role-based confidential filtering
- tags: Joi.array().items(Joi.string()).max(5).optional()
- page: Joi.number().integer().min(1).default(1)
- limit: Joi.number().integer().min(5).max(50).default(20)

─────────────────────────────────────────
SCHEMA 15: updateDocumentMetadataSchema
─────────────────────────────────────────
Fields:
- title: Joi.string().trim().min(3).max(200).optional()
- description: Joi.string().trim().max(500).optional()
- tags: Joi.array().items(Joi.string().trim().max(50)).max(10).optional()
- documentType: Joi.string().valid(all document types).optional()
- isConfidential: Joi.boolean().optional()
- Validate: at least one field provided
  Joi.object().custom() check Object.keys(value).length > 0

─────────────────────────────────────────
SCHEMA 16: searchByMRNSchema (query params)
─────────────────────────────────────────
Fields:
- mrn: Joi.string().custom(validateMRN).required()
    .messages({'any.required': 'MRN is required for search',
               'string.custom': 'Invalid MRN format.
               Expected: MRN-YYYY-XXXXXX'})

─────────────────────────────────────────
SCHEMA 17: exportQuerySchema (query params)
─────────────────────────────────────────
Fields:
- format: Joi.string().valid('pdf', 'json').default('json')
    .messages({'any.only': 'Export format must be pdf or json'})
- includeDocuments: Joi.boolean().default(false)
  Note: including documents makes export very large
- sections: Joi.array().items(Joi.string().valid(
    'consultations', 'allergies', 'chronic_conditions',
    'surgical_history', 'vaccinations', 'family_history',
    'social_history', 'timeline', 'documents'
  )).optional()
  Note: if not provided, all sections included

─────────────────────────────────────────
FINAL REQUIREMENTS:
─────────────────────────────────────────

Export ALL schemas as named exports:
export {
  createMedicalRecordSchema,
  addConsultationRecordSchema,
  updateConsultationSchema,
  addAddendumSchema,
  updateAllergiesSchema,
  updateChronicConditionsSchema,
  addSurgicalHistorySchema,
  addVaccinationRecordSchema,
  uploadDocumentBodySchema,
  grantAccessSchema,
  medicalHistoryQuerySchema,
  timelineQuerySchema,
  auditTrailQuerySchema,
  documentListQuerySchema,
  updateDocumentMetadataSchema,
  searchByMRNSchema,
  exportQuerySchema
}

Also export custom Joi extensions as named exports:
export { validateICD10Code, validateMRN, validateBloodGroup,
  validateS3URL, validateTimeHHMM }

Add JSDoc above every schema:
@description — what the schema validates
@usedBy — which controller method uses this schema
@phi-sensitive — if schema contains PHI fields
@safety-critical — if schema is allergy/medication related

All schemas must use:
{ abortEarly: false, stripUnknown: true }
🛡️ INSURANCE MODULE — ALL 4 FILES
src/modules/insurance/insurance.service.js
text
You are a senior healthcare insurance and TPA integration engineer. 
Build a complete, production-grade insurance management service for 
a Hospital Management System using Node.js, Sequelize ORM, MySQL, 
Redis caching, AWS S3, and Bull queues.

Tech stack context:
- Node.js + Express.js backend
- Sequelize ORM with MySQL database
- Redis via ioredis for caching and distributed locks
- AWS S3 SDK v3 via s3.util.js for document storage
- encryption.util.js for sensitive field encryption
- notification.service.js for alerts and emails
- pdf.util.js for claim document generation
- Bull queues via scheduler.util.js for async jobs
- decimal.js for all financial calculations
- Winston logger via logger.util.js

Implement ALL of the following service functions with
complete business logic, transactions, error handling,
Redis caching, and inline comments:

─────────────────────────────────────────
FUNCTION 1: addInsuranceProvider(providerData, createdBy)
─────────────────────────────────────────
Business logic:
- Validate GSTIN format using regex AND checksum algorithm:
  Step 1: First 2 digits = state code (01-37 valid)
  Step 2: Characters 3-12 = PAN number (validate PAN format)
  Step 3: Character 13 = entity number (1-9, A-Z)
  Step 4: Character 14 = always 'Z'
  Step 5: Character 15 = checksum (calculate and validate)
  Throw ValidationError with field-level detail if invalid
- Validate PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
- Validate IFSC (if provided): /^[A-Z]{4}0[A-Z0-9]{6}$/
- Check duplicate: same providerName + same GSTIN = ConflictError
- Auto-generate Provider Code: 
  Format: INS-{TYPE_PREFIX}-{YEAR}-{SEQUENCE}
  Type prefixes: IC (insurance_company), TP (tpa),
    GS (government_scheme), CR (corporate_self_insurance)
  Sequence: Redis INCR hms:insurance:provider:counter TTL: none
  Example: INS-IC-2024-0001
- Encrypt bank details using encryptField() from encryption.util.js
- Upload empanelment document to S3 if provided
- Create empanelment expiry reminder:
  Schedule Bull job to fire 30 days before empanelmentValidTill
  Store Bull jobId in provider record for cancellation on update
- Set default claim workflow settings
- Send welcome email to provider's claimEmail
- Cache provider: hms:insurance:providers:{providerId} TTL: 2hr
- Invalidate provider list cache: DEL hms:insurance:providers:list:*
- Create audit log: INSURANCE_PROVIDER_ADDED
- Wrap in Sequelize transaction
- Return: created provider (bank details excluded from response)

─────────────────────────────────────────
FUNCTION 2: updateInsuranceProvider(providerId, updateData, updatedBy)
─────────────────────────────────────────
Business logic:
- Fetch existing provider, validate exists and isActive
- If GSTIN changes: full GSTIN checksum validation on new value
- If empanelmentValidTill changes:
  Cancel old expiry reminder Bull job (using stored jobId)
  Schedule new Bull job for new date - 30 days
  Update jobId in record
- Track changed fields with before/after values
- Encrypt bank details if updated
- Invalidate Redis cache:
  DEL hms:insurance:providers:{providerId}
  DEL hms:insurance:providers:list:*
- Create audit log: INSURANCE_PROVIDER_UPDATED with diff
- Return: updated provider

─────────────────────────────────────────
FUNCTION 3: addPatientInsurance(patientId, insuranceData, addedBy)
─────────────────────────────────────────
Business logic:
- Validate patientId exists in patients table
- Validate providerId exists and is active and not blacklisted
- Validate empanelment is still valid:
  If provider.empanelmentValidTill < today: throw ValidationError
  "Insurance provider empanelment has expired"
- Check for duplicate:
  Same patient + same policyNumber + same provider = ConflictError
  "This policy number is already registered for this patient"
- Validate policy dates:
  validFrom <= today (cannot be future-dated)
  validTill > validFrom
- Upload insurance card images to S3 if provided:
  Front: insurance/{patientId}/card-front-{uuid}.jpg
  Back: insurance/{patientId}/card-back-{uuid}.jpg
- If policy expires within 60 days of today:
  Schedule reminder notification to patient + admin
- Check if patient already has active insurance for same provider:
  If yes: warn but allow (family floater + individual both valid)
- Create policy record with: all fields + isActive: true
- Cache: hms:insurance:patient:{patientId} TTL: 30min
  (list of all patient's insurances)
- Send confirmation SMS to patient:
  "Insurance {policyNumber} registered. Valid till {validTill}"
- Create audit log: PATIENT_INSURANCE_ADDED
- Return: created insurance record

─────────────────────────────────────────
FUNCTION 4: verifyInsuranceEligibility(patientId, providerId, serviceDate, serviceType)
─────────────────────────────────────────
Business logic:
- Check Redis cache first:
  key: hms:insurance:eligibility:{patientId}:{providerId}:{serviceDate}
  TTL: 30 minutes
  Return cached if found
- Query patient's active insurance for this provider:
  WHERE patientId = X AND providerId = Y AND isActive = true
  AND validFrom <= serviceDate AND validTill >= serviceDate
- If no active policy found:
  Return: {eligible: false, reason: 'NO_ACTIVE_POLICY',
    message: 'No active insurance found for this provider on service date'}
- Check provider empanelment validity on serviceDate:
  If provider.empanelmentValidTill < serviceDate:
    Return: {eligible: false, reason: 'PROVIDER_NOT_EMPANELED'}
- Check if serviceType is excluded:
  Query provider.coveredProcedures and patient policy exclusions
  If service in exclusions:
    Return: {eligible: false, reason: 'SERVICE_EXCLUDED',
      excludedService: serviceType}
- Calculate coverage details:
  {
    eligible: true,
    policyNumber: string,
    sumInsured: integer (paise),
    remainingCoverage: integer (paise) [sumInsured - claimed this year],
    copayPercentage: number,
    deductibleAmount: integer,
    preAuthRequired: boolean,
    roomRentCap: integer (null = no cap),
    icuRentCap: integer,
    coverageDetails: {serviceType, isCovered, estimatedCoverage},
    warnings: [] (e.g., policy expiring soon, low remaining coverage)
  }
- Cache result: hms:insurance:eligibility:{...} TTL: 30min
- Return: eligibility object

─────────────────────────────────────────
FUNCTION 5: createPreAuthorization(patientId, preAuthData, requestedBy)
─────────────────────────────────────────
Business logic:
- Validate patient has active insurance with the provider
  (call verifyInsuranceEligibility internally)
- Validate provider empanelment is valid
- Validate patient's policy covers the planned procedures
  (check against provider.coveredProcedures)
- Check for existing active pre-auth for same admission:
  If preAuthRequired and active preAuth exists: throw ConflictError
- Auto-generate pre-auth reference number:
  Format: PREAUTH-{YYYY}{MM}-{SEQUENCE}
  Sequence: Redis INCR hms:preauth:counter:{YYYYMM} TTL: 32 days
  Example: PREAUTH-202412-000023
- Calculate total estimated cost:
  Sum all plannedProcedures.estimatedCost +
  estimatedRoomCharges + estimatedMedicineCharges +
  estimatedLabCharges + estimatedOtCharges
  Use decimal.js for precision: new Decimal(val1).plus(val2)
  Validate: totalEstimatedCost >= calculated sum
- Validate required documents are provided:
  Minimum required for preAuth submission:
  [doctor_referral, investigation_reports, clinical_notes]
  If missing: return error listing required documents
- Generate pre-auth PDF document using pdf.util.js
  Include: hospital letterhead, patient details, policy details,
  planned procedures, cost estimates, doctor signature block
- Upload PDF to S3: insurance/pre-auth/{preAuthId}/{filename}
- Submit to insurance portal if claimPortalUrl exists:
  Placeholder HTTP POST to provider.claimPortalUrl
  Retry 3 times with exponential backoff (1s, 2s, 4s)
  Log success/failure but do not block if portal is down
  (pre-auth still created regardless of portal submission)
- Send submission email with PDF to provider.claimEmail
- Set status: SUBMITTED
  Record submittedAt timestamp, submittedBy
- Schedule follow-up reminder:
  Bull job delayed by 24 hours if no status update received
  Job will trigger notification to insurance team
- Cache: hms:insurance:preauth:{preAuthId} TTL: 1hr
- Create audit log: PRE_AUTHORIZATION_CREATED
- Return: pre-auth record with referenceNumber and documentUrl

─────────────────────────────────────────
FUNCTION 6: updatePreAuthorizationStatus(preAuthId, statusData, updatedBy)
─────────────────────────────────────────
Business logic:
- Fetch existing pre-auth, validate exists
- Validate status transition is allowed (state machine):
  SUBMITTED → UNDER_REVIEW
  UNDER_REVIEW → APPROVED | PARTIALLY_APPROVED | REJECTED
  APPROVED → EXPIRED (auto, by scheduler only)
  Throw ValidationError for invalid transitions
- If new status is APPROVED:
  Validate: approvedAmount, authorizationCode, validTill all provided
  Store: approved amount, auth code, validity, approved procedures
  Notify: doctor + patient via in-app + SMS
  "Pre-authorization approved for Rs. {approvedAmount/100}"
  Update billing: flag bill for cashless processing
- If new status is PARTIALLY_APPROVED:
  Store: approved amount (less than requested), denied items list,
  partial approval notes
  Calculate shortfall: requestedAmount - approvedAmount
  Notify: doctor + billing team about shortfall amount
  "Pre-auth partially approved. Shortfall: Rs. {shortfall/100}"
- If new status is REJECTED:
  Validate: rejectionReason is provided
  Notify: patient + doctor + billing team
  "Pre-authorization rejected. Reason: {reason}"
  Auto-suggest: switch to reimbursement or self-pay
- Cancel scheduled follow-up Bull job (preAuth.followUpJobId)
- Create status history record (never overwrite — append only)
- Invalidate Redis cache: DEL hms:insurance:preauth:{preAuthId}
- Create audit log: PRE_AUTH_STATUS_UPDATED with transition details
- Return: updated pre-auth record

─────────────────────────────────────────
FUNCTION 7: createInsuranceClaim(billId, patientInsuranceId, claimData, createdBy)
─────────────────────────────────────────
Business logic:
- Fetch bill, validate exists and belongs to correct patient
- Fetch patient insurance, validate active and valid on bill date
- If provider.preAuthRequired === true:
  Validate preAuthId is provided and is APPROVED status
  Fetch pre-auth, validate it covers the procedures in the bill
  Throw ValidationError if missing or invalid
- Check for duplicate claim:
  Same billId + same insurance = ConflictError
  "A claim has already been submitted for this bill"
- Validate minimum required documents present:
  Required: discharge_summary + itemized_bill (check document types)
  For IPD claims additionally: lab_reports, prescriptions
  Throw ValidationError with missing documents list
- Auto-generate claim number:
  Format: CLM-{YYYY}{MM}-{SEQUENCE}
  Sequence: Redis INCR hms:claim:counter:{YYYYMM} TTL: 32 days
  Example: CLM-202412-000045
- Calculate claim amounts using decimal.js:
  baseAmount = claimedAmount
  afterDeductible = max(0, baseAmount - policy.deductibleAmount)
  afterCopay = afterDeductible * (1 - policy.copayPercentage/100)
  finalClaimAmount = min(afterCopay, policy.sumInsured - claimedThisYear)
  Store: claimedAmount, deductibleApplied, copayAmount,
    estimatedSettlementAmount, patientLiability
  Use new Decimal() for all calculations — never native float arithmetic
- For cashless claims:
  Hold patient's billed amount in billing module
  Mark bill as PAYMENT_PENDING_INSURANCE
- For reimbursement claims:
  Patient pays full amount
  Claim is advisory/tracking only
- Submit to insurance portal (placeholder with retry)
- Generate claim submission PDF
- Upload to S3: insurance/claims/{claimId}/
- Send confirmation to patient: "Claim {claimNumber} submitted"
- Send email to claimEmail with all documents
- Set status: SUBMITTED, recordSubmittedAt
- Create audit log: INSURANCE_CLAIM_CREATED
- Return: claim record with all calculated amounts

─────────────────────────────────────────
FUNCTION 8: processClaimSettlement(claimId, settlementData, processedBy)
─────────────────────────────────────────
Business logic:
- Fetch claim, validate exists and status allows settlement:
  Only UNDER_REVIEW or APPROVED status can be settled
  Throw ValidationError for other statuses
- Validate processedBy has ACCOUNTANT or ADMIN role
  (extra validation in service layer — defense in depth)
- Calculate using decimal.js:
  settledAmount = settlementData.settledAmount (paise)
  shortfall = claimedAmount - settledAmount
  patientLiability = totalBillAmount - settledAmount - alreadyPaidByPatient
- Create settlement record:
  claimId, settledAmount, shortfall, settlementDate,
  settlementMode, referenceNumber, bankDetails (if cheque),
  processedBy, processedAt, remarks
- Update claim status to SETTLED (or PARTIALLY_SETTLED if shortfall > 0)
- Update billing module:
  If cashless: release payment hold, create payment entry for settledAmount
  Mark bill as PARTIALLY_PAID (if shortfall) or PAID
- If patientLiability > 0:
  Notify patient: "Insurance settled Rs. {settled/100}.
    Your remaining balance: Rs. {liability/100}"
  Send SMS + email with payment breakdown
- If shortfall > 0 and shortfallReason provided:
  Create shortfall dispute record for potential appeal
- Create financial audit entry:
  CLAIM_SETTLEMENT_PROCESSED (financial-critical audit level)
- Create general audit log: CLAIM_SETTLED
- Invalidate claim Redis cache
- Return: settlement record + updated bill status

─────────────────────────────────────────
FUNCTION 9: disputeInsuranceClaim(claimId, disputeData, disputedBy)
─────────────────────────────────────────
Business logic:
- Fetch claim, validate can be disputed:
  Eligible statuses: REJECTED, PARTIALLY_SETTLED
  Throw ValidationError otherwise
- Create dispute record:
  claimId, disputeType, disputeReason, requestedAmount,
  supportingDocuments[], disputedBy, disputedAt, status: OPEN
- Generate dispute letter PDF
- Send dispute to provider.claimEmail with all documents
- Update claim status: DISPUTED
- Notify billing team: claim under dispute, hold any adjustments
- Create audit log: CLAIM_DISPUTED
- Return: dispute record

─────────────────────────────────────────
FUNCTION 10: getInsuranceDashboard()
─────────────────────────────────────────
Business logic:
- Check Redis cache first:
  key: hms:insurance:dashboard TTL: 10 minutes
- Build dashboard with parallel DB queries (Promise.all):
  Query 1: Active provider count, expiring empanelments (< 30 days)
  Query 2: Patient policies: total active, expiring this month
  Query 3: Pre-auth today: submitted, approved, rejected counts
  Query 4: Claims this month: submitted, settled, rejected,
    total claimed amount, total settled amount
  Query 5: Settlement ratio = settledAmount/claimedAmount × 100
  Query 6: Average settlement time in days
  Query 7: Pending cashless claims (status: SUBMITTED/UNDER_REVIEW)
  Query 8: Rejected claims requiring attention (last 30 days)
- Calculate using decimal.js for monetary totals
- Format all amounts in paise (integer) with display hint in response
- Cache result
- Return: {
    providers: {total, expiringEmpanelments[]},
    policies: {totalActive, expiringThisMonth},
    preAuthorizations: {todaySubmitted, approved, rejected, pending},
    claims: {thisMonthSubmitted, settled, rejected,
      totalClaimedAmount, totalSettledAmount,
      settlementRatio, avgSettlementDays},
    pendingCashless: count + list,
    alerts: [] (provider empanelments, policy expirations),
    lastUpdated: timestamp
  }

─────────────────────────────────────────
FUNCTION 11: getClaimsByPatient(patientId, filters, pagination)
─────────────────────────────────────────
Business logic:
- filters: {status, claimType, providerId, startDate, endDate}
- Build Sequelize query with pagination using pagination.util.js
- Include: provider name, settlement details, pre-auth reference
- Sort: most recent first
- Calculate per-claim: patientLiability, settlementStatus
- Return: paginated claims list with summary totals

─────────────────────────────────────────
FUNCTION 12: getClaimSummaryReport(filters, pagination)
─────────────────────────────────────────
Business logic:
- Admin/Accountant only (validated at controller)
- filters: {providerId, claimType, status, dateRange, minAmount}
- Aggregated stats per provider:
  totalClaimed, totalSettled, settlementRatio, avgSettlementDays,
  rejectedCount, disputedCount, pendingCount
- Individual claims list (paginated)
- Export capability: if exportFormat provided, generate Excel
- Cache: 15 minutes per filter combination
- Return: summary + paginated claims

─────────────────────────────────────────
FUNCTION 13: scheduleEmpanelmentExpiryAlerts()
─────────────────────────────────────────
Business logic:
- Called by scheduler every day at 9:00 AM via node-cron
- Query providers where empanelmentValidTill in next 30 days
- Group by: expiring_in_7_days, 8_15_days, 16_30_days
- For each expiring provider:
  Send notification to: ADMIN + ACCOUNTANT roles
  Channel: in-app + email
- Providers already expired: send CRITICAL alert
- Return: alert counts logged to scheduler

Requirements for ALL functions:
- All financial calculations: use decimal.js (new Decimal())
  NEVER use native JavaScript floating point arithmetic
  for monetary values
- All amounts stored and returned as integers in paise
  Add comment above monetary fields: // paise (1 rupee = 100 paise)
- Insurance portal HTTP calls: wrapped in try/catch with retry
  Non-blocking — save record regardless of portal response
  Log portal call success/failure separately
- GSTIN validation: implement full checksum algorithm
  Create private validateGSTIN(gstin) function used internally
- All DB writes: Sequelize transactions
- Redis cache keys: always namespace with hms:insurance:*
- Throw typed AppError subclasses:
  ValidationError, NotFoundError, ConflictError, ForbiddenError
- Use createChildLogger('insurance') for all module logging
- Export all functions as named exports with complete JSDoc:
  @description, @param, @returns, @throws, @financial-critical
src/modules/insurance/insurance.controller.js
text
You are a healthcare insurance backend engineer. Build a 
production-grade insurance management controller for a Hospital 
Management System using Node.js + Express.js. Follow the strict 
thin-controller pattern — all business logic in service layer.

Tech stack context:
- Express.js async controllers
- insurance.service.js for all business logic
- response.util.js: sendSuccess(), sendCreated(), sendAccepted()
- pagination.util.js: extractPaginationParams()
- dateTime.util.js: for date range validation
- req.user: {id, role, departmentId}
- All controller methods wrapped in try/catch → next(error)

Implement ALL of the following controller methods:

─────────────────────────────────────────
INSURANCE PROVIDERS (methods 1-9):
─────────────────────────────────────────

1. addInsuranceProvider(req, res, next):
   - Extract: providerData from req.body
   - Extract: createdBy from req.user.id
   - Delegate to insuranceService.addInsuranceProvider()
   - Response: sendCreated(res, data, 'Insurance provider added')

2. getInsuranceProviderById(req, res, next):
   - Extract: providerId from req.params.providerId
   - Delegate to insuranceService.getInsuranceProviderById()
   - Response: sendSuccess(res, data, 'Provider retrieved')

3. updateInsuranceProvider(req, res, next):
   - Extract: providerId from req.params, updateData from req.body
   - Extract: updatedBy from req.user.id
   - Delegate to service
   - Response: sendSuccess(res, data, 'Provider updated')

4. deactivateInsuranceProvider(req, res, next):
   - Extract: providerId from req.params
   - Inline check: only ADMIN can deactivate
     if not ADMIN/SUPER_ADMIN: throw ForbiddenError
   - Delegate to service
   - Response: sendSuccess(res, null, 'Provider deactivated')

5. reactivateInsuranceProvider(req, res, next):
   - Same pattern as deactivate
   - Response: sendSuccess(res, data, 'Provider reactivated')

6. listInsuranceProviders(req, res, next):
   - Extract: pagination via extractPaginationParams(req.query)
   - Extract: filters {type, isActive, state} from req.query
   - Delegate to service
   - Response: sendSuccess with pagination meta

7. searchInsuranceProviders(req, res, next):
   - Extract: q from req.query.q
   - Validate: q must be at least 2 characters
     if q.length < 2: return 400 'Search query min 2 characters'
   - Delegate to service
   - Response: sendSuccess with results

8. getExpiringEmpanelments(req, res, next):
   - Extract: daysAhead from req.query (default 30, max 90)
   - Validate: daysAhead is integer 1-90
   - Delegate to service
   - Response: sendSuccess with expiring providers

9. uploadProviderDocument(req, res, next):
   - File from req.file (upload middleware)
   - If no file: throw BadRequestError 'No document file provided'
   - Extract: providerId from req.params
   - Build fileData from req.file + req.body
   - Delegate to service
   - Response: sendCreated(res, data, 'Provider document uploaded')

─────────────────────────────────────────
PATIENT INSURANCE (methods 10-17):
─────────────────────────────────────────

10. addPatientInsurance(req, res, next):
    - Extract: patientId from req.params
    - Extract: insuranceData from req.body, addedBy from req.user.id
    - Delegate to service
    - Response: sendCreated(res, data, 'Patient insurance registered')

11. getPatientInsuranceById(req, res, next):
    - Extract: patientId, insuranceId from req.params
    - Delegate to service
    - Response: sendSuccess(res, data, 'Insurance retrieved')

12. updatePatientInsurance(req, res, next):
    - Extract: patientId, insuranceId from req.params
    - Extract: updateData from req.body, updatedBy from req.user.id
    - Delegate to service
    - Response: sendSuccess(res, data, 'Insurance updated')

13. deactivatePatientInsurance(




