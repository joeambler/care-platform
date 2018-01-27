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
        },
        canAddModules: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    User.associate = function (models) {
        console.log("!");
        User.belongsTo(models.Name, {foreignKey:{
            name : 'nameId',
                notNull: true
            }
        });
        User.belongsToMany(models.Client, {
            through: 'UserClient',
            as: 'Clients',
            foreignkey: 'ClientId'
        });
    };

    return User;
};