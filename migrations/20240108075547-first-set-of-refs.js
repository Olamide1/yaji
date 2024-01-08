'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addConstraint('submenus', {
      fields: ['menu_id'],
      type: 'foreign key',
      name: '1_menu_id_fkey_ref_menus_ixj',
      references: {
          table: 'menus',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('orderitems', {
      fields: ['order_id'],
      type: 'foreign key',
      name: '2_order_id_fkey_ref_orders_bwl',
      references: {
          table: 'orders',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('addresses', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: '3_cus_id_fkey_ref_customers_nbt',
      references: {
          table: 'customers',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('orderaddresses', {
      fields: ['address_id'],
      type: 'foreign key',
      name: '4_addr_id_fkey_ref_addresses_zop',
      references: {
          table: 'addresses',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('orderaddresses', {
      fields: ['order_id'],
      type: 'foreign key',
      name: '5_ord_id_fkey_ref_orders_phw',
      references: {
          table: 'orders',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('orderitemsubmenus', {
      fields: ['orderitem_id'],
      type: 'foreign key',
      name: '6_ord_itm_id_fkey_ref_orderitems_mwd',
      references: {
          table: 'orderitems',
          field: 'id',
      },
    })

    await queryInterface.addConstraint('orderitemsubmenus', {
      fields: ['submenu_id'],
      type: 'foreign key',
      name: '7_smenu_id_fkey_ref_submenus_dkl',
      references: {
          table: 'submenus',
          field: 'id',
      },
    })
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeConstraint(
        'submenus',
        '1_menu_id_fkey_ref_menus_ixj'
    )
    await queryInterface.removeConstraint(
      'orderitems',
      '2_order_id_fkey_ref_orders_bwl'
    )
    await queryInterface.removeConstraint(
      'addresses',
      '3_cus_id_fkey_ref_customers_nbt'
    )
    await queryInterface.removeConstraint(
      'orderaddresses',
      '4_addr_id_fkey_ref_addresses_zop'
    )
    await queryInterface.removeConstraint(
      'orderaddresses',
      '5_ord_id_fkey_ref_orders_phw'
    )
    await queryInterface.removeConstraint(
      'orderitemsubmenus',
      '6_ord_itm_id_fkey_ref_orderitems_mwd'
    )
    await queryInterface.removeConstraint(
      'orderitemsubmenus',
      '7_smenu_id_fkey_ref_submenus_dkl'
    )
  }
};
