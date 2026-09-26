const { Op } = require('sequelize');
const { Proveedor, Producto } = require('../models');
const { exito } = require('../views/respuesta');
const ErrorApi = require('../utils/ErrorApi');
const { extraerCampos } = require('../utils/validaciones');

const CAMPOS = ['name', 'phone', 'email', 'city'];

async function buscarProveedor(id) {
  const proveedor = await Proveedor.findByPk(id);

  if (!proveedor) {
    throw new ErrorApi(`No existe un proveedor con id ${id}`, 404);
  }

  return proveedor;
}

async function listar(req, res, next) {
  try {
    const { nombre, ciudad } = req.query;
    const filtros = {};

    if (nombre) filtros.name = { [Op.iLike]: `%${nombre}%` };
    if (ciudad) filtros.city = { [Op.iLike]: `%${ciudad}%` };

    const proveedores = await Proveedor.findAll({
      where: filtros,
      order: [['id', 'ASC']]
    });

    return exito(res, proveedores, 'Proveedores obtenidos correctamente');
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id, {
      include: [{ model: Producto, as: 'productos', attributes: ['id', 'name', 'price', 'stock'] }],
      order: [[{ model: Producto, as: 'productos' }, 'id', 'ASC']]
    });

    if (!proveedor) {
      throw new ErrorApi(`No existe un proveedor con id ${req.params.id}`, 404);
    }

    return exito(res, proveedor, 'Proveedor obtenido correctamente');
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const proveedor = await Proveedor.create(extraerCampos(req.body, CAMPOS));
    return exito(res, proveedor, 'Proveedor creado correctamente', 201);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const proveedor = await buscarProveedor(req.params.id);
    const datos = extraerCampos(req.body, CAMPOS);

    if (Object.keys(datos).length === 0) {
      throw new ErrorApi(`Debe enviar al menos uno de estos campos: ${CAMPOS.join(', ')}`, 400);
    }

    await proveedor.update(datos);
    return exito(res, proveedor, 'Proveedor actualizado correctamente');
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const proveedor = await buscarProveedor(req.params.id);
    const cantidadProductos = await Producto.count({ where: { providerId: proveedor.id } });

    if (cantidadProductos > 0) {
      throw new ErrorApi(
        `No se puede eliminar el proveedor porque tiene ${cantidadProductos} producto(s) asociado(s)`,
        409
      );
    }

    await proveedor.destroy();
    return exito(res, { id: proveedor.id }, 'Proveedor eliminado correctamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
