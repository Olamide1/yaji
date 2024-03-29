'use strict';
const {
  Model
} = require('sequelize');
const slugify = require('slugify')

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.hasMany(models.order)
      Customer.hasMany(models.address)
    }
  }
  Customer.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      }
    },
  }, {
    sequelize,
    modelName: 'customer',
    timestamps: true,
    underscored: true,
    comment: 'Usually to hold the unique emails of our users.',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });
  // Customer.sync({ alter: true })
  return Customer;
};