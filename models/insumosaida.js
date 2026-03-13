'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InsumoSaida extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      InsumoSaida.belongsTo(models.ListaSaida, { 
        foreignKey: 'lista_saida_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  InsumoSaida.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    insumo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'insumo que vai ser removido do estoque'
    },
    quantidade: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: false,
      comment: 'quantidade de insumo que vai ser removido do estoque'
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'responsavel pela saida'
    },
    lista_saida_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'lista de saida'
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'unidade que vai ser feita a saida',
      after: 'lista_saida_id'
    }
  }, {
    sequelize,
    modelName: 'InsumoSaida',
    indexes: [
      {
        fields: ['lista_saida_id']
      }
    ]
  });
  return InsumoSaida;
};