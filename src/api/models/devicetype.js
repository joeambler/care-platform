'use strict'
module.exports = (sequelize, DataTypes) => {
  const DeviceType = sequelize.define('DeviceType', {
    type: DataTypes.STRING,
    prototype: DataTypes.STRING,
  })
  DeviceType.associate = (models) => {
    // associations can be defined here
  }
  return DeviceType
}