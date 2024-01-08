'use strict';
const { Op } = require('sequelize')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    try {
      // menus
      await queryInterface.bulkInsert('menus', [{
        id: 1,
        name: 'Rice & Beans',
        description: 'This is the real rice and beans.',
        out_of_stock: false,
        created_at: new Date(),
        updated_at: new Date()
      }, {
        id: 2,
        name: 'Bread',
        description: 'This is today\'s bread.',
        out_of_stock: false,
        created_at: new Date(),
        updated_at: new Date()
      }]);

      // submenus
      await queryInterface.bulkInsert('submenus', [{
        id: 1,
        name: 'Big',
        menu_id: 1,
        stripe_product_id: 'prod_PKnypefVeUEW4q',
        stripe_product_price_id: 'price_1OW8M6L4pn7XXHF5OyXEhnnq',
        price: 12,
        created_at: new Date(),
        updated_at: new Date()
      }, {
        id: 2,
        name: 'Mid',
        menu_id: 1,
        stripe_product_id: 'prod_PKnyBuiQ5ANneD',
        stripe_product_price_id: 'price_1OW8M6L4pn7XXHF5JS05Qlu7',
        price: 304,
        created_at: new Date(),
        updated_at: new Date()
      }, {
        id: 3,
        name: 'Strong',
        menu_id: 2,
        stripe_product_id: 'prod_PKo0Js57hEzChL',
        stripe_product_price_id: 'price_1OW8OtL4pn7XXHF50btcrGFs',
        price: 12,
        created_at: new Date(),
        updated_at: new Date()
      }, {
        id: 4,
        name: 'Old',
        menu_id: 2,
        stripe_product_id: 'prod_PKo0rEGoeYhoWE',
        stripe_product_price_id: 'price_1OW8OuL4pn7XXHF5hGUAwkOH',
        price: 193,
        created_at: new Date(),
        updated_at: new Date()
      }, {
        id: 5,
        name: 'Sliced',
        menu_id: 2,
        stripe_product_id: 'prod_PKo0oMuCaY59Js',
        stripe_product_price_id: 'price_1OW8OvL4pn7XXHF5I3c0jCbX',
        price: 56,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    } catch (error) {
      console.error('error seeding up', __filename);
      console.error('with error', error);
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    try {
      // delete submenus first - just incase, for constraints...
      await queryInterface.bulkDelete('submenus', {
          id: {
              [Op.in]: [1, 2, 3, 4, 5],
          },
      }, {});

      // delete menus
      await queryInterface.bulkDelete('menus', {
          id: {
              [Op.in]: [1, 2],
          },
      }, {});
    } catch (error) {
      console.error('error seeding down', __filename);
      console.error('with error', error);
    }


  }
};
