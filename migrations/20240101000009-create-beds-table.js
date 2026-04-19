'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('beds', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        room_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'rooms', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        bed_number: { type: Sequelize.STRING(20), allowNull: false },
        bed_type: { type: Sequelize.ENUM('manual', 'semi_electric', 'electric', 'fowler'), defaultValue: 'manual' },
        status: { type: Sequelize.ENUM('available', 'occupied', 'reserved', 'under_maintenance'), defaultValue: 'available' },
        current_patient_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'patients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('beds'); }
};
