'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('inventory_items', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        code: { type: Sequelize.STRING(50), unique: true },
        category: { type: Sequelize.STRING(100) },
        current_stock: { type: Sequelize.INTEGER, defaultValue: 0 },
        reorder_level: { type: Sequelize.INTEGER, defaultValue: 10 },
        unit_measure: { type: Sequelize.STRING(50) },
        unit_price: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        is_active: { type: Sequelize.TINYINT(1), defaultValue: 1 },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('inventory_items'); }
};
