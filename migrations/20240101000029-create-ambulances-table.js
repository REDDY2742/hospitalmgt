'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('ambulances', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        vehicle_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        model: { type: Sequelize.STRING(50) },
        type: { type: Sequelize.ENUM('basic', 'advanced', 'cardiac', 'mortuary'), defaultValue: 'basic' },
        status: { type: Sequelize.ENUM('available', 'on_trip', 'busy', 'maintenance', 'offline'), defaultValue: 'available' },
        driver_name: { type: Sequelize.STRING(100) },
        driver_phone: { type: Sequelize.STRING(20) },
        current_location: { type: Sequelize.JSON, comment: 'Lat/Lng coordinates' },
        is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('ambulances'); }
};
