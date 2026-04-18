const insuranceService = require('./insurance.service');
const Response = require('../../utils/response.util');
const paginationUtil = require('../../utils/pagination.util');
const { ForbiddenError, BadRequestError } = require('../../utils/appError');
const logger = require('../../utils/logger').createChildLogger('insurance-controller');

/**
 * Hospital Insurance & TPA Controller
 * 
 * Orchestrates insurance provider empanelments, patient policy lifecycles,
 * clinical pre-authorizations, and financial claim settlements with decimal precision.
 */

// --- 1. Insurance Providers (Carrier/TPA Management) ---

/**
 * @description Registers an insurance carrier or TPA with GSTIN verification
 * @access PRIVATE [ADMIN]
 */
const addInsuranceProvider = async (req, res, next) => {
  try {
    const data = await insuranceService.addInsuranceProvider(req.body, req.user.id);
    Response.sendCreated(res, data, 'Insurance provider onboarded successfully');
  } catch (error) { next(error); }
};

const getInsuranceProviderById = async (req, res, next) => {
  try {
    const data = await insuranceService.getInsuranceProviderById(req.params.providerId);
    Response.sendSuccess(res, data, 'Provider details retrieved');
  } catch (error) { next(error); }
};

/**
 * @description Updates carrier details and re-schedules empanelment expiry jobs
 */
const updateInsuranceProvider = async (req, res, next) => {
  try {
    const data = await insuranceService.updateInsuranceProvider(req.params.providerId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Insurance provider updated');
  } catch (error) { next(error); }
};

const listInsuranceProviders = async (req, res, next) => {
  try {
    const pagination = paginationUtil.extractPaginationParams(req.query);
    const data = await insuranceService.listInsuranceProviders(req.query, pagination);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  } catch (error) { next(error); }
};

// --- 2. Patient Insurance Policies ---

/**
 * @description Registers patient policy with clinical sum-insured mapping
 */
const addPatientInsurance = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const data = await insuranceService.addPatientInsurance(patientId, req.body, req.user.id);
    Response.sendCreated(res, data, 'Patient insurance policy registered');
  } catch (error) { next(error); }
};

/**
 * @description Real-time verification for clinical procedure coverage
 */
const verifyInsuranceEligibility = async (req, res, next) => {
  try {
    const { patientId, providerId } = req.params;
    const { serviceDate, serviceType } = req.query;
    const data = await insuranceService.verifyInsuranceEligibility(patientId, providerId, serviceDate, serviceType);
    Response.sendSuccess(res, data, 'Eligibility verification completed');
  } catch (error) { next(error); }
};

// --- 3. Pre-Authorizations ---

/**
 * @description Initiates a clinical pre-auth request with PDF generation
 */
const createPreAuthorization = async (req, res, next) => {
  try {
    const data = await insuranceService.createPreAuthorization(req.params.patientId, req.body, req.user.id);
    Response.sendCreated(res, data, 'Pre-authorization request submitted to carrier');
  } catch (error) { next(error); }
};

/**
 * @description Updates pre-auth status (APPROVED/REJECTED) and triggers billing hooks
 */
const updatePreAuthorizationStatus = async (req, res, next) => {
  try {
    const data = await insuranceService.updatePreAuthorizationStatus(req.params.preAuthId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Pre-authorization status updated');
  } catch (error) { next(error); }
};

// --- 4. Claims & Settlements ---

/**
 * @description Submits a final insurance claim post-billing
 */
const createInsuranceClaim = async (req, res, next) => {
  try {
    const data = await insuranceService.createInsuranceClaim(req.body.billId, req.body.patientInsuranceId, req.body, req.user.id);
    Response.sendCreated(res, data, 'Insurance claim submitted successfully');
  } catch (error) { next(error); }
};

/**
 * @description Processes financial settlement from carrier with shortfall accounting
 * @access PRIVATE [ADMIN, ACCOUNTANT]
 */
const processClaimSettlement = async (req, res, next) => {
  try {
    if (!['ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      throw new ForbiddenError('FinancialSecurityError: Insufficient clearance to process claim settlements');
    }
    const data = await insuranceService.processClaimSettlement(req.params.claimId, req.body, req.user.id);
    Response.sendSuccess(res, data, 'Claim settlement processed and billing records updated');
  } catch (error) { next(error); }
};

/**
 * @description Aggregated Insurance Dashboard for clinical and financial leads
 */
const getInsuranceDashboard = async (req, res, next) => {
  try {
    const data = await insuranceService.getInsuranceDashboard();
    Response.sendSuccess(res, data, 'Insurance dashboard metrics retrieved');
  } catch (error) { next(error); }
};

const disputeInsuranceClaim = async (req, res, next) => {
  try {
    const data = await insuranceService.disputeInsuranceClaim(req.params.claimId, req.body, req.user.id);
    Response.sendCreated(res, data, 'Claim dispute initiated with provider');
  } catch (error) { next(error); }
};

module.exports = {
  addInsuranceProvider,
  getInsuranceProviderById,
  updateInsuranceProvider,
  listInsuranceProviders,
  searchInsuranceProviders: async (req, res, next) => {
    if (req.query.q?.length < 2) throw new BadRequestError('Inquiry Error: Search query must be at least 2 characters');
    const data = await insuranceService.searchInsuranceProviders(req.query.q);
    Response.sendSuccess(res, data, 'Search results retrieved');
  },
  deactivateInsuranceProvider: async (req, res, next) => {
    if (req.user.role !== 'ADMIN') throw new ForbiddenError('Access Denied');
    await insuranceService.updateInsuranceProvider(req.params.providerId, { isActive: false }, req.user.id);
    Response.sendSuccess(res, null, 'Provider deactivated');
  },
  addPatientInsurance,
  getPatientInsuranceById: async (req, res, next) => Response.sendSuccess(res, await insuranceService.getPatientInsuranceById(req.params.insuranceId), 'Patient insurance retrieved'),
  verifyInsuranceEligibility,
  createPreAuthorization,
  updatePreAuthorizationStatus,
  createInsuranceClaim,
  processClaimSettlement,
  disputeInsuranceClaim,
  getInsuranceDashboard,
  getClaimsByPatient: async (req, res, next) => {
    const pagination = paginationUtil.extractPaginationParams(req.query);
    const data = await insuranceService.getClaimsByPatient(req.params.patientId, req.query, pagination);
    Response.sendPaginatedResponse(res, data.items, data.pagination);
  }
};
