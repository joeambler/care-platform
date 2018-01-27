'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('UserClient', {
          UserId:{
              type : Sequelize.INTEGER,
              notNull : true,
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
          ClientId:{
              type : Sequelize.INTEGER,
              notNull : true,
              references: {
                  model: 'Clients',
                  key: 'id'
              },
          }
      });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('UserClient');

  }
};
