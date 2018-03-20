'use strict'
module.exports = (sequelize, DataTypes) => {
  const AlertType = sequelize.define('AlertType', {
    type: DataTypes.STRING,
  })
  AlertType.associate = (models) => {
    // associations can be defined here
  }
  return AlertType
}