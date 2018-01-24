'use strict';
module.exports = (sequelize, DataTypes) => {
  var Name = sequelize.define('Name', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstNames: {
      type: DataTypes.STRING,
      allowNull: false;
    },
    surnames: {
      type: DataTypes.STRING,
      allowNull: false;
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Name;
};