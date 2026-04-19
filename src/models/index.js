const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger.util');

// Load environment variables
dotenv.config();

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

/**
 * @typedef {import('sequelize').Sequelize} SequelizeInstance
 * @typedef {import('sequelize').ModelStatic<any>} Model
 */

/**
 * Database Singleton Container
 * @type {{
 *  sequelize: SequelizeInstance,
 *  Sequelize: typeof Sequelize,
 *  [key: string]: Model | any
 * }}
 */
const db = {};

// Connection Pool Configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: (msg) => (env === 'development' ? logger.debug(`[Sequelize] ${msg}`) : false),
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },
  dialectOptions: {
    decimalNumbers: true,
    dateStrings: true,
    typeCast: true,
  },
  timezone: '+05:30', // Clinical Standard Timezone for India
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

let sequelize;

/**
 * Initializes the Sequelize instance with exponential backoff retry logic.
 * @param {number} maxRetries - Maximum number of connection attempts.
 * @param {number} delay - Initial delay in milliseconds.
 * @returns {Promise<SequelizeInstance>}
 */
async function initializeSequelize(maxRetries = 5, delay = 1000) {
  if (sequelize) return sequelize;

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    dbConfig
  );

  for (let i = 0; i < maxRetries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('MySQL Database successfully connected and authenticated.');
      return sequelize;
    } catch (error) {
      const waitTime = delay * Math.pow(2, i);
      logger.error(`Database connection attempt ${i + 1}/${maxRetries} failed: ${error.message}`);
      
      if (i === maxRetries - 1) {
        logger.error('CRITICAL: Database connection failed after maximum retries.');
        throw error;
      }
      
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Start connection process immediately (it will run in background if not awaited)
initializeSequelize().catch((err) => {
  logger.error('Immediate DB Initialization failed:', err);
});

// 1. Dynamic Model Discovery & Loading
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-9) === '.model.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    try {
      // Each model should export a function: (sequelize, DataTypes) => Model
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.info(`Model loaded successfully: ${model.name}`);
    } catch (error) {
      logger.error(`Failed to load model from file ${file}: ${error.message}`);
    }
  });

/**
 * Setup Orchestrated Associations for the Hospital Management System
 */
