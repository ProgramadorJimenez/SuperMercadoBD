const { Op } = require('sequelize');
const { Producto, Proveedor, DetalleVenta } = require('../models');
const { exito } = require('../views/respuesta');
const ErrorApi = require('../utils/ErrorApi');
const { extraerCampos, esEnteroPositivo } = require('../utils/validaciones');

const CAMPOS = ['name', 'description', 'price', 'stock', 'providerId'];
const DATOS_PROVEEDOR = { model: Proveedor, as: 'proveedor', attributes: ['id', 'name', 'city'] };

async function buscarProducto(id) {
  const producto = await Producto.findByPk(id);

  if (!producto) {
    throw new ErrorApi(`No existe un producto con id ${id}`, 404);
  }

  return producto;
}

async function verificarProveedor(providerId) {
  if (!esEnteroPositivo(providerId)) {
    throw new ErrorApi('El providerId es obligatorio y debe ser un número entero positivo', 400);
  }

  const proveedor = await Proveedor.findByPk(providerId);

  if (!proveedor) {
    throw new ErrorApi(`No existe un proveedor con id ${providerId}`, 404);
  }
}

async function listar(req, res, next) {
  try {
    const { nombre, proveedorId, stockMaximo } = req.query;
    const filtros = {};

    if (nombre) filtros.name = { [Op.iLike]: `%${nombre}%` };

    if (proveedorId !== undefined) {
      if (!esEnteroPositivo(proveedorId)) {
        throw new ErrorApi('El filtro proveedorId debe ser un número entero positivo', 400);
      }
      filtros.providerId = Number(proveedorId);
    }

    // Permite consultar productos con poco inventario, por ejemplo ?stockMaximo=10
    if (stockMaximo !== undefined) {
      if (!Number.isInteger(Number(stockMaximo)) || Number(stockMaximo) < 0) {
        throw new ErrorApi('El filtro stockMaximo debe ser un número entero mayor o igual a 0', 400);
      }
      filtros.stock = { [Op.lte]: Number(stockMaximo) };
    }

    const productos = await Producto.findAll({
      where: filtros,
      include: [DATOS_PROVEEDOR],
      order: [['id', 'ASC']]
    });

    return exito(res, productos, 'Productos obtenidos correctamente');
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const producto = await Producto.findByPk(req.params.id, { include: [DATOS_PROVEEDOR] });

    if (!producto) {
      throw new ErrorApi(`No existe un producto con id ${req.params.id}`, 404);
    }

    return exito(res, producto, 'Producto obtenido correctamente');
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const datos = extraerCampos(req.body, CAMPOS);
    await verificarProveedor(datos.providerId);

    const producto = await Producto.create(datos);
    await producto.reload({ include: [DATOS_PROVEEDOR] });

    return exito(res, producto, 'Producto creado correctamente', 201);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const producto = await buscarProducto(req.params.id);
    const datos = extraerCampos(req.body, CAMPOS);

    if (Object.keys(datos).length === 0) {
      throw new ErrorApi(`Debe enviar al menos uno de estos campos: ${CAMPOS.join(', ')}`, 400);
    }

    if (datos.providerId !== undefined) {
      await verificarProveedor(datos.providerId);
    }

    await producto.update(datos);
    await producto.reload({ include: [DATOS_PROVEEDOR] });

    return exito(res, producto, 'Producto actualizado correctamente');
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const producto = await buscarProducto(req.params.id);
    const vecesVendido = await DetalleVenta.count({ where: { productId: producto.id } });

    if (vecesVendido > 0) {
      throw new ErrorApi(
        `No se puede eliminar el producto porque aparece en ${vecesVendido} venta(s) registrada(s)`,
        409
      );
    }

    await producto.destroy();
    return exito(res, { id: producto.id }, 'Producto eliminado correctamente');
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
