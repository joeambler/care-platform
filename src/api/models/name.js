'use strict'
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Name', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstNames: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    surnames: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  })
}