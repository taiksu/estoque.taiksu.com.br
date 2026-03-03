'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ListaEntradas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      unidade_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pendente', 'concluida'),
        allowNull: false,
        defaultValue: 'pendente',
        comment: 'concluida quando os produtos entraram no estoque'
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
    await queryInterface.addIndex('ListaEntradas', ['responsavel_id']);
    await queryInterface.addIndex('ListaEntradas', ['status']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ListaEntradas');
  }
};