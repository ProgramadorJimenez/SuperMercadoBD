const { Op } = require('sequelize');
const { sequelize, Venta, Usuario, DetalleVenta } = require('../models');
const { exito } = require('../views/respuesta');
const ErrorApi = require('../utils/ErrorApi');
const { esEnteroPositivo } = require('../utils/validaciones');
const {
  INCLUIR_VENTA,
  validarVendedor,
  normalizarDetalles,
  registrarDetalles,
  devolverStock,
  recalcularTotal
} = require('../helpers/ventaHelper');

function buscarVentaCompleta(id) {
  return Venta.findByPk(id, {
    include: INCLUIR_VENTA,
    order: [[{ model: DetalleVenta, as: 'detalles' }, 'id', 'ASC']]
  });
}

function convertirFecha(valor, nombre) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorApi(`El filtro "${nombre}" no es una fecha válida (use el formato AAAA-MM-DD)`, 400);
  }

  return fecha;
}

async function listar(req, res, next) {
  try {
    const { usuarioId, desde, hasta } = req.query;
    const filtros = {};

    if (usuarioId !== undefined) {
      if (!esEnteroPositivo(usuarioId)) {
        throw new ErrorApi('El filtro usuarioId debe ser un número entero positivo', 400);
      }
      filtros.userId = Number(usuarioId);
    }

    if (desde || hasta) {
      filtros.date = {};
      if (desde) filtros.date[Op.gte] = convertirFecha(`${desde}T00:00:00-05:00`, 'desde');
      if (hasta) filtros.date[Op.lte] = convertirFecha(`${hasta}T23:59:59.999-05:00`, 'hasta');
    }

    const ventas = await Venta.findAll({
      where: filtros,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'name', 'role'] }],
      order: [['date', 'DESC'], ['id', 'DESC']]
    });

    return exito(res, ventas, 'Ventas obtenidas correctamente');
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const venta = await buscarVentaCompleta(req.params.id);

    if (!venta) {
      throw new ErrorApi(`No existe una venta con id ${req.params.id}`, 404);
    }

    return exito(res, venta, 'Venta obtenida correctamente');
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const cuerpo = req.body || {};

    const idVenta = await sequelize.transaction(async (transaction) => {
      await validarVendedor(cuerpo.userId, transaction);
      const items = normalizarDetalles(cuerpo.detalles);

      const datosVenta = { userId: Number(cuerpo.userId), total: 0 };
      if (cuerpo.date !== undefined) datosVenta.date = cuerpo.date;

      const venta = await Venta.create(datosVenta, { transaction });

      await registrarDetalles(venta.id, items, transaction);
      await recalcularTotal(venta.id, transaction);

      return venta.id;
    });

    const venta = await buscarVentaCompleta(idVenta);
    return exito(res, venta, 'Venta registrada correctamente', 201);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const cuerpo = req.body || {};
    const { id } = req.params;

    if (cuerpo.userId === undefined && cuerpo.date === undefined && cuerpo.detalles === undefined) {
      throw new ErrorApi('Debe enviar al menos uno de estos campos: userId, date, detalles', 400);
    }

    await sequelize.transaction(async (transaction) => {
      const venta = await Venta.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!venta) {
        throw new ErrorApi(`No existe una venta con id ${id}`, 404);
      }

      if (cuerpo.userId !== undefined) {
        await validarVendedor(cuerpo.userId, transaction);
        venta.userId = Number(cuerpo.userId);
      }

      if (cuerpo.date !== undefined) {
        venta.date = cuerpo.date;
      }

      await venta.save({ transaction });

      // Si llegan nuevos detalles se reemplazan los anteriores:
      // primero se devuelve el stock y luego se descuenta el nuevo
      if (cuerpo.detalles !== undefined) {
        const items = normalizarDetalles(cuerpo.detalles);

        await devolverStock(venta.id, transaction);
        await DetalleVenta.destroy({ where: { saleId: venta.id }, transaction });
        await registrarDetalles(venta.id, items, transaction);
        await recalcularTotal(venta.id, transaction);
      }
    });

    const venta = await buscarVentaCompleta(id);
    return exito(res, venta, 'Venta actualizada correctamente');
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const { id } = req.params;

    await sequelize.transaction(async (transaction) => {
      const venta = await Venta.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!venta) {
        throw new ErrorApi(`No existe una venta con id ${id}`, 404);
      }

      await devolverStock(venta.id, transaction);
      await DetalleVenta.destroy({ where: { saleId: venta.id }, transaction });
      await venta.destroy({ transaction });
    });

    return exito(res, { id: Number(id) }, 'Venta eliminada correctamente y stock devuelto al inventario');
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
