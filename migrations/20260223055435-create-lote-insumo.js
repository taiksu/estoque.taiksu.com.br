'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LoteInsumos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      insumo_id: {
        type: Sequelize.INTEGER
      },
      quantidade: {
        type: Sequelize.DECIMAL(8,3),
        allowNull: false
      },
      valor_unitario: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      valor_total: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      data_entrada: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unidade_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleteAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
    await queryInterface.addIndex('LoteInsumos', ['unidade_id']);
    await queryInterface.addIndex('LoteInsumos', ['insumo_id']);
    await queryInterface.addIndex('LoteInsumos', ['responsavel_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LoteInsumos');
  }
};