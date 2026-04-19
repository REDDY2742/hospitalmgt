'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('audit_logs', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        event_type: { type: Sequelize.STRING(50), allowNull: false, comment: 'CREATE, UPDATE, DELETE, LOGIN, DOWNLOAD' },
        module: { type: Sequelize.STRING(50), allowNull: false, comment: 'Patients, Billing, Users, etc.' },
        record_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        old_values: { type: Sequelize.JSON, allowNull: true },
        new_values: { type: Sequelize.JSON, allowNull: true },
        ip_address: { type: Sequelize.STRING(45), allowNull: true },
        user_agent: { type: Sequelize.TEXT, allowNull: true },
        action_url: { type: Sequelize.TEXT, allowNull: true },
        device_info: { type: Sequelize.JSON, allowNull: true },
        status: { type: Sequelize.ENUM('success', 'failure', 'unauthorized'), defaultValue: 'success' },
        severity: { type: Sequelize.ENUM('info', 'low', 'medium', 'high', 'critical'), defaultValue: 'info' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      // Add forensic index for compliance searching
      await queryInterface.addIndex('audit_logs', ['event_type', 'module'], { transaction });
      await queryInterface.addIndex('audit_logs', ['user_id', 'created_at'], { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('audit_logs'); }
};
