'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Lab Tests & Results
      await queryInterface.createTable('lab_tests', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        name: { type: Sequelize.STRING(100), allowNull: false },
        code: { type: Sequelize.STRING(20), unique: true },
        category: { type: Sequelize.STRING(50) },
        price: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      await queryInterface.createTable('lab_results', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        patient_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'patients', key: 'id' } },
        test_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'lab_tests', key: 'id' } },
        result_value: { type: Sequelize.JSON, comment: 'Structured results' },
        status: { type: Sequelize.ENUM('pending', 'preliminary', 'verified', 'rejected'), defaultValue: 'pending' },
        recorded_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      // 2. Inventory & Stock
      await queryInterface.createTable('inventory_items', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        name: { type: Sequelize.STRING(100), allowNull: false },
        current_stock: { type: Sequelize.INTEGER, defaultValue: 0 },
        reorder_level: { type: Sequelize.INTEGER, defaultValue: 10 },
        unit_measure: { type: Sequelize.STRING(20) },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      // 3. Ambulances & OT
      await queryInterface.createTable('ambulances', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        vehicle_number: { type: Sequelize.STRING(20), unique: true },
        type: { type: Sequelize.ENUM('basic_life_support', 'advanced_life_support', 'mortuary'), defaultValue: 'basic_life_support' },
        status: { type: Sequelize.ENUM('available', 'on_mission', 'out_of_service'), defaultValue: 'available' },
        current_location: { type: Sequelize.JSON, comment: 'Lat/Lng coordinates' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ambulances');
    await queryInterface.dropTable('inventory_items');
    await queryInterface.dropTable('lab_results');
    await queryInterface.dropTable('lab_tests');
  }
};
