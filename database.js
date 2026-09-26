require('dotenv').config();
const { Sequelize } = require('sequelize');

const configuracion = {
  nombre: process.env.DB_NAME || 'supermercado',
  usuario: process.env.DB_USER || 'postgres',
  clave: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  puerto: Number(process.env.DB_PORT) || 5432
};

const sequelize = new Sequelize(configuracion.nombre, configuracion.usuario, configuracion.clave, {
  host: configuracion.host,
  port: configuracion.puerto,
  dialect: 'postgres',
  logging: false,
  timezone: '-05:00'
});

module.exports = { sequelize, configuracion };
