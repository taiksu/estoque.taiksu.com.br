'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsumosEntrada extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      InsumosEntrada.belongsTo(models.ListaEntrada, { foreignKey: 'lista_entrada_id' });
    }
  }
  InsumosEntrada.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    insumo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'insumo que vai ser adicionado'
    },
    quantidade: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'quantidade de insumo'
    },
    preco: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'preço do insumo'
    },
    fornecedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'fornecedor do insumo'
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'responsavel pela entrada'
    },
    lista_entrada_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'lista de entrada'
    }
  }, {
    sequelize,
    modelName: 'InsumosEntrada',
  });
  return InsumosEntrada;
};