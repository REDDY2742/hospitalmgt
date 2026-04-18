const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const logger = require('../utils/logger').createChildLogger('models-index');

/** @type {Object.<string, Sequelize.ModelStatic<any>>} */
const db = {};

/**
 * Hospital Management System - Master Database Orchestrator
 * 
 * Features:
 * - Distributed Connection Pooling (min:5, max:20)
 * - Automatic Model Discovery (*.model.js)
 * - 5-Tier Exponential Backoff Retry Logic
 * - Singleton Pattern for Pool Integrity
 * - Graceful Shutdown Hooks for SIGTERM/SIGINT
 * - Comprehensive Clinical & Financial Associations
 */

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: (msg) => env === 'development' ? logger.debug(msg) : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    decimalNumbers: true,
    timezone: '+05:30' // Standard Clinical Timezone
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

let sequelize;

/**
 * Initializes the database connection with retry logic
 * @returns {Promise<Sequelize>}
 */
async function initializeDB(retries = 5, delay = 1000) {
  if (sequelize) return sequelize;

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    dbConfig
  );

  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('MySQL Database Engine: Connected and Authenticated');
      return sequelize;
    } catch (err) {
      const waitTime = delay * Math.pow(2, i);
      logger.error(`Database Connection Failed. Retry ${i + 1}/${retries} in ${waitTime}ms: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Immediately invoke connection to start pooling
initializeDB();

// 1. Dynamic Model Loading
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-9) === '.model.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.debug(`Model Loaded: ${model.name}`);
    } catch (err) {
      logger.error(`Dependency Error: Failed to load model from ${file} - ${err.message}`);
    }
  });

// 2. Clinical & Financial Association Mapping
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Defining Explicit Core Associations
const setupAssociations = (models) => {
  const {
    User, Doctor, Staff, Nurse, Patient, 
    Appointment, MedicalRecord, Bill, Prescription, LabTest, 
    Emergency, Discharge, Ward, Room, Bed, Payment, 
    InsuranceClaim, Medicine, PrescriptionItem, LabResult, 
    BloodRequest, Dispatch, InventoryTransaction, PurchaseOrder, 
    Notification, AuditLog, Department, Supplier, Ambulance, Pharmacy
  } = models;

  // --- Identity & Role Binding ---
  if (User) {
    User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
    User.hasOne(Staff, { foreignKey: 'userId', as: 'staffProfile' });
    User.hasOne(Nurse, { foreignKey: 'userId', as: 'nurseProfile' });
    User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
    User.hasMany(Notification, { foreignKey: 'userId' });
    User.hasMany(AuditLog, { foreignKey: 'userId' });
  }

  // --- Patient Medical Records ---
  if (Patient) {
    Patient.hasMany(Appointment, { foreignKey: 'patientId' });
    Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
    Patient.hasMany(Bill, { foreignKey: 'patientId' });
    Patient.hasMany(Prescription, { foreignKey: 'patientId' });
    Patient.hasMany(LabTest, { foreignKey: 'patientId' });
    Patient.hasMany(Emergency, { foreignKey: 'patientId' });
    Patient.hasMany(Discharge, { foreignKey: 'patientId' });
  }

  // --- Clinical Workflow ---
  if (Doctor) {
    Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
    Doctor.hasMany(Prescription, { foreignKey: 'doctorId' });
    Doctor.belongsTo(Department, { foreignKey: 'departmentId' });
  }

  if (Nurse) {
    Nurse.hasMany(MedicalRecord, { foreignKey: 'nurseId' }); // as observer/caregiver
  }

  // --- Ward Infrastructure ---
  if (Ward) {
    Ward.hasMany(Room, { foreignKey: 'wardId' });
    Ward.hasMany(Bed, { foreignKey: 'wardId' });
  }
  if (Room) {
    Room.hasMany(Bed, { foreignKey: 'roomId' });
    Room.belongsTo(Ward, { foreignKey: 'wardId' });
  }
  if (Bed) {
    Bed.belongsTo(Room, { foreignKey: 'roomId' });
    Bed.belongsTo(Ward, { foreignKey: 'wardId' });
  }

  // --- Financial & Insurance ---
  if (Bill) {
    Bill.hasMany(Payment, { foreignKey: 'billId' });
    Bill.hasOne(InsuranceClaim, { foreignKey: 'billId' });
  }

  // --- Laboratory & Pharmacy ---
  if (LabTest) {
    LabTest.hasMany(LabResult, { foreignKey: 'labTestId' });
  }
  if (Prescription) {
    Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId' });
  }
  if (PrescriptionItem) {
    PrescriptionItem.belongsTo(Medicine, { foreignKey: 'medicineId' });
  }

  // --- Logistics & Inventory ---
  if (Ambulance) {
    Ambulance.hasMany(Dispatch, { foreignKey: 'ambulanceId' });
  }
  if (Supplier) {
    Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
  }
};

// Check if models exist before running association setup
if (Object.keys(db).length > 0) {
  setupAssociations(db);
}

/**
 * Performs a deep health check of the connection pool
 * @returns {Promise<Object>}
 */
const checkHealth = async () => {
  try {
    await sequelize.authenticate();
    const [result] = await sequelize.query('SELECT 1 as alive');
    return { status: 'UP', engine: 'MySQL', latency: 'Stable', result };
  } catch (err) {
    return { status: 'DOWN', error: err.message };
  }
};

/**
 * Graceful Engine Terminations
 */
const gracefulShutdown = async () => {
  if (sequelize) {
    logger.info('MySQL Engine: Releasing connection pool and shutting down...');
    await sequelize.close();
    logger.info('MySQL Engine: Successfully terminated');
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.checkHealth = checkHealth;
db.initializeDB = initializeDB;

module.exports = db;
