'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderitemSubmenu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  OrderitemSubmenu.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    orderitem_id: DataTypes.INTEGER,
    submenu_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'orderitemsubmenu',
    underscored: true,
  });
  // OrderitemSubmenu.sync({ alter: true })
  return OrderitemSubmenu;
};