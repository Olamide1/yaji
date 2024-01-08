'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('submenus', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      menu_id: {
        type: Sequelize.INTEGER,
      },
      stripe_product_id: {
        type: Sequelize.STRING,
        comment: 'The stripe product id.',
      },
      stripe_product_price_id: {
        type: Sequelize.STRING,
        comment: 'The price of the associated product.',
      },
      price: {
        type: Sequelize.FLOAT,
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'eur',
        allowNull: false,
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
    await queryInterface.dropTable('submenus');
  }
};