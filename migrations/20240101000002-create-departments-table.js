'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('departments', {
        id: {
          allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.BIGINT.UNSIGNED
        },
        uuid: {
          type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true
        },
        name: {
          type: Sequelize.STRING(100), allowNull: false, unique: true
        },
        code: {
          type: Sequelize.STRING(10), allowNull: false, unique: true
        },
        description: {
          type: Sequelize.TEXT, allowNull: true
        },
        head_of_department_id: {
          type: Sequelize.BIGINT.UNSIGNED, allowNull: true
        },
        is_active: {
          type: Sequelize.TINYINT(1), defaultValue: 1
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
    await queryInterface.dropTable('departments');
  }
};
