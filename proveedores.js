const { respuestaExito, respuestaError, cuerpo, parametroId, filtro, errorValidacion, errorIdInvalido } = require('./comunes');

const noEncontrado = respuestaError('Proveedor no encontrado', 'No existe un proveedor con id 99');

const ejemplo = {
  name: 'Alpina S.A.',
  phone: '6068812345',
  email: 'ventas@alpina.com.co',
  city: 'Manizales'
};

const schemas = {
  Proveedor: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Alpina S.A.' },
      phone: { type: 'string', example: '6068812345' },
      email: { type: 'string', example: 'ventas@alpina.com.co' },
      city: { type: 'string', example: 'Manizales' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  ProveedorEntrada: {
    type: 'object',
    required: ['name', 'phone', 'email', 'city'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      phone: { type: 'string', description: 'Entre 7 y 20 caracteres: números, espacios y + - ( )' },
      email: { type: 'string', format: 'email', description: 'Único entre proveedores' },
      city: { type: 'string', minLength: 2, maxLength: 80 }
    }
  }
};

const paths = {
  '/api/proveedores': {
    get: {
      tags: ['Proveedores'],
      summary: 'Listar proveedores',
      parameters: [
        filtro('nombre', 'Busca por coincidencia parcial en el nombre'),
        filtro('ciudad', 'Busca por coincidencia parcial en la ciudad')
      ],
      responses: { 200: respuestaExito('Lista de proveedores', 'Proveedor', true) }
    },
    post: {
      tags: ['Proveedores'],
      summary: 'Crear un proveedor',
      requestBody: cuerpo('ProveedorEntrada', ejemplo),
      responses: {
        201: respuestaExito('Proveedor creado', 'Proveedor'),
        400: errorValidacion,
        409: respuestaError('Correo duplicado', 'Ya existe un registro con esos datos')
      }
    }
  },
  '/api/proveedores/{id}': {
    get: {
      tags: ['Proveedores'],
      summary: 'Obtener un proveedor con sus productos',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Proveedor encontrado', 'Proveedor'), 400: errorIdInvalido, 404: noEncontrado }
    },
    put: {
      tags: ['Proveedores'],
      summary: 'Actualizar un proveedor',
      description: 'Se pueden enviar solo los campos que se desean modificar.',
      parameters: [parametroId],
      requestBody: cuerpo('ProveedorEntrada', { phone: '3104567890', city: 'Pereira' }),
      responses: {
        200: respuestaExito('Proveedor actualizado', 'Proveedor'),
        400: errorValidacion,
        404: noEncontrado,
        409: respuestaError('Correo duplicado', 'Ya existe un registro con esos datos')
      }
    },
    delete: {
      tags: ['Proveedores'],
      summary: 'Eliminar un proveedor',
      description: 'No se permite eliminar un proveedor que tenga productos asociados.',
      parameters: [parametroId],
      responses: {
        200: respuestaExito('Proveedor eliminado'),
        404: noEncontrado,
        409: respuestaError('Tiene productos asociados', 'No se puede eliminar el proveedor porque tiene 3 producto(s) asociado(s)')
      }
    }
  }
};

module.exports = { schemas, paths };
