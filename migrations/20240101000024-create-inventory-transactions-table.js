'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('inventory_transactions', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        item_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'inventory_items', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        transaction_type: { type: Sequelize.ENUM('stock_in', 'stock_out', 'return', 'adjustment', 'transfer'), allowNull: false },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        previous_stock: { type: Sequelize.INTEGER, allowNull: false },
        new_stock: { type: Sequelize.INTEGER, allowNull: false },
        reason: { type: Sequelize.TEXT },
        performed_by: { type: Sequelize.BIGINT.UNSIGNED },
        reference_id: { type: Sequelize.STRING(100), comment: 'PO ID or Invoice ID' },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('inventory_transactions'); }
};
