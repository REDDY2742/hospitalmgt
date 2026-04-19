'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('payments', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        invoice_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'billing_invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        payment_number: { type: Sequelize.STRING(30), allowNull: false, unique: true },
        amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        payment_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        payment_method: { type: Sequelize.ENUM('cash', 'card', 'upi', 'net_banking', 'cheque', 'insurance_claim'), allowNull: false },
        transaction_id: { type: Sequelize.STRING(100), allowNull: true, comment: 'Gateway Ref ID' },
        status: { type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'completed' },
        received_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('payments'); }
};
