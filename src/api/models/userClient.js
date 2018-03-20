'use strict'
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserClient', {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tentative: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  })
}