'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordSalt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    canAddModules: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    classMethods: {
      associate: function(models) {
        User.hasOne(models.Name, {
          foreignKey: 'nameID',
          as: 'name'
        })
      }
    }
  });
  return User;
};