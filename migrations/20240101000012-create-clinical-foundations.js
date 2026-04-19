'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Vitals
      await queryInterface.createTable('vitals', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        patient_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'patients', key: 'id' } },
        appointment_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'appointments', key: 'id' } },
        recorded_by: { type: Sequelize.BIGINT.UNSIGNED },
        height: { type: Sequelize.DECIMAL(5, 2), comment: 'in cm' },
        weight: { type: Sequelize.DECIMAL(5, 2), comment: 'in kg' },
        bmi: { type: Sequelize.DECIMAL(4, 2) },
        temperature: { type: Sequelize.DECIMAL(4, 1), comment: 'in Fahrenheit' },
        pulse: { type: Sequelize.INTEGER, comment: 'bpm' },
        respiratory_rate: { type: Sequelize.INTEGER, comment: 'breaths/min' },
        systolic_bp: { type: Sequelize.INTEGER },
        diastolic_bp: { type: Sequelize.INTEGER },
        oxygen_saturation: { type: Sequelize.INTEGER, comment: 'SpO2 %' },
        recorded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      // 2. Medicines
      await queryInterface.createTable('medicines', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        name: { type: Sequelize.STRING(255), allowNull: false },
        generic_name: { type: Sequelize.STRING(255) },
        category: { type: Sequelize.STRING(50) },
        form: { type: Sequelize.ENUM('tablet', 'capsule', 'syrup', 'injection', 'ointment', 'other'), defaultValue: 'tablet' },
        strength: { type: Sequelize.STRING(50) },
        manufacturer: { type: Sequelize.STRING(255) },
        unit_price: { type: Sequelize.DECIMAL(10, 2) },
        stock_quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
        is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('medicines');
    await queryInterface.dropTable('vitals');
  }
};
