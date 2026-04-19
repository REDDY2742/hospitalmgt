'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('insurance_claims', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED },
        uuid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
        patient_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'patients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        provider_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'insurance_providers', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        invoice_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'billing_invoices', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        claim_number: { type: Sequelize.STRING(50), unique: true },
        policy_number: { type: Sequelize.STRING(50) },
        claim_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        approved_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.00 },
        status: { type: Sequelize.ENUM('pending', 'submitted', 'processed', 'approved', 'rejected', 'partially_approved'), defaultValue: 'pending' },
        submission_date: { type: Sequelize.DATE },
        approval_date: { type: Sequelize.DATE },
        rejection_reason: { type: Sequelize.TEXT },
        created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      await transaction.commit();
    } catch (err) { await transaction.rollback(); throw err; }
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('insurance_claims'); }
};
