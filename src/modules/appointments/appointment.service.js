const { Op } = require('sequelize');
const { db } = require('../../config/db');
const Appointment = require('./appointment.model'); // Assumed path
const User = require('../users/user.model');
const Department = require('../departments/department.model');
const AppError = require('../../utils/appError');
const { redis } = require('../../config/redis');
const { io } = require('../../app');
const notificationQueue = require('../../queues/notification.queue'); // Bull queue
const pdfUtil = require('../../utils/pdf.util');

/**
 * Hospital Appointment Scheduling & Queue Management Service
 * 
 * Orchestrates intelligent slot allocation, real-time doctor dashboards, 
 * Redis-backed concurrency locking, and automated patient flow transitions.
 */

class AppointmentService {
  
  /**
   * --- Booking & Allocation ---
   */

  /**
   * @description Reserves a clinical slot with distributed Redis locking to prevent double-booking
   */
  async createAppointment(appointmentData, createdBy) {
    const { doctorId, appointmentDate, appointmentTime } = appointmentData;
    const lockKey = `hms:lock:apt:${doctorId}:${appointmentDate}:${appointmentTime}`;
    
    // 1. Concurrency Shield: 30s distributed lock
    const locked = await redis.set(lockKey, 'LOCKED', 'EX', 30, 'NX');
    if (!locked) throw new AppError('AvailabilityError: This slot is currently being reserved. Please try again in 30 seconds.', 409);

    const transaction = await db.transaction();
    try {
      // 2. Doctor/Dept Fidelity
      const doctor = await User.findByPk(doctorId, { include: ['department'], transaction });
      if (!doctor || doctor.role !== 'DOCTOR') throw new AppError('IdentityError: Invalid physician selected', 400);

      // 3. Slot Availability Logic (DB Check)
      const existing = await Appointment.findOne({
        where: { doctorId, appointmentDate, appointmentTime, status: { [Op.notIn]: ['CANCELLED', 'NO_SHOW'] } },
        transaction
      });
      if (existing) throw new AppError('SlotError: Requested appointment slot is already occupied', 400);

      // 4. Branding & Tokenization
      const dateStr = appointmentDate.replace(/-/g, '');
      const aptCount = await Appointment.count({ where: { appointmentDate }, transaction });
      const appointmentNumber = `APT-${dateStr}-${(aptCount + 1).toString().padStart(4, '0')}`;

      // Redis-backed Queue Token
      const tokenKey = `hms:tokens:${doctorId}:${appointmentDate}`;
      const tokenNumber = await redis.incr(tokenKey);

      const appointment = await Appointment.create({
        ...appointmentData,
        appointmentNumber,
        tokenNumber,
        status: 'SCHEDULED',
        createdBy: createdBy.id
      }, { transaction });

      await transaction.commit();

      // 5. Outreach (Async Bull Queue)
      await notificationQueue.add('SEND_APPOINTMENT_CONFIRMATION', { appointmentId: appointment.id });
      
      return appointment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await redis.del(lockKey); // Release lock
    }
  }

  /**
   * --- Flow Management & State Machine ---
   */

