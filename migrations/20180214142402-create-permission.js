'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Permissions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            type: {
                type: Sequelize.ENUM('event', 'device', 'alert')
            },
            tentative: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            ClientComponentId: {
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: 'ClientComponents',
                    key: 'id'
                }
            },
            AlertTypeId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                onDelete: "CASCADE",
                references: {
                    model: 'AlertTypes',
                    key: 'id'
                }
            },
            DeviceTypeId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                onDelete: "CASCADE",
                references: {
                    model: 'DeviceTypes',
                    key: 'id'
                }
            },
            EventTypeId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                onDelete: "CASCADE",
                references: {
                    model: 'EventTypes',
                    key: 'id'
                }
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Permissions');
    }
};