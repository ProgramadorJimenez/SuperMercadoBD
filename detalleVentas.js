const { respuestaExito, respuestaError, cuerpo, parametroId, filtro, errorIdInvalido } = require('./comunes');

const noEncontrado = respuestaError('Detalle no encontrado', 'No existe un detalle de venta con id 99');
const sinStock = respuestaError('Stock insuficiente', 'Stock insuficiente para el producto');

const schemas = {
  DetalleVenta: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      saleId: { type: 'integer', example: 1 },
      productId: { type: 'integer', example: 1 },
      quantity: { type: 'integer', example: 2 },
      price: { type: 'number', example: 4200, description: 'Precio unitario al momento de la venta' },
      producto: {
        type: 'object',
        properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Leche entera 1L' } }
      },
      venta: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date-time' },
          total: { type: 'number', example: 12400 },
          userId: { type: 'integer', example: 2 }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  DetalleVentaEntrada: {
    type: 'object',
    required: ['saleId', 'productId', 'quantity'],
    properties: {
      saleId: { type: 'integer', description: 'Venta existente a la que se agrega el producto' },
      productId: { type: 'integer' },
      quantity: { type: 'integer', minimum: 1 }
    }
  },
  DetalleVentaActualizacion: {
    type: 'object',
    properties: {
      productId: { type: 'integer' },
      quantity: { type: 'integer', minimum: 1 }
    }
  }
};

const paths = {
  '/api/detalle-ventas': {
    get: {
      tags: ['Detalle de ventas'],
      summary: 'Listar detalles de venta',
      parameters: [
        filtro('ventaId', 'Detalles de una venta específica', 'integer'),
        filtro('productoId', 'Detalles donde aparece un producto', 'integer')
      ],
      responses: { 200: respuestaExito('Lista de detalles', 'DetalleVenta', true) }
    },
    post: {
      tags: ['Detalle de ventas'],
      summary: 'Agregar un producto a una venta existente',
      description: 'El precio se toma del producto, se descuenta el stock y se recalcula el total de la venta.',
      requestBody: cuerpo('DetalleVentaEntrada', { saleId: 1, productId: 3, quantity: 2 }),
      responses: {
        201: respuestaExito('Detalle creado', 'DetalleVenta'),
        400: respuestaError('Datos inválidos', 'La cantidad (quantity) es obligatoria y debe ser un número entero mayor a 0'),
        404: respuestaError('Venta o producto no encontrado', 'No existe una venta con id 99'),
        409: sinStock
      }
    }
  },
  '/api/detalle-ventas/{id}': {
    get: {
      tags: ['Detalle de ventas'],
      summary: 'Obtener un detalle de venta',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Detalle encontrado', 'DetalleVenta'), 400: errorIdInvalido, 404: noEncontrado }
    },
    put: {
      tags: ['Detalle de ventas'],
      summary: 'Actualizar un detalle de venta',
      description: 'Permite cambiar la cantidad o el producto. Se ajusta el stock y se recalcula el total de la venta.',
      parameters: [parametroId],
      requestBody: cuerpo('DetalleVentaActualizacion', { quantity: 5 }),
      responses: {
        200: respuestaExito('Detalle actualizado', 'DetalleVenta'),
        400: respuestaError('Datos inválidos', 'Debe enviar al menos uno de estos campos: productId, quantity'),
        404: noEncontrado,
        409: sinStock
      }
    },
    delete: {
      tags: ['Detalle de ventas'],
      summary: 'Eliminar un detalle de venta',
      description: 'Devuelve el stock y recalcula el total. No se permite eliminar el único producto de una venta.',
      parameters: [parametroId],
      responses: {
        200: respuestaExito('Detalle eliminado'),
        404: noEncontrado,
        409: respuestaError('Único producto de la venta', 'No se puede eliminar el único producto de la venta. Si desea anularla, elimine la venta completa')
      }
    }
  }
};

module.exports = { schemas, paths };
