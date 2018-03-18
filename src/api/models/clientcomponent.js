'use strict';
module.exports = (sequelize, DataTypes) => {
    // noinspection JSCheckFunctionSignatures
    const ClientModule = sequelize.define('ClientComponent', {
        key: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('event', 'model'),
            allowNull: false
        },
        name: {
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
        ClientModule.hasMany(models.Event, {foreignKey : 'componentId'});
        ClientModule.hasMany(models.Alert, {foreignKey : 'componentId'});
    };
    return ClientModule;
};