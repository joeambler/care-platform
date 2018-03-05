'use strict';

module.exports = (sequelize, DataTypes) => {
    var Permission = sequelize.define('Permission', {
        type: DataTypes.ENUM('event', 'device', 'alert'),
        tentative: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });

    Permission.associate = function (models) {
        Permission.belongsTo(models.AlertType);
        Permission.belongsTo(models.EventType);
        Permission.belongsTo(models.DeviceType);
    };
    return Permission;
};