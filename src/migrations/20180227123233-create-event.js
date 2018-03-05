'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Events', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            details: {
                type: Sequelize.STRING
            },
            date: {
                type: Sequelize.DATE,
                notNull:true
            },
            eventTypeId: {
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: 'EventTypes',
                    key: 'id'
                }
            },
            deviceInstanceId: {
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: 'DeviceInstances',
                    key: 'id'
                }
            },
            componentId: {
                type: Sequelize.INTEGER,
                onDelete: "CASCADE",
                references: {
                    model: 'ClientComponents',
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
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Events');
    }
};