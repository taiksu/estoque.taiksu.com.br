'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuantidadeMinima extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  QuantidadeMinima.init({
    id: {
      primaryKey: true,
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4
    },
    quantidade: {
      type: DataTypes.DECIMAL(8,3),
      allowNull: true,
      defaultValue: 0,
      comment: 'Quantidade mínima recomendada do insumo na unidade'
    },
    insumo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do insumo'
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID da unidade'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'QuantidadeMinima',
    paranoid: true,
    indexes: [
      {
        name: 'idx_unidade_id',
        fields: ['unidade_id']
      }
    ]
  });
  return QuantidadeMinima;
};