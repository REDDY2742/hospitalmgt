const doctorService = require('./doctor.service');
const Response = require('../../utils/response.util');
const { getPagination } = require('../../utils/pagination.util');
const logger = require('../../utils/logger.util');

/**
 * Doctor Management Controller
 */
const logEntry = (req, method) => {
  logger.debug(`[DoctorController] Entering ${method} | ReqID: ${req.requestId || 'N/A'}`);
};

const createDoctor = async (req, res, next) => {
  logEntry(req, 'createDoctor');
  try {
    const data = await doctorService.createDoctorProfile(req.body, req.user.id);
    Response.sendSuccess(res, data, 'Doctor profile created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  logEntry(req, 'getAllDoctors');
  try {
    const pagination = getPagination(req.query);
    const data = await doctorService.getDoctorsByDepartment(null, null, req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  logEntry(req, 'updateDoctor');
  try {
    const data = await doctorService.updateDoctorProfile(req.params.doctorId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Doctor profile updated');
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  logEntry(req, 'deleteDoctor');
  try {
    await doctorService.deleteDoctor(req.params.doctorId, req.user.id);
    Response.sendSuccess(res, null, 'Doctor profile deactivated');
  } catch (error) {
    next(error);
  }
};

const getAvailableDoctors = async (req, res, next) => {
  logEntry(req, 'getAvailableDoctors');
  try {
    const data = await doctorService.getDoctorsByDepartment(null, null, { available: true });
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getDoctorsByDept = async (req, res, next) => {
  logEntry(req, 'getDoctorsByDept');
  try {
    const data = await doctorService.getDoctorsByDepartment(req.params.deptId, null, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getDoctorsBySpecialization = async (req, res, next) => {
  logEntry(req, 'getDoctorsBySpecialization');
  try {
    const data = await doctorService.getDoctorsByDepartment(null, req.query.spec, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getDoctorProfile = async (req, res, next) => {
  logEntry(req, 'getDoctorProfile');
  try {
    const data = await doctorService.getDoctorById(req.params.doctorId);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getDoctorAvailability = async (req, res, next) => {
  logEntry(req, 'getDoctorAvailability');
  try {
    const data = await doctorService.getDoctorAvailability(req.params.doctorId, req.query.date);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  logEntry(req, 'getMyProfile');
  try {
    const data = await doctorService.getDoctorByUserId(req.user.id);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const updateMySchedule = async (req, res, next) => {
  logEntry(req, 'updateMySchedule');
  try {
    const data = await doctorService.updateDoctorSchedule(req.user.profileId, req.body);
    Response.sendSuccess(res, data, 'Weekly schedule updated');
  } catch (error) {
    next(error);
  }
};

const blockMySlot = async (req, res, next) => {
  logEntry(req, 'blockMySlot');
  try {
    const data = await doctorService.blockDoctorSlot(req.user.profileId, req.body.date, req.body, req.body.reason);
    Response.sendSuccess(res, data, 'Time slot blocked and patients notified');
  } catch (error) {
    next(error);
  }
};

const applyMyLeave = async (req, res, next) => {
  logEntry(req, 'applyMyLeave');
  try {
    const data = await doctorService.applyDoctorLeave(req.user.profileId, req.body);
    Response.sendSuccess(res, data, 'Leave request submitted', 201);
  } catch (error) {
    next(error);
  }
};

const getMyPatients = async (req, res, next) => {
  logEntry(req, 'getMyPatients');
  try {
    const pagination = getPagination(req.query);
    const data = await doctorService.getDoctorPatients(req.user.profileId, req.query, pagination);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getMyStats = async (req, res, next) => {
  logEntry(req, 'getMyStats');
  try {
    const data = await doctorService.getDoctorPerformanceStats(req.user.profileId, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const getDoctorStats = async (req, res, next) => {
  logEntry(req, 'getDoctorStats');
  try {
    const data = await doctorService.getDoctorPerformanceStats(req.params.doctorId, req.query);
    Response.sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const manageLeave = async (req, res, next) => {
  logEntry(req, 'manageLeave');
  try {
    const data = await doctorService.manageLeave(req.params.doctorId, req.params.leaveId, req.body);
    Response.sendSuccess(res, data, `Leave request ${req.body.status}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
  getAvailableDoctors,
  getDoctorsByDept,
  getDoctorsBySpecialization,
  getDoctorProfile,
  getDoctorAvailability,
  getMyProfile,
  updateMySchedule,
  blockMySlot,
  applyMyLeave,
  getMyPatients,
  getMyStats,
  getDoctorStats,
  manageLeave
};
