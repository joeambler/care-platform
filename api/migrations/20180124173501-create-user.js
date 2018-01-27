'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {
                allowNull: false,
                unique: true,
                type: Sequelize.STRING
            },
            passwordHash: {
                allowNull: false,
                type: Sequelize.STRING
            },
            canAddModules: {
                defaultValue: false,
                type: Sequelize.BOOLEAN
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            nameId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Names',
                    key: 'id',
                    as: 'name'
                }
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Users');
    }
};