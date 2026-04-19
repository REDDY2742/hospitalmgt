'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Staff Table
      await queryInterface.createTable('staff', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        user_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'users', key: 'id' } },
        staff_code: { type: Sequelize.STRING(20), unique: true },
        designation: { type: Sequelize.STRING(100) },
        department_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'departments', key: 'id' } },
        joining_date: { type: Sequelize.DATEONLY },
        is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      // 2. Nurses Table
      await queryInterface.createTable('nurses', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        user_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'users', key: 'id' } },
        nurse_code: { type: Sequelize.STRING(20), unique: true },
        qualification: { type: Sequelize.JSON },
        experience_years: { type: Sequelize.INTEGER },
        department_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'departments', key: 'id' } },
        is_available: { type: Sequelize.TINYINT(1), defaultValue: 1 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      // 3. Rooms
      await queryInterface.createTable('rooms', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        ward_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'wards', key: 'id' } },
        room_number: { type: Sequelize.STRING(20), allowNull: false },
        room_type: { type: Sequelize.ENUM('semi_private', 'private', 'deluxe', 'suite', 'icu_bed'), defaultValue: 'semi_private' },
        status: { type: Sequelize.ENUM('available', 'occupied', 'under_maintenance'), defaultValue: 'available' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
      }, { transaction });

      // 4. Beds
      await queryInterface.createTable('beds', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        room_id: { type: Sequelize.BIGINT.UNSIGNED, references: { model: 'rooms', key: 'id' } },
        bed_number: { type: Sequelize.STRING(20), allowNull: false },
        bed_type: { type: Sequelize.ENUM('manual', 'semi_electric', 'electric', 'fowler'), defaultValue: 'manual' },
        status: { type: Sequelize.ENUM('available', 'occupied', 'reserved', 'under_maintenance'), defaultValue: 'available' },
        current_patient_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('beds');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('nurses');
    await queryInterface.dropTable('staff');
  }
};
