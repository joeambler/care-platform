'use strict'
module.exports = (sequelize, DataTypes) => {
  const PasswordResetCode = sequelize.define('PasswordResetCode', {
    resetCodeHash: DataTypes.STRING,
    expiryTime: DataTypes.DATE,
  })

  PasswordResetCode.associate = function (models) {
    PasswordResetCode.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
    })
  }

  return PasswordResetCode
}