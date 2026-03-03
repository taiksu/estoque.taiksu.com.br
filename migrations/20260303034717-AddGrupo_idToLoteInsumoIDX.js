'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('LoteInsumos', 'grupo_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'ID do grupo de entrada',
      after: 'fornecedor_id'
    });
    await queryInterface.addIndex('LoteInsumos', ['grupo_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('LoteInsumos', ['grupo_id']);
    await queryInterface.removeColumn('LoteInsumos', 'grupo_id');
  }
};
