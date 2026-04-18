const { sequelize } = require('../config/database');
const User = require('./user.model.js');
const AuditLog = require('./auditLog.model.js');

// Add more models here...

module.exports = {
  sequelize,
  User,
  AuditLog
};
