'use strict';
module.exports = (sequelize, DataTypes) => {
  var EventType = sequelize.define('EventType', {
    type: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return EventType;
};