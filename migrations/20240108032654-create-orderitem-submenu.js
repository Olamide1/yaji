'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orderitemsubmenus', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      orderitem_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'orderitems',
          key: 'id'
        }
      },
      submenu_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'submenus',
          key: 'id'
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orderitemsubmenus');
  }
};