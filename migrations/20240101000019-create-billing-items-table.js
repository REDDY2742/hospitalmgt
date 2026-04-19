'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('billing_items', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        invoice_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'billing_invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        item_name: { type: Sequelize.STRING(255), allowNull: false },
        item_type: { type: Sequelize.ENUM('consultation', 'lab_test', 'medicine', 'procedure', 'room_rent', 'ambulance', 'other'), allowNull: false },
        unit_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        quantity: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1.00 },
        total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('billing_items'); }
};
