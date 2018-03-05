'use strict';
module.exports = (sequelize, DataTypes) => {
    const DeviceInstance = sequelize.define('DeviceInstance', {
        properties: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    DeviceInstance.associate = (models) => {
        DeviceInstance.belongsTo(models.DeviceType);
    };

    return DeviceInstance;
};