'use strict';
const {
  Model
} = require('sequelize');
const slugify = require('slugify')

module.exports = (sequelize, DataTypes) => {
  class Submenu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Submenu.belongsTo(models.menu)

      Submenu.belongsToMany(models.orderitem, {
        through: models.orderitemsubmenu
      })
    }
  }
  Submenu.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
    },
    menu_id: {
      type: DataTypes.INTEGER,
      // TODO: Add references later
      // references: {}
    },
    stripe_product_id: {
      type: DataTypes.STRING,
      comment: 'The stripe product id.',
    },
    stripe_product_price_id: {
      type: DataTypes.STRING,
      comment: 'The price of the associated product.',
    },
    price: {
      type: DataTypes.FLOAT,
    },
    currency: {
      type: DataTypes.STRING,
      values: ['eur', 'usd'],
      defaultValue: 'eur',
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'submenu',
    timestamps: true,
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });
  // Submenu.sync({ alter: true })
  return Submenu;
};