'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('UserClients', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'Clients',
          key: 'id',
        },
      },
      admin: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      tentative: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
    })
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('UserClients')

  },
}
