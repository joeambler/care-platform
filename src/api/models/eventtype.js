'use strict';
module.exports = (sequelize, DataTypes) => {
    const EventType = sequelize.define('EventType', {
        type: DataTypes.STRING
    });
    EventType.associate = (models) => {
        // associations can be defined here
    };
    return EventType;
};