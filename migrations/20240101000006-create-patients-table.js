'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('patients', {
        id: {
          allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED
        },
        uuid: {
          type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true
        },
        user_id: {
          type: Sequelize.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        patient_code: {
          type: Sequelize.STRING(20), allowNull: false, unique: true, comment: 'Institutional UHID'
        },
        date_of_birth: {
          type: Sequelize.DATEONLY, allowNull: false
        },
        gender: {
          type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'), allowNull: false
        },
        blood_group: {
          type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: true
        },
        marital_status: {
          type: Sequelize.ENUM('single', 'married', 'divorced', 'widowed', 'other'), allowNull: true
        },
        occupation: {
          type: Sequelize.STRING(100), allowNull: true
        },
        nationality: {
          type: Sequelize.STRING(50), defaultValue: 'Indian'
        },
        religion: {
          type: Sequelize.STRING(50), allowNull: true
        },
        address: {
          type: Sequelize.JSON, allowNull: true, comment: 'Structured JSON address (Street, City, State, Zip)'
        },
        emergency_contact: {
          type: Sequelize.JSON, allowNull: true, comment: 'Name, Relationship, Phone'
        },
        allergies: {
          type: Sequelize.JSON, allowNull: true, comment: 'List of drug/food allergies'
        },
        chronic_conditions: {
          type: Sequelize.JSON, allowNull: true, comment: 'Pre-existing medical conditions'
        },
        insurance_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: true
        },
        registration_date: {
          type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        patient_type: {
          type: Sequelize.ENUM('opd', 'ipd', 'emergency'), defaultValue: 'opd'
        },
        referred_by: {
          type: Sequelize.STRING(100), allowNull: true
        },
        profile_complete: {
          type: Sequelize.TINYINT(1), defaultValue: 0
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
    await queryInterface.dropTable('patients');
  }
};
