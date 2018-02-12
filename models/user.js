'use strict';
module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    User.associate = function (models) {
        User.belongsTo(models.Name, {
            foreignKey: {
                name: 'nameId',
                notNull: true
            },
            as: 'name'
        });
        User.belongsToMany(models.Client, {
            through: models.UserClient,
            as: 'Clients',
            foreignKey: 'userId'
        });
    };

    return User;
};