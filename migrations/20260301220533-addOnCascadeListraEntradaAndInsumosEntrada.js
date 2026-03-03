'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('InsumosEntradas', 'lista_entrada_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
            model: 'ListaEntradas',
            key: 'id'
        },
        onDelete: 'CASCADE'
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('InsumosEntradas', 'lista_entrada_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
            model: 'ListaEntradas',
            key: 'id'
        },
        onDelete: 'CASCADE'
    })
  }
};
