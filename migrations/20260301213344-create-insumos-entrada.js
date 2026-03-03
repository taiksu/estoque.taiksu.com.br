'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InsumosEntradas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      insumo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'insumo que vai ser adicionado'
      },
      quantidade: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        comment: 'quantidade de insumo'
      },
      fornecedor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'fornecedor do insumo'
      },
      responsavel_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'responsavel pela entrada'
      },
      lista_entrada_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'lista de entrada'
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
    await queryInterface.addConstraint('InsumosEntradas', {
      fields: ['lista_entrada_id'],
      type: 'foreign key',
      references: {
        table: 'ListaEntradas',
        field: 'id'
      }
    });
    await queryInterface.addIndex('InsumosEntradas', ['lista_entrada_id']);
    
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InsumosEntradas');
  }
};