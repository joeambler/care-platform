'use strict'
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    details: DataTypes.STRING,
    date: {
      type: DataTypes.DATE,
      notNull: true,
    },
  })

  Event.associate = (models) => {
    Event.belongsTo(models.EventType)
    Event.belongsTo(models.DeviceInstance)
    Event.belongsTo(models.ClientComponent,
      {as: 'Component', foreignKey: 'componentId'})

  }

  return Event
}