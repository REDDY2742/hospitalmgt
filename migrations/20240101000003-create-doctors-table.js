'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('doctors', {
        id: {
          allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED
        },
        uuid: {
          type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true
        },
        user_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        department_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'departments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        doctor_code: {
          type: Sequelize.STRING(20), allowNull: false, unique: true
        },
        specialization: {
          type: Sequelize.JSON, allowNull: false, comment: 'Array of medical specializations'
        },
        qualification: {
          type: Sequelize.JSON, allowNull: false, comment: 'Array of degree certificates'
        },
        experience_years: {
          type: Sequelize.INTEGER, allowNull: false
        },
        consultation_fee: {
          type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00
        },
        registration_number: {
          type: Sequelize.STRING(50), allowNull: false, unique: true
        },
        availability_schedule: {
          type: Sequelize.JSON, allowNull: true, comment: 'Complex weekly time slots'
        },
        max_patients_per_day: {
          type: Sequelize.INTEGER, defaultValue: 20
        },
        is_available: {
          type: Sequelize.TINYINT(1), defaultValue: 1
        },
        bio: {
          type: Sequelize.TEXT, allowNull: true
        },
        signature_image: {
          type: Sequelize.STRING(255), allowNull: true
        },
        created_at: {
          allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE, allowNull: true
        }
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('doctors');
  }
};
