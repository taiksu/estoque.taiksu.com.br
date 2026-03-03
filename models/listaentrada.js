'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListaEntrada extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ListaEntrada.hasMany(models.InsumosEntrada, { foreignKey: 'lista_entrada_id' });
    }
  }
  ListaEntrada.init({
    id : {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'unidade que vai receber os produtos'
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'responsavel pela entrada'
    },
    status: {
      type: DataTypes.ENUM('pendente', 'concluida'),
      allowNull: false,
      defaultValue: 'pendente',
      comment: 'concluida quando os produtos entraram no estoque'
    }
  }, {
    sequelize,
    modelName: 'ListaEntrada',
  });
  return ListaEntrada;
};