const { sequelize, DetalleVenta, Venta, Producto } = require('../models');
const { exito } = require('../views/respuesta');
const ErrorApi = require('../utils/ErrorApi');
const { esEnteroPositivo } = require('../utils/validaciones');
const { recalcularTotal } = require('../helpers/ventaHelper');

const INCLUIR_DETALLE = [
  { model: Producto, as: 'producto', attributes: ['id', 'name'] },
  { model: Venta, as: 'venta', attributes: ['id', 'date', 'total', 'userId'] }
];

function buscarDetalleCompleto(id) {
  return DetalleVenta.findByPk(id, { include: INCLUIR_DETALLE });
}

async function bloquearProducto(productId, transaction) {
  const producto = await Producto.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });

  if (!producto) {
    throw new ErrorApi(`No existe un producto con id ${productId}`, 404);
  }

  return producto;
}

function verificarStock(producto, cantidad) {
  if (producto.stock < cantidad) {
    throw new ErrorApi('Stock insuficiente para el producto', 409, [{
      productId: producto.id,
      producto: producto.name,
      disponible: producto.stock,
      solicitado: cantidad
    }]);
  }
}

async function verificarProductoNoRepetido(saleId, productId, transaction, idDetalleActual = null) {
  const existente = await DetalleVenta.findOne({ where: { saleId, productId }, transaction });

  if (existente && existente.id !== idDetalleActual) {
    throw new ErrorApi(
      `El producto ya está incluido en esta venta (detalle id ${existente.id}). Actualice la cantidad de ese detalle`,
      409
    );
  }
}

async function listar(req, res, next) {
  try {
    const { ventaId, productoId } = req.query;
    const filtros = {};

    if (ventaId !== undefined) {
      if (!esEnteroPositivo(ventaId)) {
        throw new ErrorApi('El filtro ventaId debe ser un número entero positivo', 400);
      }
      filtros.saleId = Number(ventaId);
    }

    if (productoId !== undefined) {
      if (!esEnteroPositivo(productoId)) {
        throw new ErrorApi('El filtro productoId debe ser un número entero positivo', 400);
      }
      filtros.productId = Number(productoId);
    }

    const detalles = await DetalleVenta.findAll({
      where: filtros,
      include: INCLUIR_DETALLE,
      order: [['saleId', 'DESC'], ['id', 'ASC']]
    });

    return exito(res, detalles, 'Detalles de venta obtenidos correctamente');
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const detalle = await buscarDetalleCompleto(req.params.id);

    if (!detalle) {
      throw new ErrorApi(`No existe un detalle de venta con id ${req.params.id}`, 404);
    }

    return exito(res, detalle, 'Detalle de venta obtenido correctamente');
  } catch (error) {
    next(error);
  }
}

// Agrega un producto a una venta existente
async function crear(req, res, next) {
  try {
    const { saleId, productId, quantity } = req.body || {};

    if (!esEnteroPositivo(saleId)) {
      throw new ErrorApi('El saleId es obligatorio y debe ser un número entero positivo', 400);
    }
    if (!esEnteroPositivo(productId)) {
      throw new ErrorApi('El productId es obligatorio y debe ser un número entero positivo', 400);
    }
    if (!esEnteroPositivo(quantity)) {
      throw new ErrorApi('La cantidad (quantity) es obligatoria y debe ser un número entero mayor a 0', 400);
    }

    const idDetalle = await sequelize.transaction(async (transaction) => {
      const venta = await Venta.findByPk(saleId, { transaction, lock: transaction.LOCK.UPDATE });

      if (!venta) {
        throw new ErrorApi(`No existe una venta con id ${saleId}`, 404);
      }

      await verificarProductoNoRepetido(venta.id, Number(productId), transaction);

      const producto = await bloquearProducto(productId, transaction);
      verificarStock(producto, Number(quantity));

      const detalle = await DetalleVenta.create({
        saleId: venta.id,
        productId: producto.id,
        quantity: Number(quantity),
        price: producto.price
      }, { transaction });

      await producto.decrement('stock', { by: Number(quantity), transaction });
      await recalcularTotal(venta.id, transaction);

      return detalle.id;
    });

    const detalle = await buscarDetalleCompleto(idDetalle);
    return exito(res, detalle, 'Producto agregado a la venta correctamente', 201);
  } catch (error) {
    next(error);
  }
}

// Permite cambiar la cantidad o el producto de un detalle
async function actualizar(req, res, next) {
  try {
    const { productId, quantity } = req.body || {};
    const { id } = req.params;

    if (productId === undefined && quantity === undefined) {
      throw new ErrorApi('Debe enviar al menos uno de estos campos: productId, quantity', 400);
    }
    if (productId !== undefined && !esEnteroPositivo(productId)) {
      throw new ErrorApi('El productId debe ser un número entero positivo', 400);
    }
    if (quantity !== undefined && !esEnteroPositivo(quantity)) {
      throw new ErrorApi('La cantidad (quantity) debe ser un número entero mayor a 0', 400);
    }

    await sequelize.transaction(async (transaction) => {
      const detalle = await DetalleVenta.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!detalle) {
        throw new ErrorApi(`No existe un detalle de venta con id ${id}`, 404);
      }

      const nuevoProductoId = productId !== undefined ? Number(productId) : detalle.productId;
      const nuevaCantidad = quantity !== undefined ? Number(quantity) : detalle.quantity;
      const cambiaProducto = nuevoProductoId !== detalle.productId;

      if (cambiaProducto) {
        await verificarProductoNoRepetido(detalle.saleId, nuevoProductoId, transaction, detalle.id);
      }

      // Se devuelve lo que tenía el detalle y luego se descuenta la nueva cantidad
      await Producto.increment('stock', {
        by: detalle.quantity,
        where: { id: detalle.productId },
        transaction
      });

      const producto = await bloquearProducto(nuevoProductoId, transaction);
      verificarStock(producto, nuevaCantidad);
      await producto.decrement('stock', { by: nuevaCantidad, transaction });

      detalle.productId = nuevoProductoId;
      detalle.quantity = nuevaCantidad;

      // Si se cambia de producto se toma su precio actual;
      // si es el mismo se conserva el precio con el que se vendió
      if (cambiaProducto) {
        detalle.price = producto.price;
      }

      await detalle.save({ transaction });
      await recalcularTotal(detalle.saleId, transaction);
    });

    const detalle = await buscarDetalleCompleto(id);
    return exito(res, detalle, 'Detalle de venta actualizado correctamente');
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await sequelize.transaction(async (transaction) => {
      const detalle = await DetalleVenta.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!detalle) {
        throw new ErrorApi(`No existe un detalle de venta con id ${id}`, 404);
      }

      const detallesDeLaVenta = await DetalleVenta.count({ where: { saleId: detalle.saleId }, transaction });

      if (detallesDeLaVenta <= 1) {
        throw new ErrorApi(
          'No se puede eliminar el único producto de la venta. Si desea anularla, elimine la venta completa',
          409
        );
      }

      await Producto.increment('stock', {
        by: detalle.quantity,
        where: { id: detalle.productId },
        transaction
      });

      await detalle.destroy({ transaction });
      const nuevoTotal = await recalcularTotal(detalle.saleId, transaction);

      return { id: detalle.id, saleId: detalle.saleId, nuevoTotalVenta: nuevoTotal };
    });

    return exito(res, resultado, 'Detalle eliminado, stock devuelto y total de la venta recalculado');
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