  /**
   * @description Orchestrates valid healthcare state transitions (CHECKED_IN -> COMPLETED)
   */
  async updateAppointmentStatus(appointmentId, status, updatedBy) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) throw new AppError('Appointment not found', 404);

    // 1. State Machine Gating
    const validTransitions = {
      'SCHEDULED': ['CONFIRMED', 'CANCELLED', 'RESCHEDULED'],
      'CONFIRMED': ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED'],
      'CHECKED_IN': ['IN_CONSULTATION', 'NO_SHOW'],
      'IN_CONSULTATION': ['COMPLETED']
    };

    if (validTransitions[appointment.status] && !validTransitions[appointment.status].includes(status)) {
      throw new AppError(`ProcessError: Manual transition from ${appointment.status} to ${status} is logically restricted`, 400);
    }

    // 2. Transition Side-Effects
    if (status === 'CHECKED_IN') {
      appointment.actualCheckInTime = new Date();
      io.to(`doctor_${appointment.doctorId}`).emit('PATIENT_ARRIVED', { token: appointment.tokenNumber });
    }

    if (status === 'COMPLETED') {
      appointment.endTime = new Date();
      // Trigger Billing & History records
      await notificationQueue.add('PROCESS_CONSULTATION_COMPLETION', { appointmentId });
    }

    appointment.status = status;
    await appointment.save();

    io.to(`apt_room_${appointmentId}`).emit('STATUS_UPDATED', { status });
    await redis.del(`hms:appointments:${appointmentId}`);
    
    return appointment;
  }

  /**
   * --- Real-Time Queue Dashboards ---
   */

  /**
   * @description Aggregates real-time OPD queue status for the doctor's workstation
   */
  async getAppointmentQueue(doctorId, date) {
    const cacheKey = `hms:queue:${doctorId}:${date}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const queue = await Appointment.findAll({
      where: { doctorId, appointmentDate: date, status: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'] },
      order: [['priority', 'DESC'], ['tokenNumber', 'ASC']], // Urgent first, then token
      include: [{ model: User, as: 'patient', attributes: ['firstName', 'lastName'] }]
    });

    const formattedQueue = queue.map(apt => ({
      token: apt.tokenNumber,
      patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
      status: apt.status,
      isUrgent: apt.priority === 'urgent',
      waitingSince: apt.actualCheckInTime || null
    }));

    await redis.set(cacheKey, JSON.stringify(formattedQueue), 'EX', 30); // Short TTL for real-time
    return formattedQueue;
  }

  /**
   * --- Clinical Availability Intelligence ---
   */

  /**
   * @description Computes available consultation segments per physician configuration
   */
  async getAvailableSlots(doctorId, date) {
    // 1. Fetch Doctor Schedule Configuration
    const doctor = await User.findByPk(doctorId);
    const interval = doctor.consultationInterval || 15; // default 15 min
    
    // 2. Fetch Booked/Blocked Segments
    const booked = await Appointment.findAll({
      where: { doctorId, appointmentDate: date, status: { [Op.not]: 'CANCELLED' } },
      attributes: ['appointmentTime']
    });
    const bookedTimes = booked.map(b => b.appointmentTime);

    // 3. Segment Generation (Business hours placeholder: 09:00 - 17:00)
    const slots = [];
    let current = 9 * 60; // 09:00
    const end = 17 * 60; // 17:00

    while (current < end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      const slotTime = `${h}:${m}`;
      
      slots.push({
        time: slotTime,
        status: bookedTimes.includes(slotTime) ? 'BOOKED' : 'AVAILABLE'
      });
      current += interval;
    }

    return { slots };
  }

  /**
   * --- Administrative Mobility ---
   */

  /**
   * @description Finalizes rescheduling with old slot release and new slot locking
   */
  async rescheduleAppointment(appointmentId, newDate, newTime, reason, rescheduledBy) {
    const transaction = await db.transaction();
    try {
      const appointment = await Appointment.findByPk(appointmentId, { transaction, lock: true });
      if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
        throw new AppError('RescheduleError: Cannot reschedule in-progress or closed appointments', 400);
      }

      // 1. Release Old Slot / Redis lock
      const oldLockKey = `hms:lock:apt:${appointment.doctorId}:${appointment.appointmentDate}:${appointment.appointmentTime}`;
      await redis.del(oldLockKey);

      // 2. Lock & Update to New Slot
      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
      appointment.rescheduleHistory = [...(appointment.rescheduleHistory || []), { date: new Date(), reason, by: rescheduledBy }];
      
      await appointment.save({ transaction });
      await transaction.commit();

      await notificationQueue.add('SEND_RESCHEDULE_ALERT', { appointmentId: appointment.id });
      return appointment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new AppointmentService();
