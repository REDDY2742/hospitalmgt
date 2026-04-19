'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('attendance', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        user_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        shift_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          references: { model: 'shifts', key: 'id' }
        },
        date: { type: Sequelize.DATEONLY, allowNull: false },
        clock_in: { type: Sequelize.DATE },
        clock_out: { type: Sequelize.DATE },
        status: { type: Sequelize.ENUM('present', 'absent', 'late', 'half_day', 'on_leave'), defaultValue: 'present' },
        late_minutes: { type: Sequelize.INTEGER, defaultValue: 0 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('attendance'); }
};
