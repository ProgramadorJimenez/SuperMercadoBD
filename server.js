require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const { sequelize } = require('./src/models');
const rutas = require('./src/routes');
const documentacion = require('./src/docs/swagger');
const crearBaseDatosSiNoExiste = require('./src/utils/crearBaseDatos');
const rutaNoEncontrada = require('./src/middlewares/rutaNoEncontrada');
const manejadorErrores = require('./src/middlewares/manejadorErrores');
const { exito } = require('./src/views/respuesta');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => exito(res, {
  nombre: 'API Supermercado MarketSoft',
  version: '1.0.0',
  documentacion: '/api-docs',
  recursos: ['/api/proveedores', '/api/productos', '/api/usuarios', '/api/ventas', '/api/detalle-ventas']
}, 'API en funcionamiento'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(documentacion, {
  customSiteTitle: 'API Supermercado MarketSoft'
}));

app.use('/api', rutas);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

async function iniciar() {
  try {
    await crearBaseDatosSiNoExiste();
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida');

    await sequelize.sync();
    console.log('Tablas sincronizadas');

    app.listen(PUERTO, () => {
      console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
      console.log(`Documentación Swagger en http://localhost:${PUERTO}/api-docs`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    console.error('Verifique que PostgreSQL esté encendido y que los datos del archivo .env sean correctos');
    process.exit(1);
  }
}

iniciar();
