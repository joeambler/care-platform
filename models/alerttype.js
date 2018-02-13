'use strict';
module.exports = (sequelize, DataTypes) => {
  var AlertType = sequelize.define('AlertType', {
    type: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return AlertType;
};