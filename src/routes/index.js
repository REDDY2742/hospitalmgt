const express = require('express');
const router = express.Router();

/**
 * Main API Router
 * All routes are mounted under /api/v1
 */

const authRoutes = require('../modules/auth/auth.routes');
const auditRoutes = require('./audit.routes');
const patientRoutes = require('../modules/patients/patient.routes');
const doctorRoutes = require('../modules/doctors/doctor.routes');
const pharmacyRoutes = require('../modules/pharmacy/pharmacy.routes');
const billingRoutes = require('../modules/billing/billing.routes');
const labRoutes = require('../modules/laboratory/lab.routes');
const wardRoutes = require('../modules/wards/ward.routes');
const emergencyRoutes = require('../modules/emergency/emergency.routes');
const bloodBankRoutes = require('../modules/blood-bank/bloodBank.routes');
const otRoutes = require('../modules/operation-theatre/ot.routes');
const ambulanceRoutes = require('../modules/ambulance/ambulance.routes');
const telemedicineRoutes = require('../modules/telemedicine/telemedicine.routes');
const staffRoutes = require('../modules/staff/staff.routes');
const dischargeRoutes = require('../modules/discharge/discharge.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');
const reportRoutes = require('../modules/reports/report.routes');
const userRoutes = require('../modules/users/user.routes');
const supplierRoutes = require('../modules/suppliers/supplier.routes');
const roomRoutes = require('../modules/rooms/room.routes');
const nurseRoutes = require('../modules/nurses/nurse.routes');

router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'API v1 is active' });
});

router.use('/auth', authRoutes);
router.use('/audit', auditRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/billing', billingRoutes);
router.use('/lab', labRoutes);
router.use('/wards', wardRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/blood-bank', bloodBankRoutes);
router.use('/ot', otRoutes);
router.use('/ambulance', ambulanceRoutes);
router.use('/telemedicine', telemedicineRoutes);
router.use('/staff', staffRoutes);
router.use('/discharge', dischargeRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/rooms', roomRoutes);
router.use('/nurses', nurseRoutes);

// Add more module routes here as they are developed
// router.use('/patients', patientRoutes);
// router.use('/doctors', doctorRoutes);

module.exports = router;
