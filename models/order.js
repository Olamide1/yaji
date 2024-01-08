'use strict';
const {
  Model
} = require('sequelize');
const slugify = require('slugify')

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.hasMany(models.orderitem, {
        /**
         * We don't want you deleting or updating an order.
         * What if the user got the order wrong?
         * Then update the order items.
         */
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      });

      Order.belongsTo(models.customer);

      // Order.hasOne(models.address, {
      //   foreignKey: 'order_id'
      // });

      Order.belongsToMany(models.address, {
        through: models.orderaddress,
      })
    }
  }
  Order.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    status: { // should be an enum of possible statuses
      type: DataTypes.STRING,
      values: ['delivered', 'in_progress', 'received', 'failed', 'sent'],
      defaultValue: 'received',
      allowNull: false,
    },
    stripe_session_id: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
    },
    customerId: { // link to a customer.
      type: DataTypes.INTEGER,
    },
    addressId: {
      type: DataTypes.INTEGER,
      comment: 'The address used for this order',
    },
    payment_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    total: {
      type: DataTypes.FLOAT,
    },
  }, {
    sequelize,
    modelName: 'order',
    timestamps: true,
    underscored: true,
  });
  // Order.sync({ alter: true })
  return Order;
};