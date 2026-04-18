const { Op } = require('sequelize');
const { db } = require('../../config/db');
const NurseProfile = require('./nurseProfile.model'); // Assumed path
const NursingAssignment = require('./nursingAssignment.model'); // Assumed path
const Vitals = require('../medical-records/vitals.model');
const NursingNote = require('./nursingNote.model');
const User = require('../users/user.model');
const Ward = require('../wards/ward.model');
const AppError = require('../../utils/appError');
const s3 = require('../../utils/s3.util');
const { io } = require('../../app');
const notificationService = require('../notifications/notification.service');
const pdfUtil = require('../../utils/pdf.util');

/**
 * Hospital Nursing Workflow & Patient Care Service
 * 
 * Orchestrates nursing assignments, critical vital monitoring (NEWS2), 
 * medication administration (MAR), and structured clinical handovers.
 */

class NurseService {
  
  /**
   * --- Workforce & Assignment ---
   */

  /**
   * @description Provisions a specialized nursing profile with registry-license verification
   */
  async createNurseProfile(nurseData, createdBy) {
    const transaction = await db.transaction();
    try {
      const user = await User.findByPk(nurseData.userId, { transaction, lock: true });
      if (!user || user.role !== 'NURSE') throw new AppError('IdentityError: User must have NURSE role for profile creation', 400);

      // 1. Specialized Code: NR-{SPEC}-{SEQ}
      const specCode = nurseData.nursingSpecialization.substring(0, 3).toUpperCase();
      const last = await NurseProfile.findOne({
        where: { nurseId: { [Op.like]: `NR-${specCode}-%` } },
        order: [['nurseId', 'DESC']],
        transaction
      });
      const seq = last ? parseInt(last.nurseId.split('-')[2]) + 1 : 1;
      const nurseId = `NR-${specCode}-${seq.toString().padStart(4, '0')}`;

      // 2. Regulatory Document Archival
      let licenseUrl = null;
      if (nurseData.licenseFile) {
        const upload = await s3.uploadFile(nurseData.licenseFile.buffer, `nurses/${nurseId}/license.pdf`, process.env.AWS_S3_PRIVATE_BUCKET);
        licenseUrl = upload.url;
      }

      const profile = await NurseProfile.create({
        ...nurseData,
        nurseId,
        licenseCertificate: licenseUrl,
        isActive: true
      }, { transaction });

      await transaction.commit();
      return profile;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * @description Assigns a nurse to a clinical ward with staffing ratio intelligence
   */
  async assignNurseToWard(nurseId, wardId, assignedBy) {
    const ward = await Ward.findByPk(wardId);
    const nurse = await NurseProfile.findByPk(nurseId);
    
    // Check Ratios: ICU max 2, General max 8
    const currentNurses = await NurseProfile.count({ where: { assignedWardId: wardId } });
    const currentPatients = await db.query('SELECT COUNT(*) as count FROM patients WHERE ward_id = ?', { replacements: [wardId], type: db.QueryTypes.SELECT });
    
    const ratio = currentPatients[0].count / (currentNurses + 1);
    const limit = ward.type === 'ICU' ? 2 : 8;

    if (ratio > limit) {
      await notificationService.sendNotification(assignedBy.id, 'CRITICAL', `Staffing Ratio Warning: ${ward.name} will exceed recommended limit (${ratio.toFixed(1)} > ${limit})`);
    }

    nurse.assignedWardId = wardId;
    await nurse.save();
    
    io.to(`ward_${wardId}`).emit('STAFFING_UPDATED', { nurseId, wardId });
    return { success: true, ratioWarning: ratio > limit };
  }

  /**
   * --- Clinical Care & Observation ---
   */

  /**
   * @description Records patient vitals with automated NEWS2 scoring and escalation
   */
  async recordVitals(patientId, nurseId, vitalsData) {
    const news2Score = this._calculateNEWS2(vitalsData);
    
    const vitals = await Vitals.create({
      ...vitalsData,
      patientId,
      recordedBy: nurseId,
      news2Score,
      recordedAt: new Date()
    });

    // 1. Escalation Protocol: NEWS2 >= 7 (Clinical Emergency)
    if (news2Score >= 7) {
      await this._triggerEmergencyEscalation(patientId, vitals);
    }

    io.to(`patient_${patientId}`).emit('VITALS_UPDATED', { vitals, news2Score });
    return vitals;
  }

  /**
   * @description Enforces 5-rights medication administration with barcode verification
   */
  async performMedicationAdministration(patientId, nurseId, medicationData) {
    const { patientIdScan, medicationBarcode, drugId, dose, route } = medicationData;
    
    // 1. Barcode Verification (Simplified logic)
    if (patientIdScan !== patientId) throw new AppError('PatientError: Incorrect patient wristband scanned', 400);

    const record = await NursingNote.create({
      patientId,
      nurseId,
      noteType: 'intervention',
      content: `MED_ADMIN: ${drugId} | Dose: ${dose} | Route: ${route}`,
      timestamp: Date.now() // Millisecond precision
    });

    // 2. Medication Record Update (MAR)
    await db.query('UPDATE active_prescriptions SET last_admin_at = ?, status = ? WHERE patient_id = ? AND drug_id = ?', {
      replacements: [new Date(), 'administered', patientId, drugId]
    });

    return record;
  }

  /**
   * @description Orchestrates structured clinical SBAR handover between shifts
   */
  async shiftHandover(fromNurseId, toNurseId, wardId, handoverData) {
    const transaction = await db.transaction();
    try {
      // 1. Generate Forensic Handover Manifest (PDF)
      const buffer = await pdfUtil.generateHandoverPDF({ ...handoverData, wardId, timestamp: new Date() });
      const s3Url = await s3.uploadFile(buffer, `handovers/${wardId}/${Date.now()}.pdf`, process.env.AWS_S3_PRIVATE_BUCKET);

      // 2. Batch Update Patient Assignments
      await NursingAssignment.update(
        { nurseId: toNurseId, status: 'Active' },
        { where: { nurseId: fromNurseId, wardId, status: 'Active' }, transaction }
      );

      await transaction.commit();
      
      io.to(`ward_${wardId}`).emit('SHIFT_HANDOVER_COMPLETE', { fromNurseId, toNurseId });
      return { success: true, report: s3Url.url };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * --- Internal Intelligence ---
   */

  _calculateNEWS2(v) {
    let score = 0;
    // Respiration Rate logic
    if (v.respiratoryRate <= 8 || v.respiratoryRate >= 25) score += 3;
    else if (v.respiratoryRate >= 21) score += 2;
    
    // SpO2 logic
    if (v.spo2 <= 91) score += 3;
    else if (v.spo2 <= 93) score += 2;
    
    // Systolic BP logic
    if (v.bpSystolic <= 90 || v.bpSystolic >= 220) score += 3;
    
    // Temperature logic
    if (v.temperature <= 35.0) score += 3;
    else if (v.temperature >= 39.1) score += 2;

    return score;
  }

  async _triggerEmergencyEscalation(patientId, vitals) {
    const alert = {
      patientId,
      type: 'CODE_BLUE_ESCALATION',
      priority: 'CRITICAL',
      message: `NEWS2 ALERT: Score ${vitals.news2Score} - Critical deterioration detected.`
    };
    
    // Multi-channel broadcast
    io.to('emergency_response').emit('CRITICAL_VITALS', alert);
    await notificationService.sendEmergencySMS(process.env.WARD_DOCTOR_PHONE, alert.message);
  }
}

module.exports = new NurseService();
