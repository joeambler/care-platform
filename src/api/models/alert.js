'use strict'
module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    details: DataTypes.STRING,
    date: DataTypes.DATE,
  }, {})
  Alert.associate = function (models) {
    Alert.belongsTo(models.AlertType)
    Alert.belongsTo(models.ClientComponent,
      {as: 'Component', foreignKey: 'componentId'})
  }
  return Alert
}