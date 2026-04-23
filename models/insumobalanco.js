'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsumoBalanco extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Um InsumoBalanco pertence a uma ListaBalanco
      InsumoBalanco.belongsTo(models.ListaBalanco, {
        foreignKey: 'lista_balanco_id',
        onDelete: 'CASCADE'
      });
    }
  }
  InsumoBalanco.init({
    id: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
     },
    lista_balanco_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    insumo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantidade_anterior: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      defaultValue: 0,
      comment: 'Quantidade do insumo antes do balanço'
    },
    quantidade_atualizada: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'Quantidade do insumo no momento do fechamento do balanço'
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'InsumoBalanco',
    // Um insumo deve ter apenas um registro por lista de balanço para não haver duplicidade quando atualizar quantidade
    indexes: [
      {
        unique: true,
        fields: ['lista_balanco_id', 'insumo_id']
      }
    ]
  });
  return InsumoBalanco;
};