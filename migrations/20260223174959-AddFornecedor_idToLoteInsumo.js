'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('LoteInsumos', 'fornecedor_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Fornecedor do lote',
      after: 'unidade_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('LoteInsumos', 'fornecedor_id');
  }
};
