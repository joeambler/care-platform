'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('ClientModules', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            key: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('event', 'model'),
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            apiEndPoint: {
                type: Sequelize.STRING,
                allowNull: true
            },
            clientId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Clients',
                    key: 'id'
                }
            }
         });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('ClientModules');
    }
};