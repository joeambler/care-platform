'use strict';
module.exports = (sequelize, DataTypes) => {
    var UserClient = sequelize.define('UserClient', {
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        tentative: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return UserClient;
};