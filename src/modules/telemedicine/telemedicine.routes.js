const express = require('express');
const router = express.Router();
const telemedicineController = require('./telemedicine.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { auditTrail: auditMiddleware } = require('../../middleware/audit.middleware');
const { 
  apiLimiter, 
  tokenGenerationLimiter 
} = require('../../middleware/rateLimit.middleware');
const { 
  consultationWindowValidator, 
  prescriptionOwnershipGuard, 
  razorpaySignatureValidator,
  socketRoomValidator
} = require('../../middleware/telemedicine.middleware');

const { 
  scheduleConsultationSchema, 
  clinicalNotesSchema, 
  ePrescriptionSchema, 
  onlineAvailabilitySchema, 
  paymentInitiateSchema 
} = require('./telemedicine.validator');

/**
 * Telemedicine & Virtual Care API Gateway
 * Base Path: /api/v1/telemedicine
 * 
 * Secure video consultation architecture with WHO-standard digital prescribing.
 */

router.use(apiLimiter);

// --- 1. Consultation Lifecycle ---

router.post('/consultations',
  authenticate,
  authorize(['patient', 'admin', 'receptionist']),
  validate({ body: scheduleConsultationSchema }),
  telemedicineController.scheduleConsultation
);

router.get('/consultations',
  authenticate,
  authorize('admin'),
  telemedicineController.listConsultations
);

router.get('/consultations/upcoming',
  authenticate,
  authorize(['patient', 'doctor']),
  telemedicineController.getUpcomingConsultations
);

router.get('/consultations/:id',
  authenticate,
  authorize(['doctor', 'patient', 'admin']),
  telemedicineController.getConsultationById
);

router.put('/consultations/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  telemedicineController.updateConsultation
);

router.post('/consultations/:id/cancel',
  authenticate,
  authorize(['patient', 'doctor', 'admin']),
  telemedicineController.cancelConsultation
);

router.get('/consultations/patient/:patientId',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  telemedicineController.getConsultationsByPatient
);

// --- 2. Video Session Control ---

router.post('/consultations/:id/token',
  authenticate,
  authorize(['doctor', 'patient']),
  tokenGenerationLimiter,
  consultationWindowValidator, // ±10 min check
  telemedicineController.generateVideoToken
);

router.post('/consultations/:id/start',
  authenticate,
  authorize('doctor'),
  socketRoomValidator,
  telemedicineController.startConsultation
);

router.post('/consultations/:id/end',
  authenticate,
  authorize('doctor'),
  telemedicineController.endConsultation
);

router.post('/consultations/:id/join',
  authenticate,
  authorize('patient'),
  consultationWindowValidator,
  socketRoomValidator,
  telemedicineController.joinConsultation
);

router.get('/consultations/:id/status',
  authenticate,
  authorize(['doctor', 'patient']),
  telemedicineController.getSessionStatus
);

// --- 3. Clinical Documentation ---

router.post('/consultations/:id/notes',
  authenticate,
  authorize('doctor'),
  validate({ body: clinicalNotesSchema }),
  auditMiddleware,
  telemedicineController.addConsultationNotes
);

router.get('/consultations/:id/notes',
  authenticate,
  authorize(['doctor', 'patient']),
  telemedicineController.getConsultationNotes
);

router.post('/consultations/:id/symptoms',
  authenticate,
  authorize(['patient', 'doctor']),
  telemedicineController.addSymptoms
);

router.get('/consultations/:id/summary',
  authenticate,
  authorize(['doctor', 'patient', 'admin']),
  telemedicineController.getConsultationSummary
);

// --- 4. Digital E-Prescription ---

router.post('/consultations/:id/prescription',
  authenticate,
  authorize('doctor'),
  validate({ body: ePrescriptionSchema }),
  auditMiddleware,
  telemedicineController.generateEPrescription
);

router.get('/consultations/:id/prescription',
  authenticate,
  authorize(['doctor', 'patient']),
  prescriptionOwnershipGuard,
  telemedicineController.getEPrescription
);

router.get('/consultations/:id/prescription/pdf',
  authenticate,
  authorize(['doctor', 'patient']),
  prescriptionOwnershipGuard,
  telemedicineController.getEPrescriptionPDF
);

router.post('/consultations/:id/prescription/send',
  authenticate,
  authorize('doctor'),
  auditMiddleware,
  telemedicineController.sendEPrescriptionToPharmacy
);

// --- 5. Referral & Follow-up ---

router.post('/consultations/:id/follow-up',
  authenticate,
  authorize('doctor'),
  telemedicineController.scheduleFollowUp
);

router.post('/consultations/:id/referral',
  authenticate,
  authorize('doctor'),
  auditMiddleware,
  telemedicineController.createReferral
);

// --- 6. Tele-Payments & Webhooks ---

router.post('/consultations/:id/payment/initiate',
  authenticate,
  authorize(['patient', 'admin']),
  validate({ body: paymentInitiateSchema }),
  telemedicineController.initiatePayment
);

router.post('/consultations/:id/payment/verify',
  authenticate,
  authorize(['patient', 'admin']),
  telemedicineController.verifyPayment
);

router.post('/payments/webhook/razorpay',
  // No authenticate: Signature validation only
  razorpaySignatureValidator,
  telemedicineController.verifyPayment
);

// --- 7. Doctor Presence & Analytics ---

router.get('/doctors/available',
  authenticate,
  telemedicineController.getAvailableDoctors
);

router.put('/doctors/:doctorId/online-availability',
  authenticate,
  authorize('doctor'),
  validate({ body: onlineAvailabilitySchema }),
  telemedicineController.setDoctorOnlineAvailability
);

router.get('/dashboard',
  authenticate,
  authorize(['admin', 'super_admin']),
  telemedicineController.getTeleMedicineDashboard
);

router.get('/analytics',
  authenticate,
  authorize(['admin', 'super_admin']),
  telemedicineController.getConsultationAnalytics
);

module.exports = router;
