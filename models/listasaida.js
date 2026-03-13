'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListaSaida extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ListaSaida.hasMany(models.InsumoSaida, { foreignKey: 'lista_saida_id' });
    }
  }
  ListaSaida.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pendente', 'concluida'),
      defaultValue: 'pendente'
    }
  }, {
    sequelize,
    modelName: 'ListaSaida',
    paranoid: true,
    indexes: [
      {
        fields: ['unidade_id', 'status']
      }
    ]
  });
  return ListaSaida;
};