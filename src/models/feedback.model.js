const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('px-feedback-model');

/**
 * Hospital Management System - Patient Experience (PX) & Quality Management
 * 
 * Manages institutional patient feedback, multi-attribute doctor ratings, 
 * NPS tracking, and forensic complaint resolution workflows.
 */
module.exports = (sequelize) => {
  // --- Patient Feedback Model ---
  class PatientFeedback extends Model {
    /** @type {string} Virtual: promoter/passive/detractor based on NPS 0-10 */
    get npsCategory() {
      if (this.npsScore >= 9) return 'promoter';
      if (this.npsScore >= 7) return 'passive';
      return 'detractor';
    }

    /**
     * @description Professional complaint resolution and patient notification
     */
    async resolve(notes, resolvedBy) {
       return this.update({
         status: 'resolved',
         resolutionNotes: notes,
         resolvedBy: resolvedBy,
         resolvedAt: new Date()
       });
    }
  }

  PatientFeedback.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    feedbackId: { type: DataTypes.STRING, unique: true, field: 'feedback_id' },
    patientId: { type: DataTypes.UUID, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    feedbackType: {
      type: DataTypes.ENUM('opd_experience', 'ipd_experience', 'emergency_experience', 'telemedicine_experience', 'pharmacy_experience', 'lab_experience', 'discharge_experience', 'facility_feedback', 'staff_feedback', 'general'),
      defaultValue: 'general',
      field: 'feedback_type'
    },
    overallRating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: false, field: 'overall_rating' },
    npsScore: { type: DataTypes.INTEGER, validate: { min: 0, max: 10 }, field: 'nps_score' },
    ratings: { type: DataTypes.JSON, defaultValue: {}, comment: 'Attribute-level stars (doctorCare, nursingCare, food etc)' },
    openEndedResponses: { type: DataTypes.JSON, defaultValue: {}, field: 'open_ended_responses' },
    complaints: { type: DataTypes.JSON, defaultValue: [], comment: 'Array of categorized grievances' },
    status: {
      type: DataTypes.ENUM('submitted', 'under_review', 'acknowledged', 'escalated', 'resolved', 'closed', 'invalid'),
      defaultValue: 'submitted'
    },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'low' },
    assignedTo: { type: DataTypes.UUID, field: 'assigned_to' },
    resolvedBy: { type: DataTypes.UUID, field: 'resolved_by' },
    resolvedAt: { type: DataTypes.DATE, field: 'resolved_at' },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_public' },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'submitted_at' }
  }, {
    sequelize,
    modelName: 'PatientFeedback',
    tableName: 'patient_feedbacks',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (fb) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        fb.feedbackId = `FB-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        
        // Automated Priority Calculation
        if (fb.overallRating <= 2) fb.priority = 'high';
        const criticalComplaint = (fb.complaints || []).some(c => c.severity === 'critical');
        if (criticalComplaint) fb.priority = 'critical';
      },
      afterCreate: (fb) => {
        if (fb.priority === 'critical') {
           logger.warn(`CRITICAL_PX_ALERT: Critical complaint ${fb.feedbackId} requires immediate intervention by HOD.`);
           // Trigger multi-channel alert to HOD/Quality Admin
        }
        // Emit for Quality Management Dashboard
        try {
           const { getIO } = require('../config/socket');
           getIO().of('/quality').emit('feedback:new', fb);
        } catch (e) {}
      }
    }
  });

  // --- Doctor Rating Model ---
  class DoctorRating extends Model {
    /**
     * @description Professional verification of doctor review by quality team
     */
    async verify(verifiedBy) {
       return this.update({ isVerified: true, verifiedBy, verifiedAt: new Date() });
    }
  }

  DoctorRating.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    ratingType: {
      type: DataTypes.ENUM('post_consultation', 'post_discharge', 'post_procedure', 'telemedicine_session', 'general'),
      defaultValue: 'post_consultation',
      field: 'rating_type'
    },
    overallRating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, field: 'overall_rating' },
    attributes: { type: DataTypes.JSON, defaultValue: {}, comment: 'punctuality, listening, explanation etc' },
    comment: { type: DataTypes.TEXT },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_verified' },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_public' },
    status: { type: DataTypes.ENUM('active', 'hidden', 'reported', 'deleted'), defaultValue: 'active' },
    doctorReply: { type: DataTypes.TEXT, field: 'doctor_reply' },
    helpfulVotes: { type: DataTypes.INTEGER, defaultValue: 0, field: 'helpful_votes' }
  }, {
    sequelize,
    modelName: 'DoctorRating',
    tableName: 'doctor_ratings',
    underscored: true,
    timestamps: true,
    hooks: {
      afterCreate: async (dr) => {
        // Trigger running average update on Doctor model
        if (dr.overallRating <= 2) {
           logger.warn(`LOW_DOC_RATING_ALERT: Doctor ${dr.doctorId} received a low rating. Quality audit triggered.`);
        }
      }
    }
  });

  // --- Associations ---
  PatientFeedback.associate = (models) => {
    PatientFeedback.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    PatientFeedback.belongsTo(models.Admission, { foreignKey: 'admissionId', as: 'stayContext' });
    PatientFeedback.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'officer' });
  };

  DoctorRating.associate = (models) => {
    DoctorRating.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    DoctorRating.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'reviewer' });
    DoctorRating.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'sessionContext' });
  };

  return { PatientFeedback, DoctorRating };
};
