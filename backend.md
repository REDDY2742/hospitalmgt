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

PHARMACY MODULE                                                                                                            src/modules/pharmacy/pharmacy.service.js
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
