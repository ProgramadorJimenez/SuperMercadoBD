const { Op } = require('sequelize');
const { Usuario, Venta } = require('../models');
const { exito } = require('../views/respuesta');
const ErrorApi = require('../utils/ErrorApi');
const { extraerCampos } = require('../utils/validaciones');
const { ROLES, LISTA_ROLES, ROLES_QUE_VENDEN } = require('../config/roles');

const CAMPOS = ['name', 'email', 'role'];

async function buscarUsuario(id) {
  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    throw new ErrorApi(`No existe un usuario con id ${id}`, 404);
  }

  return usuario;
}

// El sistema nunca debe quedarse sin al menos un administrador
async function esUltimoAdministrador(usuario) {
  if (usuario.role !== 'administrador') return false;
  const administradores = await Usuario.count({ where: { role: 'administrador' } });
  return administradores <= 1;
}

async function listarRoles(req, res, next) {
  try {
    const roles = LISTA_ROLES.map((rol) => ({
      rol,
      descripcion: ROLES[rol],
      puedeRegistrarVentas: ROLES_QUE_VENDEN.includes(rol)
    }));

    return exito(res, roles, 'Roles obtenidos correctamente');
  } catch (error) {
    next(error);
  }
}

async function listar(req, res, next) {
  try {
    const { nombre, rol } = req.query;
    const filtros = {};

    if (nombre) filtros.name = { [Op.iLike]: `%${nombre}%` };

    if (rol) {
      if (!LISTA_ROLES.includes(rol.toLowerCase())) {
        throw new ErrorApi(`El rol no es válido. Roles permitidos: ${LISTA_ROLES.join(', ')}`, 400);
      }
      filtros.role = rol.toLowerCase();
    }

    const usuarios = await Usuario.findAll({ where: filtros, order: [['id', 'ASC']] });
    return exito(res, usuarios, 'Usuarios obtenidos correctamente');
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: [{ model: Venta, as: 'ventas', attributes: ['id', 'date', 'total'] }],
      order: [[{ model: Venta, as: 'ventas' }, 'date', 'DESC']]
    });

    if (!usuario) {
      throw new ErrorApi(`No existe un usuario con id ${req.params.id}`, 404);
    }

    return exito(res, usuario, 'Usuario obtenido correctamente');
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const usuario = await Usuario.create(extraerCampos(req.body, CAMPOS));
    return exito(res, usuario, 'Usuario creado correctamente', 201);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await buscarUsuario(req.params.id);
    const datos = extraerCampos(req.body, CAMPOS);

    if (Object.keys(datos).length === 0) {
      throw new ErrorApi(`Debe enviar al menos uno de estos campos: ${CAMPOS.join(', ')}`, 400);
    }

    const nuevoRol = typeof datos.role === 'string' ? datos.role.trim().toLowerCase() : datos.role;

    if (nuevoRol !== undefined && nuevoRol !== 'administrador' && await esUltimoAdministrador(usuario)) {
      throw new ErrorApi('No se puede cambiar el rol del único administrador del sistema', 409);
    }

    await usuario.update(datos);
    return exito(res, usuario, 'Usuario actualizado correctamente');
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const usuario = await buscarUsuario(req.params.id);

    if (await esUltimoAdministrador(usuario)) {
      throw new ErrorApi('No se puede eliminar al único administrador del sistema', 409);
    }

    const cantidadVentas = await Venta.count({ where: { userId: usuario.id } });

    if (cantidadVentas > 0) {
      throw new ErrorApi(
        `No se puede eliminar el usuario porque tiene ${cantidadVentas} venta(s) registrada(s)`,
        409
      );
    }

    await usuario.destroy();
    return exito(res, { id: usuario.id }, 'Usuario eliminado correctamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { listarRoles, listar, obtenerPorId, crear, actualizar, eliminar };
