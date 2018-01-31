'use strict';
module.exports = (sequelize, DataTypes) => {
    var Client = sequelize.define('Client', {
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });

    Client.associate = function (models) {
        Client.belongsTo(models.Name, {
            foreignKey: {
                name: 'nameId',
                allowNull: true
            }
        });
        Client.belongsToMany(models.User, {
            through: models.UserClient,
            as: 'Users',
            forignkey: 'userId'
        });
    };
    return Client;
}