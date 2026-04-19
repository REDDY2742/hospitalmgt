'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('telemedicine_sessions', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        appointment_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'appointments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        room_name: { type: Sequelize.STRING(100), allowNull: false },
        provider_name: { type: Sequelize.ENUM('daily_co', 'agora', 'zoom'), defaultValue: 'daily_co' },
        recording_url: { type: Sequelize.STRING(255) },
        start_time: { type: Sequelize.DATE },
        end_time: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM('scheduled', 'active', 'completed', 'failed'), defaultValue: 'scheduled' },
        doctor_joined: { type: Sequelize.TINYINT(1), defaultValue: 0 },
        patient_joined: { type: Sequelize.TINYINT(1), defaultValue: 0 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('telemedicine_sessions'); }
};
