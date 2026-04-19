const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('telemedicine-model');

/**
 * Hospital Management System - Telemedicine & Virtual Care Model
 * 
 * Orchestrates secure video consultations, encrypted real-time chat, 
 * pre-consultation clinical telemetry, and digital clinical summaries.
 */
module.exports = (sequelize) => {
  // --- Telemedicine Session Model ---
  class TelemedicineSession extends Model {
    /**
     * @description Professional join logic for clinical participants
     */
    async join(userId, role) {
      const updateData = {};
      if (role === 'doctor') {
        updateData.doctorJoinedAt = new Date();
        if (this.status === 'patient_waiting') updateData.status = 'in_progress';
        else if (this.status === 'scheduled') updateData.status = 'doctor_waiting';
      } else if (role === 'patient') {
        updateData.patientJoinedAt = new Date();
        updateData.waitingStartedAt = this.waitingStartedAt || new Date();
        if (this.status === 'doctor_waiting') updateData.status = 'in_progress';
        else if (this.status === 'scheduled') updateData.status = 'patient_waiting';
      }
      return this.update(updateData);
    }

    /**
     * @description Finalizes clinical consultation and triggers downstream events
     */
    async completeSession(clinicalData) {
      return this.update({
        ...clinicalData,
        status: 'completed',
        actualEndTime: new Date()
      });
    }

    /**
     * @description Emergency Escalation Protocol
     */
    async detectEmergency(details) {
      return this.update({
        emergencyDetected: true,
        emergencyAction: details,
        emergencyAlertSentAt: new Date(),
        status: 'technical_failure' // Or specialized ENUM
      });
    }
  }

  TelemedicineSession.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Sequential Session ID (TM-YYYYMMDD-XXXXX) */
    sessionNumber: { type: DataTypes.STRING, unique: true, field: 'session_number' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    appointmentId: { type: DataTypes.UUID, field: 'appointment_id' },
    sessionType: {
      type: DataTypes.ENUM('video_consultation', 'audio_consultation', 'chat_consultation', 'second_opinion', 'follow_up_review', 'prescription_renewal', 'mental_health', 'nutrition_counseling'),
      defaultValue: 'video_consultation',
      field: 'session_type'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'patient_waiting', 'doctor_waiting', 'in_progress', 'completed', 'missed', 'cancelled', 'technical_failure', 'rescheduled'),
      defaultValue: 'scheduled'
    },
    scheduledAt: { type: DataTypes.DATE, allowNull: false, field: 'scheduled_at' },
    scheduledDuration: { type: DataTypes.INTEGER, defaultValue: 15, field: 'scheduled_duration' },
    actualStartTime: { type: DataTypes.DATE, field: 'actual_start_time' },
    actualEndTime: { type: DataTypes.DATE, field: 'actual_end_time' },
    waitingStartedAt: { type: DataTypes.DATE, field: 'waiting_started_at' },
    doctorJoinedAt: { type: DataTypes.DATE, field: 'doctor_joined_at' },
    patientJoinedAt: { type: DataTypes.DATE, field: 'patient_joined_at' },
    // --- Video Infrastructure ---
    videoProvider: {
      type: DataTypes.ENUM('jitsi', 'agora', 'twilio', 'daily_co', 'zoom_sdk', 'webrtc'),
      defaultValue: 'jitsi',
      field: 'video_provider'
    },
    roomId: { type: DataTypes.STRING, unique: true, field: 'room_id' },
    roomTokenDoctor: { type: DataTypes.TEXT, field: 'room_token_doctor' },
    roomTokenPatient: { type: DataTypes.TEXT, field: 'room_token_patient' },
    roomExpiresAt: { type: DataTypes.DATE, field: 'room_expires_at' },
    recordingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'recording_enabled' },
    recordingUrl: { type: DataTypes.STRING, field: 'recording_url' },
    // --- Pre-Consultation Patient Data ---
    chiefComplaint: { type: DataTypes.TEXT, field: 'chief_complaint' },
    /** @type {Object} {bp, pulse, temp, weight, spo2} */
    patientVitals: { type: DataTypes.JSON, field: 'patient_vitals', defaultValue: {} },
    previousReports: { type: DataTypes.JSON, field: 'previous_reports', defaultValue: [] },
    // --- Post-Consultation Clinical Content ---
    doctorNotes: { type: DataTypes.TEXT, field: 'doctor_notes' },
    clinicalSummary: { type: DataTypes.TEXT, field: 'clinical_summary' },
    diagnosis: { type: DataTypes.JSON, defaultValue: [] },
    treatmentPlan: { type: DataTypes.TEXT, field: 'treatment_plan' },
    prescriptionGenerated: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'prescription_generated' },
    prescriptionId: { type: DataTypes.UUID, field: 'prescription_id' },
    emergencyDetected: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'emergency_detected' },
    emergencyAction: { type: DataTypes.TEXT, field: 'emergency_action' },
    // --- Financials ---
    consultationFee: { type: DataTypes.DECIMAL(10, 2), field: 'consultation_fee' },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), field: 'total_amount' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'refunded', 'waived', 'failed'), defaultValue: 'pending', field: 'payment_status' },
    billId: { type: DataTypes.UUID, field: 'bill_id' },
    // --- Feedback ---
    patientRating: { type: DataTypes.INTEGER, field: 'patient_rating', validate: { min: 1, max: 5 } },
    patientFeedback: { type: DataTypes.TEXT, field: 'patient_feedback' }
  }, {
    sequelize,
    modelName: 'TelemedicineSession',
    tableName: 'telemedicine_sessions',
    underscored: true,
    hooks: {
      beforeCreate: async (sess) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await TelemedicineSession.count();
        sess.sessionNumber = `TM-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;
        sess.roomId = `ROOM-${sess.sessionNumber}-${Math.random().toString(36).substring(7)}`;
      },
      afterUpdate: async (sess) => {
        if (sess.changed('status')) {
           try {
             const { getIO } = require('../config/socket');
             getIO().of('/telemedicine').to(sess.id).emit('telemedicine:statusChanged', sess.status);
             
             if (sess.status === 'patient_waiting') {
               // Notify doctor via privileged socket
               getIO().of('/telemedicine').emit('telemedicine:doctorNotify', { type: 'patient_waiting', sessionId: sess.id });
             }
           } catch (e) {}
        }
      }
    }
  });

  // --- Telemedicine Chat Model ---
  class TelemedicineChat extends Model {}
  TelemedicineChat.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false, field: 'session_id' },
    senderId: { type: DataTypes.UUID, allowNull: false, field: 'sender_id' },
    senderRole: { type: DataTypes.ENUM('doctor', 'patient', 'system', 'participant'), field: 'sender_role' },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'document', 'audio', 'prescription', 'lab_order', 'vital_reading', 'system_event'),
      defaultValue: 'text',
      field: 'message_type'
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    attachmentUrl: { type: DataTypes.STRING, field: 'attachment_url' },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
    isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_encrypted' }
  }, {
    sequelize,
    modelName: 'TelemedicineChat',
    tableName: 'telemedicine_chats',
    underscored: true,
    hooks: {
      afterCreate: (chat) => {
        try {
          const { getIO } = require('../config/socket');
          getIO().of('/telemedicine').to(chat.sessionId).emit('telemedicine:chat:newMessage', chat);
        } catch (e) {}
      }
    }
  });

  /**
   * Telemedicine - Associations
   */
  TelemedicineSession.associate = (models) => {
    TelemedicineSession.hasMany(models.TelemedicineChat, { foreignKey: 'sessionId', as: 'chats' });
    TelemedicineSession.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    TelemedicineSession.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    TelemedicineSession.belongsTo(models.Appointment, { foreignKey: 'appointmentId', as: 'appointmentContext' });
    TelemedicineSession.belongsTo(models.Billing, { foreignKey: 'billId', as: 'bill' });
  };

  TelemedicineChat.associate = (models) => {
    TelemedicineChat.belongsTo(models.TelemedicineSession, { foreignKey: 'sessionId', as: 'session' });
    TelemedicineChat.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
  };

  return { TelemedicineSession, TelemedicineChat };
};
