'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListaBalanco extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Uma lista possui vários InsumoBalanco
      ListaBalanco.hasMany(models.InsumoBalanco, {
        foreignKey: 'lista_balanco_id'
      });
    }
  }
  ListaBalanco.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pendente', 'processado'),
      defaultValue: 'pendente',
      allowNull: true
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do usuário que efetuou o balanço'
    },
    total_anterior: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Valor total do estoque antes do balanço'
    },
    total_atualizado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Valor total do estoque depois do balanço'
    },
    efetuado_em: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data em que o balanço foi efetuado'
    }
  }, {
    sequelize,
    modelName: 'ListaBalanco',
    timestamps: true
  });
  return ListaBalanco;
};