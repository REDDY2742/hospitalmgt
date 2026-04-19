'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Full-Text Search Indexes (Performance for high-volume clinical lookup)
      // Patient Search
      await queryInterface.sequelize.query(
        'ALTER TABLE patients ADD FULLTEXT INDEX idx_patient_search (patient_code, referred_by)',
        { transaction }
      );
      
      // User naming search (across roles)
      await queryInterface.sequelize.query(
        'ALTER TABLE users ADD FULLTEXT INDEX idx_user_name_search (first_name, last_name, email, phone)',
        { transaction }
      );

      // Medicine lookup
      await queryInterface.sequelize.query(
        'ALTER TABLE medicines ADD FULLTEXT INDEX idx_medicine_search (name, generic_name)',
        { transaction }
      );

      // 2. Composite Performance Indexes
      // Appointment availability check (Doctor + Date)
      await queryInterface.addIndex('appointments', ['doctor_id', 'appointment_date', 'status'], {
        name: 'idx_doctor_slot_availability',
        transaction
      });

      // Daily Revenue Audit Index
      await queryInterface.addIndex('billing_invoices', ['bill_date', 'status'], {
        name: 'idx_daily_billing_audit',
        transaction
      });

      // Lab Result tracking
      await queryInterface.addIndex('vitals', ['patient_id', 'recorded_at'], {
        name: 'idx_patient_vitals_timeline',
        transaction
      });

      // 3. Foreign Key Orchestration Logic
      // Ensure strict constraint naming: fk_tablename_columnname
      // Note: In a production HMS, we often favor partial application here to ensure 
      // some constraints exist before the app starts if they weren't matched in createTable.

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('billing_invoices', 'idx_daily_billing_audit', { transaction });
      await queryInterface.removeIndex('appointments', 'idx_doctor_slot_availability', { transaction });
      // Fulltext indexes removal
      await queryInterface.sequelize.query('ALTER TABLE patients DROP INDEX idx_patient_search', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE users DROP INDEX idx_user_name_search', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE medicines DROP INDEX idx_medicine_search', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
