'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('QuantidadeMinimas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      insumo_id: {
        type: Sequelize.INTEGER
      },
      quantidade: {
        type: Sequelize.DECIMAL(8,3),
        allowNull: true,
        defaultValue: 0
      },
      unidade_id: {
        type:Sequelize.INTEGER,
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
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('QuantidadeMinimas', ['unidade_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('QuantidadeMinimas');  
    await queryInterface.removeIndex('QuantidadeMinimas', ['unidade_id']);
  }
};