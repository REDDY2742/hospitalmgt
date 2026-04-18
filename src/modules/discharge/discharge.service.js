const { 
  Admission, 
  Bed, 
  Bill, 
  DischargeSummary, 
  DischargeCertificate, 
  Patient, 
  FollowUp, 
  User, 
  sequelize 
} = require('../../models');
const { generateDischargePDF, generateDischargeCertificatePDF } = require('../../utils/pdf.util');
const { uploadToS3 } = require('../../utils/s3.util');
const { sendEmail } = require('../../utils/email.util');
const { sendSMS } = require('../../utils/sms.util');
const { 
  NotFoundError, 
  ValidationError, 
  AppError 
} = require('../../utils/appError.util');
const logger = require('../../utils/logger.util');

/**
 * Hospital Discharge Management Service
 * 
 * Orchestrates the clinical and administrative exit lifecycle: Safety gates, 
 * ICD-10 summaries, and 30-day readmission surveillance.
 */

class DischargeService {
  /**
   * Discharge Workflow Initiation
   */
  async initiateDischarge(admissionId, initiatedBy) {
    const admission = await Admission.findByPk(admissionId);
    if (!admission || admission.status !== 'ADMITTED') {
      throw new ValidationError('Invalid admission state for discharge initiation');
    }

    const transaction = await sequelize.transaction();
    try {
      await admission.update({
        dischargeStatus: 'IN_PROGRESS',
        dischargeInitiatedAt: new Date(),
        dischargeInitiatedBy: initiatedBy
      }, { transaction });

      // Notify Billing & Pharmacy (Placeholders)
      logger.info(`Discharge initiated for Admission: ${admissionId}. Notifying cross-functional departments...`);

      await transaction.commit();
      return { status: 'IN_PROGRESS', checklistPending: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Clinical Discharge Summary Completion (ICD-10 Integrated)
   */
  async completeDischargeSummary(admissionId, summaryData, doctorId) {
    const admission = await Admission.findByPk(admissionId, { include: ['patient'] });
    if (!admission) throw new NotFoundError('Admission record not found');

    const transaction = await sequelize.transaction();
    try {
      // 1. Persist Clinical Narrative
      const summary = await DischargeSummary.create({
        admissionId,
        doctorId,
        ...summaryData, // finalDiagnosis, clinicalCourse, medications, followUp
        isLocked: false,
        timestamp: new Date()
      }, { transaction });

      // 2. Generate Brand-Compliant PDF
      const pdfBuffer = await generateDischargePDF(summary, admission.patient);
      const s3Url = await uploadToS3(pdfBuffer, `discharge-summaries/${admissionId}.pdf`, 'DISCHARGE_DOCS');

      await summary.update({ s3Url }, { transaction });
      await transaction.commit();

      return { summaryId: summary.id, s3Url };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Hard-Gated Finalization (Clinical + Financial Exit)
   */
  async finalizeDischarge(admissionId, finalizedBy) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Integrity Gates
      const admission = await Admission.findByPk(admissionId, { 
        include: [{ model: Bill, as: 'bills' }, { model: DischargeSummary, as: 'summary' }],
        transaction 
      });

      // gate: check bill payment
      const unpaidBill = admission.bills.find(b => b.status === 'PENDING');
      if (unpaidBill) throw new AppError('Cannot finalize discharge: Outstanding patient dues exist.', 403);

      // gate: check clinical summary
      if (!admission.summary) throw new AppError('Cannot finalize discharge: Clinical discharge summary is pending doctor sign-off.', 403);

      // 2. State Transitions
      const dischargeTime = new Date();
      const lengthOfStay = Math.ceil((dischargeTime - admission.admissionDate) / (1000 * 60 * 60 * 24));

      await admission.update({
        status: 'DISCHARGED',
        dischargeDate: dischargeTime,
        lengthOfStay,
        finalizedBy
      }, { transaction });

      // 3. Infrastructure Release (Bed -> CLEANING)
      if (admission.currentBedId) {
        await Bed.update({ status: 'CLEANING' }, { where: { id: admission.currentBedId }, transaction });
      }

      // 4. Legal Document Generation (Certificate)
      const certificateNumber = `CERT-${admissionId.slice(-6)}-${Date.now().toString().slice(-4)}`;
      const certBuffer = await generateDischargeCertificatePDF(admission, certificateNumber);
      const certUrl = await uploadToS3(certBuffer, `certificates/${admissionId}.pdf`, 'DISCHARGE_CERT');

      await DischargeCertificate.create({
        admissionId,
        certificateNumber,
        s3Url: certUrl,
        finalizedBy
      }, { transaction });

      await transaction.commit();

      // 5. Patient Out-reach
      this._notifyPatientDischarge(admission, certUrl);

      return { status: 'DISCHARGED', certificateUrl: certUrl };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 30-Day Readmission Sentinel
   */
  async checkReadmissionRisk(patientId) {
    const lastDischarge = await Admission.findOne({
      where: { patientId, status: 'DISCHARGED' },
      order: [['dischargeDate', 'DESC']]
    });

    if (lastDischarge) {
      const diffDays = (new Date() - lastDischarge.dischargeDate) / (1000 * 60 * 60 * 24);
      if (diffDays <= 30) {
        logger.warn(`READMISSION ALERT: Patient ${patientId} is returning within 30 days. Prioritize review.`);
        return { isRisk: true, daysSinceLastDischarge: Math.floor(diffDays) };
      }
    }
    return { isRisk: false };
  }

  /**
   * Internal: Final Out-reach Orchestration
   */
  async _notifyPatientDischarge(admission, documentUrl) {
    const patient = await Patient.findByPk(admission.patientId);
    
    // 1. Secure Email with Clinical Summary
    await sendEmail(patient.email, 'DISCHARGE_FINALIZED', {
      name: patient.firstName,
      documentUrl,
      followUpDate: admission.summary?.followUpDate || 'TBD'
    });

    // 2. SMS Instruction Link
    const smsMsg = `Discharge Finalized: Download your summary and follow-up instructions here: ${documentUrl}. Emergency Contact: 1066.`;
    await sendSMS(patient.phone, smsMsg).catch(() => {});
  }
}

module.exports = new DischargeService();
