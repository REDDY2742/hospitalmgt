const { 
  DoctorProfile, 
  User, 
  Schedule, 
  Appointment, 
  Leave, 
  Department, 
  Patient, 
  sequelize 
} = require('../../models');
const { redis } = require('../../config/redis');
const { uploadToS3 } = require('../../utils/s3.util');
const { sendDoctorOnboarding, sendSlotBlockedAlert, sendLeaveNotification } = require('../../utils/email.util');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Doctor Management & Clinical Scheduling Service
 * 
 * Handles doctor provisioning, complex recurring availability calculations,
 * and high-concurrency slot locking.
 */

class DoctorService {
  /**
   * Provision a new Doctor account and clinical profile
   */
  async createDoctorProfile(doctorData, createdBy) {
    const transaction = await sequelize.transaction();

    try {
      const { email, phone, specialization, firstName, lastName } = doctorData;

      // 1. Create User account first
      const user = await User.create({
        email,
        phone,
        role: 'DOCTOR',
        firstName,
        lastName,
        isActive: true
      }, { transaction });

      // 2. Profile Photo to S3
      let profilePhotoUrl = null;
      if (doctorData.profilePhoto) {
        const photoKey = `doctors/${user.id}-${Date.now()}.jpg`;
        profilePhotoUrl = await uploadToS3(doctorData.profilePhoto, photoKey, 'PROFILE_IMAGES');
      }

      // 3. Generate Doctor ID (DR-SPEC-001)
      const specCode = specialization.substring(0, 3).toUpperCase();
      const count = await DoctorProfile.count({ where: { specialization }, transaction });
      const doctorId = `DR-${specCode}-${String(count + 1).padStart(3, '0')}`;

      // 4. Create Extended Profile
      const profile = await DoctorProfile.create({
        ...doctorData,
        userId: user.id,
        doctorId,
        profilePhoto: profilePhotoUrl,
        createdBy
      }, { transaction });

      // 5. Initialize Default Schedule (Mon-Fri, 09:00-17:00)
      const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const schedulePromises = defaultDays.map(day => 
        Schedule.create({
          doctorId: profile.id,
          day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 15,
          maxPatients: 25
        }, { transaction })
      );
      await Promise.all(schedulePromises);

      await transaction.commit();

      // Async Onboarding
      sendDoctorOnboarding(email, { name: `${firstName} ${lastName}`, doctorId });

      return { user, profile };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Complex Availability Calculation with Redis Caching
   */
  async getDoctorAvailability(doctorId, dateString) {
    const cacheKey = `avail:${doctorId}:${dateString}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // 1. Get Base Schedule
    const schedule = await Schedule.findOne({ where: { doctorId, day: dayName } });
    if (!schedule) return []; // Not working this day

    // 2. Check for Leaves
    const leave = await Leave.findOne({
      where: {
        doctorId,
        status: 'approved',
        startDate: { [sequelize.Op.lte]: date },
        endDate: { [sequelize.Op.gte]: date }
      }
    });
    if (leave) return []; // On leave

    // 3. Get Booked and Blocked slots
    const appointments = await Appointment.findAll({
      where: { doctorId, appointmentDate: dateString, status: { [sequelize.Op.ne]: 'cancelled' } },
      attributes: ['appointmentTime']
    });

    // 4. Generate All 15-min Intervals
    const slots = [];
    let current = this._timeToMinutes(schedule.startTime);
    const end = this._timeToMinutes(schedule.endTime);

    while (current < end) {
      const timeStr = this._minutesToTime(current);
      const isBooked = appointments.some(app => app.appointmentTime === timeStr);
      
      slots.push({
        time: timeStr,
        status: isBooked ? 'booked' : 'available'
      });
      current += schedule.slotDuration;
    }

    await redis.set(cacheKey, JSON.stringify(slots), 'EX', 300);
    return slots;
  }

  /**
   * Block specific time range (Emergency/Breaks)
   */
  async blockDoctorSlot(doctorId, date, timeRange, reason) {
    const { startTime, endTime } = timeRange;
    
    // 1. Find and update affected appointments
    const affected = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        appointmentTime: { [sequelize.Op.between]: [startTime, endTime] },
        status: 'scheduled'
      },
      include: [{ model: User, as: 'patient' }]
    });

    // 2. Invalidate Availability Cache
    await redis.del(`avail:${doctorId}:${date}`);

    // 3. Notify Patients
    affected.forEach(app => {
      sendSlotBlockedAlert(app.patient.email, { date, time: app.appointmentTime, reason });
    });

    return { affectedCount: affected.length };
  }

  /**
   * High-Concurrency Slot Locking (Anti-Double Booking)
   */
  async lockSlot(doctorId, date, time) {
    const lockKey = `lock:slot:${doctorId}:${date}:${time}`;
    const acquired = await redis.set(lockKey, 'LOCK', 'NX', 'EX', 30); // 30 sec lock
    if (!acquired) throw new ConflictError('This slot is currently being booked by another patient');
    return true;
  }

  /**
   * Aggregated Performance Metrics
   */
  async getDoctorPerformanceStats(doctorId, dateRange) {
    const { startDate, endDate } = dateRange;

    const stats = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: { [sequelize.Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status='completed' THEN 1 ELSE 0 END")), 'completed'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status='no-show' THEN 1 ELSE 0 END")), 'noShow'],
        [sequelize.fn('AVG', sequelize.col('consultationTime')), 'avgTime']
      ],
      raw: true
    });

    const revenue = await Appointment.sum('fee', {
      where: { doctorId, appointmentDate: { [sequelize.Op.between]: [startDate, endDate] }, status: 'completed' }
    });

    return {
      overview: stats[0],
      revenue: revenue || 0,
      timestamp: new Date()
    };
  }

  /**
   * Paginated Patient List for Doctor
   */
  async getDoctorPatients(doctorId, filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const { rows, count } = await Patient.findAndCountAll({
      where: { assignedDoctorId: doctorId, isDeleted: false },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      patients: rows,
      total: count,
      page
    };
  }

  /**
   * Time Utility Helpers
   */
  _timeToMinutes(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  }

  _minutesToTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}

module.exports = new DoctorService();
