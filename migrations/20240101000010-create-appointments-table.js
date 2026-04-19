'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('appointments', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        patient_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
          references: { model: 'patients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
        },
        doctor_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
          references: { model: 'doctors', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
        },
        department_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
          references: { model: 'departments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
        },
        appointment_date: { type: Sequelize.DATEONLY, allowNull: false },
        appointment_time: { type: Sequelize.TIME, allowNull: false },
        token_number: { type: Sequelize.INTEGER, allowNull: true },
        status: {
          type: Sequelize.ENUM('scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'),
          defaultValue: 'scheduled'
        },
        type: { type: Sequelize.ENUM('first_visit', 'follow_up', 'consultation', 'emergency'), defaultValue: 'first_visit' },
        reason: { type: Sequelize.TEXT, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        cancellation_reason: { type: Sequelize.STRING(255), allowNull: true },
        is_paid: { type: Sequelize.TINYINT(1), defaultValue: 0 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('appointments'); }
};
