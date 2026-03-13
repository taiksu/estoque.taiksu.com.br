'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoteInsumo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LoteInsumo.init({
    id: {
      primaryKey: true,
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4
    },
    insumo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantidade: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'Quantidade atual de insumo em kg ou unidade'
    },
    quantidade_original: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'Quantidade original de entrada'
    },
    valor_unitario: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: 'Valor do insumo serve para kg ou unidade'
    },
    valor_total: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      comment: 'Valor total do lote, valor unitario multiplicado pela quantidade'
    },
    data_entrada: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: 'Momento de entrada do lote no estoque'
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Responsável pela entrada do lote no estoque'
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Unidade a qual o lote pertence'
    },
    fornecedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Fornecedor do lote'
    },
    grupo_id: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      comment: 'ID do grupo de entrada'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de exclusão do lote'
    }
  }, {
    sequelize,
    modelName: 'LoteInsumo',
    paranoid: true,
    indexes: [
      {
        name: 'idx_unidade_id',
        fields: ['unidade_id']
      },
      {
        name: 'idx_loteinsumo_insumo_id',
        fields: ['insumo_id']
      },
      {
        name: 'idx_responsavel_id',
        fields: ['responsavel_id']
      },
      {
        name: 'idx_fornecedor_id',
        fields: ['fornecedor_id']
      },
      {
        name: 'idx_grupo_id',
        fields: ['grupo_id']
      }
    ]
  });
  return LoteInsumo;
};