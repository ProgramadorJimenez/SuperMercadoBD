const { respuestaExito, respuestaError, cuerpo, parametroId, filtro, errorIdInvalido, referencia } = require('./comunes');

const noEncontrada = respuestaError('Venta no encontrada', 'No existe una venta con id 99');
const sinStock = {
  description: 'Stock insuficiente',
  content: {
    'application/json': {
      schema: referencia('Error'),
      example: {
        ok: false,
        mensaje: 'Stock insuficiente para uno o más productos',
        errores: [{ productId: 2, producto: 'Arroz Diana 500g', disponible: 3, solicitado: 5 }]
      }
    }
  }
};
const sinPermiso = respuestaError(
  'El usuario no puede vender',
  'El usuario "Carlos Ruiz" tiene el rol "bodeguero" y no puede registrar ventas. Roles autorizados: administrador, supervisor, cajero'
);

const schemas = {
  Venta: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      userId: { type: 'integer', example: 2 },
      date: { type: 'string', format: 'date-time' },
      total: { type: 'number', example: 12400, description: 'Calculado automáticamente' },
      usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Laura Gómez' },
          role: { type: 'string', example: 'cajero' }
        }
      },
      detalles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            productId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 2 },
            price: { type: 'number', example: 4200 },
            producto: {
              type: 'object',
              properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Leche entera 1L' } }
            }
          }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  VentaEntrada: {
    type: 'object',
    required: ['userId', 'detalles'],
    properties: {
      userId: { type: 'integer', description: 'Usuario con rol administrador, supervisor o cajero' },
      date: { type: 'string', format: 'date-time', description: 'Opcional. Por defecto la fecha actual. No puede ser futura' },
      detalles: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'integer' },
            quantity: { type: 'integer', minimum: 1 }
          }
        }
      }
    }
  }
};

const paths = {
  '/api/ventas': {
    get: {
      tags: ['Ventas'],
      summary: 'Listar ventas',
      parameters: [
        filtro('usuarioId', 'Ventas registradas por un usuario', 'integer'),
        filtro('desde', 'Fecha inicial (AAAA-MM-DD)'),
        filtro('hasta', 'Fecha final (AAAA-MM-DD)')
      ],
      responses: { 200: respuestaExito('Lista de ventas', 'Venta', true) }
    },
    post: {
      tags: ['Ventas'],
      summary: 'Registrar una venta',
      description: 'Registra la venta con sus productos en una sola operación. El precio de cada producto se toma del ' +
        'inventario, el total se calcula automáticamente y el stock se descuenta. Si un producto viene repetido ' +
        'se suman sus cantidades. Si algo falla no se guarda nada.',
      requestBody: cuerpo('VentaEntrada', {
        userId: 2,
        detalles: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 }
        ]
      }),
      responses: {
        201: respuestaExito('Venta registrada', 'Venta'),
        400: respuestaError('Datos inválidos', 'La venta debe incluir al menos un producto en el campo "detalles"'),
        403: sinPermiso,
        404: respuestaError('Usuario o producto no encontrado', 'No existen productos con id: 40'),
        409: sinStock
      }
    }
  },
  '/api/ventas/{id}': {
    get: {
      tags: ['Ventas'],
      summary: 'Obtener una venta con sus detalles',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Venta encontrada', 'Venta'), 400: errorIdInvalido, 404: noEncontrada }
    },
    put: {
      tags: ['Ventas'],
      summary: 'Actualizar una venta',
      description: 'Permite cambiar el usuario, la fecha o los productos. Si se envía "detalles" se reemplazan todos ' +
        'los productos de la venta: se devuelve el stock anterior, se descuenta el nuevo y se recalcula el total.',
      parameters: [parametroId],
      requestBody: cuerpo('VentaEntrada', { detalles: [{ productId: 1, quantity: 3 }] }),
      responses: {
        200: respuestaExito('Venta actualizada', 'Venta'),
        400: respuestaError('Datos inválidos', 'Debe enviar al menos uno de estos campos: userId, date, detalles'),
        403: sinPermiso,
        404: noEncontrada,
        409: sinStock
      }
    },
    delete: {
      tags: ['Ventas'],
      summary: 'Eliminar (anular) una venta',
      description: 'Elimina la venta y sus detalles y devuelve las unidades vendidas al inventario.',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Venta eliminada'), 404: noEncontrada }
    }
  }
};

module.exports = { schemas, paths };
