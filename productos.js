const { respuestaExito, respuestaError, cuerpo, parametroId, filtro, errorValidacion, errorIdInvalido } = require('./comunes');

const noEncontrado = respuestaError('Producto no encontrado', 'No existe un producto con id 99');
const proveedorNoExiste = respuestaError('Producto o proveedor no encontrado', 'No existe un proveedor con id 15');

const ejemplo = {
  name: 'Leche entera 1L',
  description: 'Leche entera pasteurizada en bolsa',
  price: 4200,
  stock: 80,
  providerId: 1
};

const schemas = {
  Producto: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Leche entera 1L' },
      description: { type: 'string', nullable: true, example: 'Leche entera pasteurizada en bolsa' },
      price: { type: 'number', example: 4200 },
      stock: { type: 'integer', example: 80 },
      providerId: { type: 'integer', example: 1 },
      proveedor: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Alpina S.A.' },
          city: { type: 'string', example: 'Manizales' }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  ProductoEntrada: {
    type: 'object',
    required: ['name', 'price', 'providerId'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 120 },
      description: { type: 'string' },
      price: { type: 'number', description: 'Debe ser mayor a 0' },
      stock: { type: 'integer', minimum: 0, description: 'No puede ser negativo. Por defecto 0' },
      providerId: { type: 'integer', description: 'Id de un proveedor existente' }
    }
  }
};

const paths = {
  '/api/productos': {
    get: {
      tags: ['Productos'],
      summary: 'Listar productos',
      parameters: [
        filtro('nombre', 'Busca por coincidencia parcial en el nombre'),
        filtro('proveedorId', 'Productos de un proveedor específico', 'integer'),
        filtro('stockMaximo', 'Productos con stock menor o igual al valor (útil para ver qué reabastecer)', 'integer')
      ],
      responses: { 200: respuestaExito('Lista de productos', 'Producto', true), 400: errorValidacion }
    },
    post: {
      tags: ['Productos'],
      summary: 'Crear un producto',
      requestBody: cuerpo('ProductoEntrada', ejemplo),
      responses: {
        201: respuestaExito('Producto creado', 'Producto'),
        400: respuestaError('Datos inválidos', 'El precio debe ser mayor a 0'),
        404: proveedorNoExiste
      }
    }
  },
  '/api/productos/{id}': {
    get: {
      tags: ['Productos'],
      summary: 'Obtener un producto',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Producto encontrado', 'Producto'), 400: errorIdInvalido, 404: noEncontrado }
    },
    put: {
      tags: ['Productos'],
      summary: 'Actualizar un producto',
      description: 'Se pueden enviar solo los campos que se desean modificar, por ejemplo para ajustar el stock o el precio.',
      parameters: [parametroId],
      requestBody: cuerpo('ProductoEntrada', { price: 4500, stock: 120 }),
      responses: {
        200: respuestaExito('Producto actualizado', 'Producto'),
        400: respuestaError('Datos inválidos', 'El stock no puede ser negativo'),
        404: noEncontrado
      }
    },
    delete: {
      tags: ['Productos'],
      summary: 'Eliminar un producto',
      description: 'No se permite eliminar un producto que ya aparece en ventas registradas.',
      parameters: [parametroId],
      responses: {
        200: respuestaExito('Producto eliminado'),
        404: noEncontrado,
        409: respuestaError('Tiene ventas', 'No se puede eliminar el producto porque aparece en 2 venta(s) registrada(s)')
      }
    }
  }
};

module.exports = { schemas, paths };
