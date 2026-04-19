'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('emergency_cases', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        patient_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'patients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        case_code: { type: Sequelize.STRING(20), unique: true },
        triage_level: { type: Sequelize.ENUM('immediate', 'very_urgent', 'urgent', 'standard', 'non_urgent'), defaultValue: 'standard' },
        arrival_mode: { type: Sequelize.ENUM('ambulance', 'walk_in', 'transfer'), defaultValue: 'walk_in' },
        chief_complaint: { type: Sequelize.TEXT },
        vital_signs_on_arrival: { type: Sequelize.JSON },
        assigned_doctor_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          references: { model: 'doctors', key: 'id' }
        },
        status: { type: Sequelize.ENUM('triage', 'treatment', 'observation', 'admitted', 'discharged', 'dead_on_arrival'), defaultValue: 'triage' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('emergency_cases'); }
};
