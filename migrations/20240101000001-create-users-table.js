'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('users', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT.UNSIGNED
        },
        uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          unique: true
        },
        role: {
          type: Sequelize.ENUM(
            'super_admin', 'admin', 'doctor', 'nurse', 'staff', 
            'patient', 'pharmacist', 'lab_technician', 'accountant', 'receptionist'
          ),
          allowNull: false,
          defaultValue: 'patient'
        },
        first_name: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        last_name: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
          unique: true
        },
        password_hash: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        profile_image: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        is_active: {
          type: Sequelize.TINYINT(1),
          defaultValue: 1
        },
        is_email_verified: {
          type: Sequelize.TINYINT(1),
          defaultValue: 0
        },
        is_phone_verified: {
          type: Sequelize.TINYINT(1),
          defaultValue: 0
        },
        two_factor_enabled: {
          type: Sequelize.TINYINT(1),
          defaultValue: 0
        },
        two_factor_secret: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        last_login_ip: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        login_attempts: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        locked_until: {
          type: Sequelize.DATE,
          allowNull: true
        },
        refresh_token_hash: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        password_reset_token: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        password_reset_expiry: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
