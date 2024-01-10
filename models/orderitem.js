'use strict';
const {
  Model
} = require('sequelize');
const slugify = require('slugify')

module.exports = (sequelize, DataTypes) => {
  class Orderitem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      /**
       * .belongsTo() have the foreign keys.
       * The foreign keys are defined in the Source models.
       * 
       * .hasMany() / hasOne() have the onUpdate/onDelete
       */
      Orderitem.belongsTo(models.order)

      Orderitem.belongsToMany(models.submenu, {
        through: models.orderitemsubmenu
      })
    }
  }
  Orderitem.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    quantity: {
      type: DataTypes.INTEGER,
      comment: 'The quantity of the submenu item that was ordered',
      validate: {
        isNumeric: true,
        isInt: true,
      }
    },
    order_id: {
      type: DataTypes.INTEGER,
    },
  }, {
    sequelize,
    modelName: 'orderitem',
    timestamps: true,
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });
  // Orderitem.sync({ alter: true })
  return Orderitem;
};