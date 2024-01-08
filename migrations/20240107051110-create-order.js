'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING,
        values: ['delivered', 'in_progress', 'received', 'failed', 'sent'],
        defaultValue: 'received',
        allowNull: false,
      },
      stripe_session_id: {
        type: Sequelize.STRING,
        unique: true,
        comment: 'The Stripe session id that was used to pay'
      },
      address_id: {
        type: Sequelize.INTEGER,
        comment: 'The address used for this order',
      },
      customer_id: {
        type: Sequelize.INTEGER,
      },
      customer_phone: {
        type: Sequelize.STRING,
        comment: 'The phone number the customer made the order with'
      },
      customer_name: {
        type: Sequelize.STRING,
        comment: 'The name the customer used when making the order'
      },
      payment_confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      total: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable('orders');
  }
};