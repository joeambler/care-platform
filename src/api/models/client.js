'use strict'
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
  })

  Client.associate = function (models) {
    Client.belongsTo(models.Name, {
      as: 'name',
      foreignKey: {
        name: 'nameId',
        allowNull: true,
      },
    })
    Client.belongsToMany(models.User, {
      through: models.UserClient,
      as: 'Users',
      foreignKey: 'clientId',
    })
    Client.hasMany(models.ClientComponent, {
      as: 'Components',
    })
  }
  return Client
}