const setupAssociations = () => {
  const {
    User, Doctor, Staff, Nurse, Patient,
    Appointment, MedicalRecord, Billing, Prescription, LabTest,
    Emergency, Discharge, Ward, Room, Bed, Payment,
    Insurance, Pharmacy, Medicine, PrescriptionItem, LabResult,
    BloodBank, BloodRequest, Ambulance, Dispatch,
    Inventory, InventoryTransaction, Supplier, PurchaseOrder,
    Notification, AuditLog, Department, OTSchedule, TelemedicineSession,
    WardAssignment, PatientCareNote
  } = db;

  // --- Identity & Access Management (Polymorphic Role Binding) ---
  if (User) {
    if (Doctor) User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
    if (Staff) User.hasOne(Staff, { foreignKey: 'userId', as: 'staffProfile' });
    if (Nurse) User.hasOne(Nurse, { foreignKey: 'userId', as: 'nurseProfile' });
    if (Patient) User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
    if (Notification) User.hasMany(Notification, { foreignKey: 'userId' });
    if (AuditLog) User.hasMany(AuditLog, { foreignKey: 'userId' });
  }

  // --- Patient Records & Clinical History ---
  if (Patient) {
    if (Appointment) Patient.hasMany(Appointment, { foreignKey: 'patientId' });
    if (MedicalRecord) Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
    if (Billing) Patient.hasMany(Billing, { foreignKey: 'patientId' });
    if (Prescription) Patient.hasMany(Prescription, { foreignKey: 'patientId' });
    if (LabTest) Patient.hasMany(LabTest, { foreignKey: 'patientId' });
    if (Emergency) Patient.hasMany(Emergency, { foreignKey: 'patientId' });
    if (Discharge) Patient.hasMany(Discharge, { foreignKey: 'patientId' });
  }

  // --- Clinical Workspace & Workflow ---
  if (Doctor) {
    if (Appointment) Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
    if (Prescription) Doctor.hasMany(Prescription, { foreignKey: 'doctorId' });
    if (OTSchedule) Doctor.hasMany(OTSchedule, { foreignKey: 'doctorId' });
    if (TelemedicineSession) Doctor.hasMany(TelemedicineSession, { foreignKey: 'doctorId' });
    if (Department) Doctor.belongsTo(Department, { foreignKey: 'departmentId' });
  }

  // --- Nursing & Care Management ---
  if (Nurse) {
    if (WardAssignment) Nurse.hasMany(WardAssignment, { foreignKey: 'nurseId' });
    if (PatientCareNote) Nurse.hasMany(PatientCareNote, { foreignKey: 'nurseId' });
  }

  // --- Facility Management (Wards/Rooms/Beds) ---
  if (Ward) {
    if (Room) Ward.hasMany(Room, { foreignKey: 'wardId' });
    if (Bed) Ward.hasMany(Bed, { foreignKey: 'wardId' });
  }
  if (Room) {
    if (Bed) Room.hasMany(Bed, { foreignKey: 'roomId' });
    if (Ward) Room.belongsTo(Ward, { foreignKey: 'wardId' });
  }
  if (Bed) {
    if (Room) Bed.belongsTo(Room, { foreignKey: 'roomId' });
    if (Ward) Bed.belongsTo(Ward, { foreignKey: 'wardId' });
  }

  // --- Financial Ecosystem ---
  if (Billing) {
    if (Payment) Billing.hasMany(Payment, { foreignKey: 'billingId' });
    if (Insurance) Billing.hasOne(Insurance, { foreignKey: 'billingId', as: 'insuranceClaim' });
  }

  // --- Pharmacy & Medication Logistics ---
  if (Pharmacy) {
    if (Medicine) Pharmacy.hasMany(Medicine, { foreignKey: 'pharmacyId' });
  }
  if (Prescription) {
    if (PrescriptionItem) Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId' });
  }
  if (PrescriptionItem && Medicine) {
    PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicineId' });
  }

  // --- Laboratory & Diagnostic Services ---
  if (LabTest) {
    if (LabResult) LabTest.hasMany(LabResult, { foreignKey: 'labTestId' });
  }

  // --- Blood Bank Operations ---
  if (BloodBank) {
    if (BloodRequest) BloodBank.hasMany(BloodRequest, { foreignKey: 'bloodBankId' });
  }

  // --- Logistics & Emergency Services ---
  if (Ambulance) {
    if (Dispatch) Ambulance.hasMany(Dispatch, { foreignKey: 'ambulanceId' });
  }

  // --- Inventory & Procurement ---
  if (Inventory) {
    if (InventoryTransaction) Inventory.hasMany(InventoryTransaction, { foreignKey: 'inventoryId' });
  }
  if (Supplier) {
    if (PurchaseOrder) Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
  }

  // --- Cross-Cutting Concerns ---
  if (Notification) Notification.belongsTo(User, { foreignKey: 'userId' });
  if (AuditLog) AuditLog.belongsTo(User, { foreignKey: 'userId' });

  // Call separate associate methods if defined in models
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
};

// Initialize associations
setupAssociations();

/**
 * Connection Health Check
 * @returns {Promise<{status: string, message?: string, timestamp: string}>}
 */
const checkHealth = async () => {
  try {
    await sequelize.authenticate();
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    };
  } catch (error) {
    return {
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      message: error.message
    };
  }
};

/**
 * Graceful Closure of Database Connections
 */
const handleGracefulShutdown = async () => {
  if (sequelize) {
    try {
      logger.info('Closing database connection pool...');
      await sequelize.close();
      logger.info('Database connection pool closed successfully.');
    } catch (err) {
      logger.error(`Error during database shutdown: ${err.message}`);
    }
  }
};

process.on('SIGTERM', handleGracefulShutdown);
process.on('SIGINT', handleGracefulShutdown);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.checkHealth = checkHealth;

module.exports = db;
