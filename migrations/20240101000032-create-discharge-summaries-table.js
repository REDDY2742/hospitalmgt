'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('discharge_summaries', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        patient_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'patients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        admission_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        discharge_date: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        discharge_type: { type: Sequelize.ENUM('regular', 'ama', 'transfer', 'death'), defaultValue: 'regular' },
        final_diagnosis: { type: Sequelize.TEXT, allowNull: false },
        treatment_summary: { type: Sequelize.TEXT },
        medicated_on_discharge: { type: Sequelize.JSON, comment: 'List of discharge medicines' },
        follow_up_instructions: { type: Sequelize.TEXT },
        doctor_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          references: { model: 'doctors', key: 'id' }
        },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('discharge_summaries'); }
};
