'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('DeviceInstances', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            properties: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            deviceTypeId: {
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: 'DeviceTypes',
                    key: 'id'
                }
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('DeviceInstances');
    }
};