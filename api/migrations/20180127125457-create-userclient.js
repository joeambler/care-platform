'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('UserClients', {
          UserId: {
              type: Sequelize.INTEGER,
              notNull: true,
              references: {
                  model: 'Users',
                  key: 'id'
              },
          },
          createdAt: {
              allowNull: false,
              type: Sequelize.DATE
          },
          updatedAt: {
              allowNull: false,
              type: Sequelize.DATE
          },
          ClientId: {
              type: Sequelize.INTEGER,
              notNull: true,
              references: {
                  model: 'Clients',
                  key: 'id'
              }
          },
          admin: {
              defaultValue: false,
              type: Sequelize.BOOLEAN
          },
          tentative: {
              defaultValue: false,
              type: Sequelize.BOOLEAN
          }
      });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('UserClient');

  }
};
