'use strict';
const {
  Model
} = require('sequelize');
const slugify = require('slugify')

module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Address.belongsTo(models.customer);

      Address.belongsToMany(models.order, {
        through: models.orderaddress
      });
    }
  }
  Address.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    customer_id: {
      type: DataTypes.INTEGER,
    },
    full_address: {
      type: DataTypes.STRING,
      comment: 'One liner address'
    },
    /**
     * Maybe later, start adding address line one, state, city, street, google maps id or sth, etc.
     */
    // type: 'home',
    // line1: '100 Main St.',
    // city: 'Austin',
    // state: 'TX',
    // zip: '78704'
  }, {
    sequelize,
    modelName: 'address',
    timestamps: true,
    underscored: true,
  });
  // Address.sync({ alter: true })
  return Address;
};