'use strict';
module.exports = (sequelize, DataTypes) => {
  var DeviceType = sequelize.define('DeviceType', {
    type: DataTypes.STRING,
    prototype: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return DeviceType;
};