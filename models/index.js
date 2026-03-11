'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

function parsePort(value) {
  const port = Number.parseInt(value, 10);
  return Number.isNaN(port) ? undefined : port;
}

function buildRuntimeConfig() {
  if (!process.env.DB_NAME || !process.env.DB_USER) {
    return null;
  }

  return {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parsePort(process.env.DB_PORT),
    dialect: process.env.DB_DIALECT || config.dialect,
  };
}

let sequelize;
const runtimeConfig = buildRuntimeConfig();

if (runtimeConfig && env !== 'test') {
  sequelize = new Sequelize(runtimeConfig.database, runtimeConfig.username, runtimeConfig.password, {
    ...config,
    host: runtimeConfig.host,
    port: runtimeConfig.port,
    dialect: runtimeConfig.dialect,
  });
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
