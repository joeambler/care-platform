'use strict';
module.exports = (sequelize, DataTypes) => {
    var ClientModule = sequelize.define('ClientModule', {
        key: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        moduleType: {
            type: DataTypes.ENUM('event', 'model'),
            allowNull: false
        },
        moduleName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apiEndPoint: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    ClientModule.associate = function (models) {
        ClientModule.hasMany(models.Permission);
        ClientModule.belongsTo(models.Client);
    };
    return ClientModule;
};