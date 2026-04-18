const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { protect: authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { audit: auditMiddleware } = require('../../middleware/audit.middleware');
const db = require('../../config/db');

const {
  createAppointmentSchema,
  updateAppointmentSchema,
  rescheduleSchema,
  cancelSchema,
  queueReorderSchema,
  bulkCancelSchema
} = require('./appointment.validator');

/**
 * Hospital Appointment Scheduling & Queue API Gateway
 * Base Path: /api/v1/appointments
 * 
 * Orchestrates clinical consultation lifecycles, real-time doctor dashboards, 
 * medication-ready OPD queues, and automated patient flow transitions.
 */

// --- 0. Specialized Clinical Middlewares ---

const doctorOwnershipGuard = async (req, res, next) => {
  try {
    const [appointment] = await db.query('SELECT doctor_id FROM appointments WHERE id = ?', {
      replacements: [req.params.appointmentId],
      type: db.QueryTypes.SELECT
    });
    if (!appointment || appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Physician affinity required for this clinical transition' });
    }
    next();
  } catch (error) { next(error); }
};

const slotWindowValidator = async (req, res, next) => {
  try {
    const [appointment] = await db.query('SELECT appointment_date, appointment_time FROM appointments WHERE id = ?', {
      replacements: [req.params.appointmentId],
      type: db.QueryTypes.SELECT
    });
    const aptDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const diff = Math.abs((new Date() - aptDateTime) / (1000 * 60));
    
    if (diff > 30) {
      return res.status(400).json({ message: 'Logistics Error: Patient check-in must occur within 30 min of scheduled slot' });
    }
    next();
  } catch (error) { next(error); }
};

// --- 1. Core Scheduling CRUD ---

router.use(authenticate); // Applied to all standard routes

router.post('/', authorize(['PATIENT', 'RECEPTIONIST', 'ADMIN', 'DOCTOR']), validate({ body: createAppointmentSchema }), appointmentController.createAppointment);
router.get('/', authorize(['ADMIN', 'RECEPTIONIST']), appointmentController.listAppointments);
router.get('/search', authorize(['ADMIN', 'RECEPTIONIST', 'DOCTOR']), appointmentController.searchAppointments);
router.get('/my', appointmentController.getMyAppointments);
router.get('/today', authorize(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN']), appointmentController.getTodayAppointments);

router.get('/:appointmentId', authorize(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN', 'PATIENT']), appointmentController.getAppointmentById);
router.put('/:appointmentId', authorize(['RECEPTIONIST', 'ADMIN', 'DOCTOR']), validate({ body: updateAppointmentSchema }), appointmentController.updateAppointment);

router.post('/:appointmentId/cancel', 
  authorize(['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']), 
  validate({ body: cancelSchema }), 
  auditMiddleware, 
  appointmentController.cancelAppointment
);

router.post('/:appointmentId/reschedule', 
  authorize(['PATIENT', 'RECEPTIONIST', 'ADMIN']), 
  validate({ body: rescheduleSchema }), 
  auditMiddleware, 
  appointmentController.rescheduleAppointment
);

router.post('/bulk/cancel', authorize('ADMIN'), validate({ body: bulkCancelSchema }), auditMiddleware, appointmentController.bulkCancelAppointments);

// --- 2. Slot & Physician Availability ---

router.get('/slots/doctor/:doctorId', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, max-age=120'); // 2 min TTL
  next();
}, appointmentController.getAvailableSlots);

router.get('/calendar/doctor/:doctorId', appointmentController.getDoctorAvailabilityCalendar);
router.get('/doctors/available', appointmentController.getAvailableDoctors);
router.get('/slots/check', appointmentController.checkSlotAvailability);

// --- 3. Status Transitions (Doctor Workstation) ---

router.post('/:appointmentId/confirm', authorize(['RECEPTIONIST', 'ADMIN']), auditMiddleware, appointmentController.confirmAppointment);

router.post('/:appointmentId/check-in', 
  authorize(['RECEPTIONIST', 'NURSE', 'ADMIN']), 
  slotWindowValidator, 
  auditMiddleware, 
  appointmentController.checkInPatient
);

router.post('/:appointmentId/start', authorize('DOCTOR'), doctorOwnershipGuard, auditMiddleware, appointmentController.startConsultation);
router.post('/:appointmentId/complete', authorize('DOCTOR'), doctorOwnershipGuard, auditMiddleware, appointmentController.completeAppointment);
router.post('/:appointmentId/no-show', authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), auditMiddleware, appointmentController.markNoShow);
router.post('/:appointmentId/mark-urgent', authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), appointmentController.markUrgent);

// --- 4. Real-Time Queue Management ---

router.get('/queue/doctor/:doctorId', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
}, appointmentController.getAppointmentQueue);

router.put('/queue/reorder', authorize(['ADMIN', 'RECEPTIONIST']), validate({ body: queueReorderSchema }), appointmentController.reorderQueue);
router.get('/queue/position/:appointmentId', appointmentController.getQueuePosition);
router.get('/queue/wait-time/:appointmentId', appointmentController.getEstimatedWaitTime);

// --- 5. Professional Handover (Documents) ---

router.get('/:appointmentId/slip/pdf', authorize(['RECEPTIONIST', 'NURSE', 'ADMIN', 'PATIENT']), appointmentController.getConsultationSlipPDF);
router.get('/:appointmentId/confirmation/pdf', authorize(['PATIENT', 'RECEPTIONIST', 'ADMIN']), appointmentController.getAppointmentConfirmationPDF);

// --- 6. Analytics & Performance ---

router.get('/reports/daily', authorize(['ADMIN', 'RECEPTIONIST']), appointmentController.getDailyReport);
router.get('/reports/stats', authorize(['ADMIN', 'SUPER_ADMIN']), appointmentController.getAppointmentStats);
router.get('/reports/no-show', authorize(['ADMIN', 'DOCTOR']), appointmentController.getNoShowReport);
router.get('/reports/doctor-utilization', authorize(['ADMIN', 'SUPER_ADMIN']), appointmentController.getDoctorUtilizationReport);
router.get('/reports/export', authorize(['ADMIN', 'SUPER_ADMIN']), appointmentController.exportAppointmentReport);

// --- 7. Reminders & Retention ---

router.post('/:appointmentId/reminder/send', authorize(['ADMIN', 'RECEPTIONIST']), appointmentController.sendManualReminder);
router.get('/:appointmentId/reminder/log', authorize(['ADMIN', 'RECEPTIONIST']), appointmentController.getReminderLog);

// --- 8. External Integrations ---

router.post('/payments/webhook', (req, res) => {
  // Bypasses auth, signature validation logic here
  res.status(200).send('Webhook Received');
});

module.exports = router;
