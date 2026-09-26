const proveedores = require('./proveedores');
const productos = require('./productos');
const usuarios = require('./usuarios');
const ventas = require('./ventas');
const detalleVentas = require('./detalleVentas');

const modulos = [proveedores, productos, usuarios, ventas, detalleVentas];

const documentacion = {
  openapi: '3.0.3',
  info: {
    title: 'API Supermercado MarketSoft',
    version: '1.0.0',
    description: 'API REST para la gestión de proveedores, productos, usuarios y ventas de un supermercado. ' +
      'Todas las respuestas tienen el formato { ok, mensaje, datos } y en caso de error { ok, mensaje, errores }.'
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 3000}`, description: 'Servidor local' }],
  tags: [
    { name: 'Proveedores', description: 'Empresas que surten los productos del supermercado' },
    { name: 'Productos', description: 'Inventario de productos' },
    { name: 'Usuarios', description: 'Personal del supermercado y sus roles' },
    { name: 'Ventas', description: 'Ventas realizadas con cálculo automático del total' },
    { name: 'Detalle de ventas', description: 'Productos incluidos en cada venta' }
  ],
  paths: Object.assign({}, ...modulos.map((modulo) => modulo.paths)),
  components: {
    schemas: Object.assign({
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          mensaje: { type: 'string' },
          errores: {
            type: 'array',
            items: { type: 'object' },
            description: 'Detalle de los errores, cuando aplica'
          }
        }
      }
    }, ...modulos.map((modulo) => modulo.schemas))
  }
};

module.exports = documentacion;
