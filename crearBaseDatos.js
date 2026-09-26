const { Client } = require('pg');
const { configuracion } = require('../config/database');

// Crea la base de datos si todavía no existe, así el proyecto
// arranca con solo tener PostgreSQL instalado
async function crearBaseDatosSiNoExiste() {
  const cliente = new Client({
    host: configuracion.host,
    port: configuracion.puerto,
    user: configuracion.usuario,
    password: configuracion.clave,
    database: 'postgres'
  });

  await cliente.connect();

  try {
    const resultado = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [configuracion.nombre]);

    if (resultado.rowCount === 0) {
      const nombre = configuracion.nombre.replace(/"/g, '""');
      await cliente.query(`CREATE DATABASE "${nombre}"`);
      console.log(`Base de datos "${configuracion.nombre}" creada`);
    }
  } finally {
    await cliente.end();
  }
}

module.exports = crearBaseDatosSiNoExiste;
