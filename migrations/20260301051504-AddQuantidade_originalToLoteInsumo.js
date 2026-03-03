'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('LoteInsumos', 'quantidade_original', {
      type: Sequelize.DECIMAL(8, 3),
      allowNull: false,
      comment: 'Quantidade original de entrada do lote de insumo em kg ou unidade',
      after: 'quantidade'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('LoteInsumos', 'quantidade_original');
  }
};
