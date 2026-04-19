'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('billing_invoices', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        invoice_number: { type: Sequelize.STRING(30), allowNull: false, unique: true },
        patient_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
          references: { model: 'patients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT'
        },
        appointment_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
          references: { model: 'appointments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
        },
        admission_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
        bill_date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        due_date: { type: Sequelize.DATE, allowNull: true },
        total_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00, comment: 'Gross amount before discount' },
        discount_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        tax_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        net_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00, comment: 'Final payable amount' },
        paid_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        balance_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        status: { type: Sequelize.ENUM('draft', 'unpaid', 'partially_paid', 'paid', 'cancelled', 'refunded'), defaultValue: 'unpaid' },
        payment_method: { type: Sequelize.ENUM('cash', 'card', 'upi', 'net_banking', 'insurance', 'other'), allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('billing_invoices'); }
};
