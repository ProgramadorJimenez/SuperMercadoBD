const { respuestaExito, respuestaError, cuerpo, parametroId, filtro, errorValidacion, errorIdInvalido } = require('./comunes');
const { LISTA_ROLES } = require('../config/roles');

const noEncontrado = respuestaError('Usuario no encontrado', 'No existe un usuario con id 99');

const schemas = {
  Usuario: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Laura Gómez' },
      email: { type: 'string', example: 'laura.gomez@marketsoft.com' },
      role: { type: 'string', enum: LISTA_ROLES, example: 'cajero' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  UsuarioEntrada: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 3, maxLength: 100 },
      email: { type: 'string', format: 'email', description: 'Debe ser único' },
      role: { type: 'string', enum: LISTA_ROLES, description: 'Por defecto: cajero' }
    }
  },
  Rol: {
    type: 'object',
    properties: {
      rol: { type: 'string', example: 'cajero' },
      descripcion: { type: 'string', example: 'Registra las ventas en el punto de pago' },
      puedeRegistrarVentas: { type: 'boolean', example: true }
    }
  }
};

const paths = {
  '/api/usuarios/roles': {
    get: {
      tags: ['Usuarios'],
      summary: 'Listar los roles disponibles',
      responses: { 200: respuestaExito('Lista de roles', 'Rol', true) }
    }
  },
  '/api/usuarios': {
    get: {
      tags: ['Usuarios'],
      summary: 'Listar usuarios',
      parameters: [
        filtro('nombre', 'Busca por coincidencia parcial en el nombre'),
        filtro('rol', `Filtra por rol: ${LISTA_ROLES.join(', ')}`)
      ],
      responses: { 200: respuestaExito('Lista de usuarios', 'Usuario', true), 400: errorValidacion }
    },
    post: {
      tags: ['Usuarios'],
      summary: 'Crear un usuario',
      requestBody: cuerpo('UsuarioEntrada', { name: 'Laura Gómez', email: 'laura.gomez@marketsoft.com', role: 'cajero' }),
      responses: {
        201: respuestaExito('Usuario creado', 'Usuario'),
        400: errorValidacion,
        409: respuestaError('Correo duplicado', 'Ya existe un registro con esos datos')
      }
    }
  },
  '/api/usuarios/{id}': {
    get: {
      tags: ['Usuarios'],
      summary: 'Obtener un usuario con sus ventas',
      parameters: [parametroId],
      responses: { 200: respuestaExito('Usuario encontrado', 'Usuario'), 400: errorIdInvalido, 404: noEncontrado }
    },
    put: {
      tags: ['Usuarios'],
      summary: 'Actualizar un usuario',
      description: 'No se permite quitarle el rol al único administrador del sistema.',
      parameters: [parametroId],
      requestBody: cuerpo('UsuarioEntrada', { role: 'supervisor' }),
      responses: {
        200: respuestaExito('Usuario actualizado', 'Usuario'),
        400: errorValidacion,
        404: noEncontrado,
        409: respuestaError('Conflicto', 'No se puede cambiar el rol del único administrador del sistema')
      }
    },
    delete: {
      tags: ['Usuarios'],
      summary: 'Eliminar un usuario',
      description: 'No se permite eliminar un usuario con ventas registradas ni al único administrador.',
      parameters: [parametroId],
      responses: {
        200: respuestaExito('Usuario eliminado'),
        404: noEncontrado,
        409: respuestaError('Conflicto', 'No se puede eliminar el usuario porque tiene 4 venta(s) registrada(s)')
      }
    }
  }
};

module.exports = { schemas, paths };
